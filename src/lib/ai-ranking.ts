/**
 * Ranking informativo generado por IA para TODAS las postulaciones a la vez
 * (página exclusiva de administrador/a "🤖 Ranking IA"). Reutiliza
 * exactamente la misma función de cálculo que usa el ranking oficial
 * (calcularResultadoFinalDesdeDatos, en scoring.ts), pero alimentada con los
 * NIVELES QUE SUGIERE LA IA en vez de con evaluaciones humanas -- así el
 * puntaje se calcula con la misma fórmula, los mismos pesos configurados en
 * Configuración → ⚖️ Pesos entre etapas, y el mismo umbral de admisibilidad
 * que ya usa Resultados, sin duplicar esa lógica.
 *
 * Como la IA no puede evaluar la Etapa 3 (Entrevista personal -- depende de
 * una conversación real con la persona postulante), simplemente no se le
 * pasa ninguna evaluación de esa etapa a calcularResultadoFinalDesdeDatos:
 * esa función ya sabe repartir el 100% del peso entre los componentes que sí
 * tienen dato (ver "pesoUsado" en scoring.ts), así que el puntaje final
 * queda compuesto solo por Etapa 2 + Bonificación, sin necesitar ninguna
 * fórmula nueva ni distinta a la oficial.
 *
 * IMPORTANTE: este módulo NUNCA lee ni escribe en `evaluaciones` ni en
 * `bonificaciones_manuales` -- guarda sus resultados en su propia tabla
 * (`ranking_ia`), completamente separada, para no interferir jamás con el
 * ranking oficial ni con el trabajo del panel evaluador humano.
 */
import { sql } from "@/lib/db";
import { getConfig, getConfigBonificacion, getSectoresEstrategicos } from "@/lib/config-store";
import { calcularResultadoFinalDesdeDatos, ESTADO_YA_FACTURANDO, type EstadoAdmisibilidad } from "@/lib/scoring";
import { generarEvaluacionCompletaIA, type SugerenciaCriterio } from "@/lib/ai-evaluacion-completa";
import type { SugerenciaIA } from "@/lib/ai-sugerencia";
import { listarPostulaciones, obtenerPostulacion } from "@/lib/postulaciones";
import { nombreCompleto, nombreProyecto, type Evaluacion } from "@/lib/types";

// Construye evaluaciones "de mentira" a partir de las sugerencias de la IA
// (una por criterio), con el único fin de reutilizar sin cambios la misma
// lógica de ponderación (calcularPuntajeCriterio + criterio.peso) que ya usa
// scoring.ts para evaluaciones reales. evaluador_id = -1 es un id ficticio
// que representa "la IA", no un evaluador real -- estas filas nunca se
// guardan en la tabla evaluaciones, solo viven en memoria durante este
// cálculo.
function evaluacionesDesdeSugerenciasIA(
  postulacionId: number,
  etapaId: string,
  sugerencias: Record<string, SugerenciaCriterio>
): Evaluacion[] {
  const ahora = new Date().toISOString();
  return Object.entries(sugerencias).map(([criterioId, s]) => ({
    id: 0,
    postulacion_id: postulacionId,
    evaluador_id: -1,
    etapa_id: etapaId,
    criterio_id: criterioId,
    nivel_seleccionado: s.nivel_sugerido,
    puntos: null,
    comentario: null,
    creado_en: ahora,
    actualizado_en: ahora,
  }));
}

/**
 * Genera y GUARDA (reemplazando lo que hubiera antes) el resultado IA de UNA
 * sola postulación. Pensado para llamarse una postulación a la vez, en un
 * bucle disparado desde el navegador (ver actions/ia.ts y RankingIATabla.tsx)
 * -- así cada llamada al servidor solo hace las 3 llamadas a la API de una
 * postulación, evitando el límite de tiempo de las funciones de Vercel que
 * se alcanzaría si se intentaran procesar todas las postulaciones de un solo
 * golpe.
 */
