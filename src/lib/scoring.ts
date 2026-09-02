/**
 * Motor de cálculo de puntajes: agrega las evaluaciones de uno o varios
 * evaluadores, calcula el estado de admisibilidad, el puntaje ponderado
 * final y la bonificación por potencial dinámico. Todo a partir de los
 * pesos y configuración guardados en la base de datos (ver config-store.ts),
 * para que el equipo gestor pueda ajustar ponderaciones sin tocar código.
 *
 * Portado 1:1 desde utils/scoring.py — misma lógica, mismas fórmulas.
 *
 * IMPORTANTE sobre rendimiento: las funciones de una sola postulación
 * (promedioEtapa, estadoAdmisibilidad, calcularBonificacion,
 * calcularResultadoFinal) consultan la base de datos directamente y están
 * pensadas para usarse UNA postulación a la vez (ej. la página Evaluación).
 * Para calcular el ranking de TODAS las postulaciones (Resultados,
 * Estadísticas), tablaRanking() NO llama a esas funciones en un loop -- eso
 * generaba una consulta a la base de datos por cada postulación y por cada
 * paso del cálculo (problema N+1), que con pocas postulaciones de prueba no
 * se notaba pero con datos reales importados hacía que la página se
 * demorara muchísimo o se quedara cargando indefinidamente. En su lugar,
 * tablaRanking() trae todo con un puñado de consultas (todas las
 * evaluaciones, todas las bonificaciones manuales, la configuración) y
 * calcula el resto en memoria con las mismas funciones puras que usa el
 * cálculo de una sola postulación.
 */
import { sql } from "@/lib/db";
import { getConfig, getConfigBonificacion, getSectoresEstrategicos } from "@/lib/config-store";
import {
  ETAPA_1,
  ETAPAS_POR_ID,
  calcularPuntajeCriterio,
  type FactorBonificacion,
} from "@/lib/rubric";
import type { Evaluacion, Postulacion } from "@/lib/types";
import { nombreCompleto, nombreProyecto } from "@/lib/types";

type ColumnaManual =
  | "valor_1_a_5"
  | "madurez_tecnologica_1_a_5"
  | "escalabilidad_1_a_5"
  | "traccion_1_a_5";

interface FilaBonificacionManual {
  valor_1_a_5: number | null;
  madurez_tecnologica_1_a_5: number | null;
  escalabilidad_1_a_5: number | null;
  traccion_1_a_5: number | null;
}

interface ConfigBonificacion {
  activa?: boolean;
  factores?: FactorBonificacion[];
  puntaje_maximo?: number;
}

async function evaluacionesDe(postulacionId: number, etapaId: string): Promise<Evaluacion[]> {
  const rows = await sql<Evaluacion[]>`
    select * from evaluaciones
    where postulacion_id = ${postulacionId} and etapa_id = ${etapaId}
  `;
  return rows;
}

// ---------------------------------------------------------------------------
// Funciones puras (sin consultas a la base de datos): reciben los datos ya
// cargados y calculan. Tanto las funciones de una sola postulación como
// tablaRanking() usan estas mismas funciones, así el cálculo es idéntico en
// los dos casos.
// ---------------------------------------------------------------------------

function puntajesPorEvaluadorDesdeLista(
  evaluaciones: Evaluacion[],
  etapaId: string
): Record<number, number> {
  const etapa = ETAPAS_POR_ID[etapaId];
  const criteriosIds = new Set(etapa.criterios.map((c) => c.id));

  const porEvaluador = new Map<number, Map<string, Evaluacion>>();
  for (const ev of evaluaciones) {
    if (ev.etapa_id !== etapaId) continue;
    if (!porEvaluador.has(ev.evaluador_id)) porEvaluador.set(ev.evaluador_id, new Map());
    porEvaluador.get(ev.evaluador_id)!.set(ev.criterio_id, ev);
  }

  const resultado: Record<number, number> = {};
  for (const [evaluadorId, respuestas] of porEvaluador) {
    const tieneTodos = [...criteriosIds].every((id) => respuestas.has(id));
    if (!tieneTodos) continue;
    let total = 0;
    for (const criterio of etapa.criterios) {
      const ev = respuestas.get(criterio.id)!;
      const puntos = ev.puntos ?? calcularPuntajeCriterio(ev.nivel_seleccionado, criterio);
      total += puntos * criterio.peso;
    }
    resultado[evaluadorId] = Math.round(total * 100) / 100;
  }
  return resultado;
}