export async function generarYGuardarRankingIA(postulacionId: number): Promise<void> {
  const postulacion = await obtenerPostulacion(postulacionId);
  if (!postulacion) throw new Error("Postulación no encontrada.");

  const [pesoEtapas, configBono, sectoresEstrategicos, ia] = await Promise.all([
    getConfig<Record<string, number>>("peso_etapas"),
    getConfigBonificacion(),
    getSectoresEstrategicos(),
    generarEvaluacionCompletaIA(postulacion),
  ]);

  const evaluacionesFalsas = [
    ...evaluacionesDesdeSugerenciasIA(postulacionId, "etapa_1", ia.etapa1),
    ...evaluacionesDesdeSugerenciasIA(postulacionId, "etapa_2", ia.etapa2),
  ];

  const filaBonoFalsa = {
    valor_1_a_5: ia.bono.ambicion_proyeccion.valor_1_a_5,
    madurez_tecnologica_1_a_5: ia.bono.madurez_tecnologica.valor_1_a_5,
    escalabilidad_1_a_5: ia.bono.escalabilidad_modelo.valor_1_a_5,
    traccion_1_a_5: ia.bono.traccion_temprana.valor_1_a_5,
  };

  const resultado = calcularResultadoFinalDesdeDatos(
    postulacion,
    pesoEtapas,
    configBono,
    evaluacionesFalsas,
    [filaBonoFalsa],
    sectoresEstrategicos
  );

  const etapa1Json = JSON.stringify(ia.etapa1);
  const etapa2Json = JSON.stringify(ia.etapa2);
  const bonoJson = JSON.stringify(ia.bono);

  await sql`
    insert into ranking_ia (
      postulacion_id, etapa1, etapa2, bono,
      estado_admisibilidad, puntaje_admisibilidad, puntaje_etapa2, puntaje_bono, puntaje_final,
      generado_en
    ) values (
      ${postulacionId}, ${etapa1Json}, ${etapa2Json}, ${bonoJson},
      ${resultado.estado_admisibilidad}, ${resultado.puntaje_admisibilidad},
      ${resultado.puntaje_etapa_2}, ${resultado.bonificacion}, ${resultado.puntaje_final},
      now()
    )
    on conflict (postulacion_id) do update set
      etapa1 = excluded.etapa1,
      etapa2 = excluded.etapa2,
      bono = excluded.bono,
      estado_admisibilidad = excluded.estado_admisibilidad,
      puntaje_admisibilidad = excluded.puntaje_admisibilidad,
      puntaje_etapa2 = excluded.puntaje_etapa2,
      puntaje_bono = excluded.puntaje_bono,
      puntaje_final = excluded.puntaje_final,
      generado_en = excluded.generado_en
  `;
}

/** Borra TODO el Ranking IA guardado (no toca postulaciones, evaluaciones ni
 * bonificaciones_manuales -- esta tabla es puramente informativa y se puede
 * regenerar en cualquier momento sin perder ningún dato real). */
export async function borrarRankingIA(): Promise<void> {
  await sql`delete from ranking_ia`;
}

export interface EstadoRankingIA {
  total: number;
  generadas: number;
  pendientes: { id: number; label: string }[];
}

/**
 * Compara la lista de postulaciones contra lo que ya está en ranking_ia,
 * para que la pantalla sepa cuántas faltan por generar y pueda seguir
 * exactamente donde quedó si el proceso se interrumpe (por ejemplo, si se
 * cierra la pestaña del navegador a mitad de camino) -- basta con volver a
 * presionar "Generar" y solo se procesan las que todavía no tienen fila.
 */
export async function estadoRankingIA(): Promise<EstadoRankingIA> {
  const [postulaciones, filas] = await Promise.all([
    listarPostulaciones(),
    sql<{ postulacion_id: number }[]>`select postulacion_id from ranking_ia`,
  ]);
  const generadasSet = new Set(filas.map((f) => f.postulacion_id));
  const pendientes = postulaciones
    .filter((p) => !generadasSet.has(p.id))
    .map((p) => ({ id: p.id, label: `#${p.id} · ${nombreProyecto(p)} — ${nombreCompleto(p)}` }));
  return { total: postulaciones.length, generadas: generadasSet.size, pendientes };
}