function promedioEtapaDesdeLista(evaluaciones: Evaluacion[], etapaId: string): number | null {
  const puntajes = puntajesPorEvaluadorDesdeLista(evaluaciones, etapaId);
  const valores = Object.values(puntajes);
  if (valores.length === 0) return null;
  const promedio = valores.reduce((a, b) => a + b, 0) / valores.length;
  return Math.round(promedio * 100) / 100;
}

function estadoAdmisibilidadDesdeLista(
  evaluaciones: Evaluacion[]
): { estado: EstadoAdmisibilidad; puntaje: number | null } {
  const puntaje = promedioEtapaDesdeLista(evaluaciones, "etapa_1");
  if (puntaje === null) return { estado: "Pendiente", puntaje: null };
  const umbral = ETAPA_1.umbral_aprobacion ?? 50;
  return { estado: puntaje > umbral ? "Admisible" : "No admisible", puntaje };
}

function calcularBonificacionDesdeDatos(
  postulacion: Postulacion,
  config: ConfigBonificacion,
  filasManuales: FilaBonificacionManual[],
  sectoresEstrategicos: string[]
): { bono: number; detalle: Record<string, number> } {
  // El administrador puede marcar un proyecto puntual como "sin potencial
  // dinámico" (Seguimiento → Reportes consolidados por proyecto). Es un
  // multiplicador por cero a nivel de todo el proyecto: anula la
  // bonificación completa (factores automáticos Y cualitativos) sin
  // importar lo que hayan calificado los evaluadores o lo que el postulante
  // haya declarado en el formulario. No borra ni modifica ningún dato ya
  // guardado en bonificaciones_manuales -- si se desmarca, vuelve a
  // calcularse normalmente con todo lo que ya está guardado.
  if (postulacion.sin_potencial_dinamico) return { bono: 0, detalle: {} };
  if (config.activa === false) return { bono: 0, detalle: {} };

  const detalle: Record<string, number> = {};
  let totalPonderado = 0;
  let pesoTotal = 0;

  const campoPorFactor: Record<string, string | null> = {
    tipo_innovacion: postulacion.tipo_potencial_innovador,
    alcance_innovacion: postulacion.alcance_innovacion,
    financiamiento_previo: postulacion.ha_levantado_financiamiento,
  };

  const columnaManualPorFactor: Record<string, ColumnaManual> = {
    ambicion_proyeccion: "valor_1_a_5",
    madurez_tecnologica: "madurez_tecnologica_1_a_5",
    escalabilidad_modelo: "escalabilidad_1_a_5",
    traccion_temprana: "traccion_1_a_5",
  };

  function promedioManual(columna: ColumnaManual): number | null {
    const valores = filasManuales.map((f) => f[columna]).filter((v): v is number => v !== null);
    if (valores.length === 0) return null;
    return valores.reduce((a, b) => a + b, 0) / valores.length;
  }

  for (const factor of config.factores ?? []) {
    const peso = factor.peso ?? 0;
    let puntosFactor: number;

    const columnaManual = columnaManualPorFactor[factor.id];
    if (columnaManual) {
      const promedio1a5 = promedioManual(columnaManual);
      if (promedio1a5 === null) continue;
      puntosFactor = ((promedio1a5 - 1) / 4) * 10;
    } else if (factor.tipo === "lista_estrategica") {
      const valorPostulante = postulacion.sector_industria;
      if (!valorPostulante || !valorPostulante.trim()) continue;
      const sectorNormalizado = valorPostulante.trim().toLowerCase();
      const coincide = sectoresEstrategicos.some((s) => {
        const sNormalizado = s.trim().toLowerCase();
        if (!sNormalizado) return false;
        return sectorNormalizado.includes(sNormalizado) || sNormalizado.includes(sectorNormalizado);
      });
      puntosFactor = coincide ? 10 : 0;
    } else {
      const valorPostulante = campoPorFactor[factor.id];
      const mapeo = factor.mapeo ?? {};
      if (!valorPostulante || !(valorPostulante in mapeo)) continue;
      puntosFactor = mapeo[valorPostulante];
    }

    detalle[factor.id] = Math.round(puntosFactor * 100) / 100;
    totalPonderado += puntosFactor * peso;
    pesoTotal += peso;
  }

  if (pesoTotal === 0) return { bono: 0, detalle };

  const puntaje0a10 = totalPonderado / pesoTotal;
  const puntajeMaximo = config.puntaje_maximo ?? 10;
  const bonoFinal = Math.round(((puntaje0a10 / 10) * puntajeMaximo) * 100) / 100;
  return { bono: bonoFinal, detalle };
}

function calcularResultadoFinalDesdeDatos(
  postulacion: Postulacion,
  pesoEtapas: Record<string, number>,
  configBono: ConfigBonificacion,
  evaluaciones: Evaluacion[],
  filasManuales: FilaBonificacionManual[],
  sectoresEstrategicos: string[]
): ResultadoFinal {
  const { estado: estadoAdm, puntaje: puntajeAdm } = estadoAdmisibilidadDesdeLista(evaluaciones);
  const puntajeE2 = promedioEtapaDesdeLista(evaluaciones, "etapa_2");
  const puntajeE3 = promedioEtapaDesdeLista(evaluaciones, "etapa_3");
  const { bono, detalle: detalleBono } = calcularBonificacionDesdeDatos(
    postulacion,
    configBono,
    filasManuales,
    sectoresEstrategicos
  );

  const componentes: Array<[number, number]> = [];
  if (puntajeE2 !== null) componentes.push([puntajeE2, pesoEtapas.etapa_2 ?? 0]);
  if (puntajeE3 !== null) componentes.push([puntajeE3, pesoEtapas.etapa_3 ?? 0]);

  const pesoUsado = componentes.reduce((acc, [, p]) => acc + p, 0);
  const base = pesoUsado > 0 ? componentes.reduce((acc, [v, p]) => acc + v * p, 0) / pesoUsado : null;

  const puntajeFinal = base !== null ? Math.round((base + bono) * 100) / 100 : null;

  return {
    postulacion_id: postulacion.id,
    estado_admisibilidad: estadoAdm,
    puntaje_admisibilidad: puntajeAdm,
    puntaje_etapa_2: puntajeE2,
    puntaje_etapa_3: puntajeE3,
    bonificacion: bono,
    detalle_bonificacion: detalleBono,
    puntaje_base: base !== null ? Math.round(base * 100) / 100 : null,
    puntaje_final: puntajeFinal,
  };
}

// ---------------------------------------------------------------------------
// Funciones públicas para UNA postulación (consultan la base de datos
// directamente). Se usan en la página Evaluación, donde solo se calcula la
// postulación que se está viendo, así que no hay problema de rendimiento.
// ---------------------------------------------------------------------------

export async function puntajeEtapaPorEvaluador(
  postulacionId: number,
  etapaId: string
): Promise<Record<number, number>> {
  const evaluaciones = await evaluacionesDe(postulacionId, etapaId);
  return puntajesPorEvaluadorDesdeLista(evaluaciones, etapaId);
}

export async function promedioEtapa(postulacionId: number, etapaId: string): Promise<number | null> {
  const evaluaciones = await evaluacionesDe(postulacionId, etapaId);
  return promedioEtapaDesdeLista(evaluaciones, etapaId);
}

export type EstadoAdmisibilidad = "Admisible" | "No admisible" | "Pendiente";

export async function estadoAdmisibilidad(
  postulacionId: number
): Promise<{ estado: EstadoAdmisibilidad; puntaje: number | null }> {
  const evaluaciones = await evaluacionesDe(postulacionId, "etapa_1");
  return estadoAdmisibilidadDesdeLista(evaluaciones);
}

export async function calcularBonificacion(
  postulacion: Postulacion
): Promise<{ bono: number; detalle: Record<string, number> }> {
  const config = await getConfigBonificacion();
  const sectoresEstrategicos = await getSectoresEstrategicos();

  const filasManuales = await sql<FilaBonificacionManual[]>`
    select valor_1_a_5, madurez_tecnologica_1_a_5, escalabilidad_1_a_5, traccion_1_a_5
    from bonificaciones_manuales
    where postulacion_id = ${postulacion.id}
  `;

  return calcularBonificacionDesdeDatos(postulacion, config, filasManuales, sectoresEstrategicos);
}

export interface ResultadoFinal {
  postulacion_id: number;
  estado_admisibilidad: EstadoAdmisibilidad;
  puntaje_admisibilidad: number | null;
  puntaje_etapa_2: number | null;
  puntaje_etapa_3: number | null;
  bonificacion: number;
  detalle_bonificacion: Record<string, number>;
  puntaje_base: number | null;
  puntaje_final: number | null;
}