export interface FilaRankingIA {
  ranking: number;
  id: number;
  proyecto: string;
  postulante: string;
  admisibilidad: EstadoAdmisibilidad;
  puntajeEtapa2: number | null;
  puntajeBono: number | null;
  puntajeFinal: number | null;
  yaFacturando: boolean;
  generadoEn: string;
  etapa1: Record<string, SugerenciaCriterio>;
  etapa2: Record<string, SugerenciaCriterio>;
  bono: SugerenciaIA;
}

interface FilaRankingIACruda {
  postulacion_id: number;
  estado_admisibilidad: EstadoAdmisibilidad;
  puntaje_admisibilidad: number | null;
  puntaje_etapa2: number | null;
  puntaje_bono: number | null;
  puntaje_final: number | null;
  generado_en: string;
  etapa1: Record<string, SugerenciaCriterio>;
  etapa2: Record<string, SugerenciaCriterio>;
  bono: SugerenciaIA;
  nombre_emprendimiento: string | null;
  nombre_empresa: string | null;
  nombres: string | null;
  apellido_paterno: string | null;
  apellido_materno: string | null;
  estado_detalle: string | null;
}

const ORDEN_ADMISIBILIDAD: Record<EstadoAdmisibilidad, number> = {
  Admisible: 0,
  Pendiente: 1,
  "No admisible": 2,
};

/**
 * Lee el Ranking IA ya generado (no llama a la IA ni gasta nada -- solo lee
 * lo que ya está guardado en ranking_ia), ordenado con el mismo criterio que
 * el ranking oficial: primero Admisibles, luego Pendientes, luego No
 * admisibles, y dentro de cada grupo de mayor a menor puntaje final.
 */
export async function obtenerRankingIA(): Promise<FilaRankingIA[]> {
  const filas = await sql<FilaRankingIACruda[]>`
    select
      r.postulacion_id, r.estado_admisibilidad, r.puntaje_admisibilidad,
      r.puntaje_etapa2, r.puntaje_bono, r.puntaje_final, r.generado_en,
      r.etapa1, r.etapa2, r.bono,
      p.nombre_emprendimiento, p.nombre_empresa, p.nombres, p.apellido_paterno, p.apellido_materno,
      p.estado_detalle
    from ranking_ia r
    join postulaciones p on p.id = r.postulacion_id
  `;

  const sinRanking: Omit<FilaRankingIA, "ranking">[] = filas.map((f) => ({
    id: f.postulacion_id,
    proyecto:
      f.nombre_emprendimiento || f.nombre_empresa || "(sin nombre)",
    postulante: [f.nombres, f.apellido_paterno, f.apellido_materno].filter(Boolean).join(" "),
    admisibilidad: f.estado_admisibilidad,
    puntajeEtapa2: f.puntaje_etapa2,
    puntajeBono: f.puntaje_bono,
    puntajeFinal: f.puntaje_final,
    yaFacturando: f.estado_detalle === ESTADO_YA_FACTURANDO,
    generadoEn: f.generado_en,
    etapa1: f.etapa1,
    etapa2: f.etapa2,
    bono: f.bono,
  }));

  sinRanking.sort((a, b) => {
    const ordenA = ORDEN_ADMISIBILIDAD[a.admisibilidad] ?? 1;
    const ordenB = ORDEN_ADMISIBILIDAD[b.admisibilidad] ?? 1;
    if (ordenA !== ordenB) return ordenA - ordenB;
    const pa = a.puntajeFinal ?? -Infinity;
    const pb = b.puntajeFinal ?? -Infinity;
    return pb - pa;
  });

  return sinRanking.map((f, i) => ({ ranking: i + 1, ...f }));
}