export async function calcularResultadoFinal(postulacion: Postulacion): Promise<ResultadoFinal> {
  const [pesoEtapas, configBono, evaluaciones, filasManuales, sectoresEstrategicos] = await Promise.all([
    getConfig<Record<string, number>>("peso_etapas"),
    getConfigBonificacion(),
    sql<Evaluacion[]>`select * from evaluaciones where postulacion_id = ${postulacion.id}`,
    sql<FilaBonificacionManual[]>`
      select valor_1_a_5, madurez_tecnologica_1_a_5, escalabilidad_1_a_5, traccion_1_a_5
      from bonificaciones_manuales
      where postulacion_id = ${postulacion.id}
    `,
    getSectoresEstrategicos(),
  ]);

  return calcularResultadoFinalDesdeDatos(
    postulacion,
    pesoEtapas,
    configBono,
    evaluaciones,
    filasManuales,
    sectoresEstrategicos
  );
}

// ---------------------------------------------------------------------------
// Ranking de TODAS las postulaciones (Resultados, Estadísticas): trae todo
// con un puñado de consultas y calcula en memoria, en vez de una consulta
// por postulación.
// ---------------------------------------------------------------------------

export interface FilaRanking {
  ranking: number;
  id: number;
  proyecto: string;
  postulante: string;
  comuna: string | null;
  genero: string | null;
  tipo: string | null;
  admisibilidad: EstadoAdmisibilidad;
  etapa2: number | null;
  etapa3: number | null;
  bonificacion: number;
  puntajeFinal: number | null;
}

const ORDEN_ADMISIBILIDAD: Record<EstadoAdmisibilidad, number> = {
  Admisible: 0,
  Pendiente: 1,
  "No admisible": 2,
};

export async function tablaRanking(postulaciones: Postulacion[]): Promise<FilaRanking[]> {
  if (postulaciones.length === 0) return [];

  const ids = postulaciones.map((p) => p.id);

  const [pesoEtapas, configBono, todasEvaluaciones, todasBonificaciones, sectoresEstrategicos] = await Promise.all([
    getConfig<Record<string, number>>("peso_etapas"),
    getConfigBonificacion(),
    sql<Evaluacion[]>`select * from evaluaciones where postulacion_id = any(${ids})`,
    sql<(FilaBonificacionManual & { postulacion_id: number })[]>`
      select postulacion_id, valor_1_a_5, madurez_tecnologica_1_a_5, escalabilidad_1_a_5, traccion_1_a_5
      from bonificaciones_manuales
      where postulacion_id = any(${ids})
    `,
    getSectoresEstrategicos(),
  ]);

  const evalPorPostulacion = new Map<number, Evaluacion[]>();
  for (const ev of todasEvaluaciones) {
    if (!evalPorPostulacion.has(ev.postulacion_id)) evalPorPostulacion.set(ev.postulacion_id, []);
    evalPorPostulacion.get(ev.postulacion_id)!.push(ev);
  }

  const bonoPorPostulacion = new Map<number, FilaBonificacionManual[]>();
  for (const b of todasBonificaciones) {
    if (!bonoPorPostulacion.has(b.postulacion_id)) bonoPorPostulacion.set(b.postulacion_id, []);
    bonoPorPostulacion.get(b.postulacion_id)!.push(b);
  }

  const filas: Omit<FilaRanking, "ranking">[] = postulaciones.map((p) => {
    const evaluaciones = evalPorPostulacion.get(p.id) ?? [];
    const filasManuales = bonoPorPostulacion.get(p.id) ?? [];
    const r = calcularResultadoFinalDesdeDatos(
      p,
      pesoEtapas,
      configBono,
      evaluaciones,
      filasManuales,
      sectoresEstrategicos
    );
    return {
      id: p.id,
      proyecto: nombreProyecto(p),
      postulante: nombreCompleto(p),
      comuna: p.comuna,
      genero: p.genero,
      tipo: p.tipo_emprendimiento,
      admisibilidad: r.estado_admisibilidad,
      etapa2: r.puntaje_etapa_2,
      etapa3: r.puntaje_etapa_3,
      bonificacion: r.bonificacion,
      puntajeFinal: r.puntaje_final,
    };
  });

  // Las postulaciones "No admisibles" quedan fuera de la fase siguiente según
  // las bases (punto 4.5.1), por lo que se ordenan después de las admisibles
  // y las pendientes, aunque tengan un puntaje calculado (se muestra solo
  // como referencia informativa, no participan del cupo final).
  filas.sort((a, b) => {
    const ordenA = ORDEN_ADMISIBILIDAD[a.admisibilidad] ?? 1;
    const ordenB = ORDEN_ADMISIBILIDAD[b.admisibilidad] ?? 1;
    if (ordenA !== ordenB) return ordenA - ordenB;
    const pa = a.puntajeFinal ?? -Infinity;
    const pb = b.puntajeFinal ?? -Infinity;
    return pb - pa;
  });

  return filas.map((f, i) => ({ ranking: i + 1, ...f }));
}
