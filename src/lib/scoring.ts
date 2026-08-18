/**
 * Motor de cálculo de puntajes: agrega las evaluaciones de uno o varios
 * evaluadores, calcula el estado de admisibilidad, el puntaje ponderado
 * final y la bonificación por potencial dinámico. Todo a partir de los
 * pesos y configuración guardados en la base de datos (ver config-store.ts),
 * para que el equipo gestor pueda ajustar ponderaciones sin tocar código.
 *
 * Portado 1:1 desde utils/scoring.py — misma lógica, mismas fórmulas.
 */
import { sql } from "@/lib/db";
import { getConfig } from "@/lib/config-store";
import {
  ETAPA_1,
  ETAPAS_POR_ID,
  calcularPuntajeCriterio,
  type FactorBonificacion,
} from "@/lib/rubric";
import type { Evaluacion, Postulacion } from "@/lib/types";
import { nombreCompleto, nombreProyecto } from "@/lib/types";

async function evaluacionesDe(postulacionId: number, etapaId: string): Promise<Evaluacion[]> {
  const rows = await sql<Evaluacion[]>`
    select * from evaluaciones
    where postulacion_id = ${postulacionId} and etapa_id = ${etapaId}
  `;
  return rows;
}

export async function puntajeEtapaPorEvaluador(
  postulacionId: number,
  etapaId: string
): Promise<Record<number, number>> {
  const etapa = ETAPAS_POR_ID[etapaId];
  const criteriosIds = new Set(etapa.criterios.map((c) => c.id));

  const evaluaciones = await evaluacionesDe(postulacionId, etapaId);
  const porEvaluador = new Map<number, Map<string, Evaluacion>>();
  for (const ev of evaluaciones) {
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

export async function promedioEtapa(postulacionId: number, etapaId: string): Promise<number | null> {
  const puntajes = await puntajeEtapaPorEvaluador(postulacionId, etapaId);
  const valores = Object.values(puntajes);
  if (valores.length === 0) return null;
  const promedio = valores.reduce((a, b) => a + b, 0) / valores.length;
  return Math.round(promedio * 100) / 100;
}

export type EstadoAdmisibilidad = "Admisible" | "No admisible" | "Pendiente";

export async function estadoAdmisibilidad(
  postulacionId: number
): Promise<{ estado: EstadoAdmisibilidad; puntaje: number | null }> {
  const puntaje = await promedioEtapa(postulacionId, "etapa_1");
  if (puntaje === null) return { estado: "Pendiente", puntaje: null };
  const umbral = ETAPA_1.umbral_aprobacion ?? 50;
  return { estado: puntaje > umbral ? "Admisible" : "No admisible", puntaje };
}

export async function calcularBonificacion(
  postulacion: Postulacion
): Promise<{ bono: number; detalle: Record<string, number> }> {
  const config = await getConfig<{
    activa?: boolean;
    factores?: FactorBonificacion[];
    puntaje_maximo?: number;
  }>("bonificacion");

  if (config.activa === false) return { bono: 0, detalle: {} };

  const detalle: Record<string, number> = {};
  let totalPonderado = 0;
  let pesoTotal = 0;

  const campoPorFactor: Record<string, string | null> = {
    tipo_innovacion: postulacion.tipo_potencial_innovador,
    alcance_innovacion: postulacion.alcance_innovacion,
    financiamiento_previo: postulacion.ha_levantado_financiamiento,
  };

  for (const factor of config.factores ?? []) {
    const peso = factor.peso ?? 0;
    let puntosFactor: number;

    if (factor.id === "ambicion_proyeccion") {
      const rows = await sql<{ valor_1_a_5: number | null }[]>`
        select valor_1_a_5 from bonificaciones_manuales
        where postulacion_id = ${postulacion.id} and valor_1_a_5 is not null
      `;
      const valores = rows.map((r) => r.valor_1_a_5).filter((v): v is number => v !== null);
      if (valores.length === 0) continue;
      const promedio1a5 = valores.reduce((a, b) => a + b, 0) / valores.length;
      puntosFactor = ((promedio1a5 - 1) / 4) * 10;
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
  const pesoEtapas = await getConfig<Record<string, number>>("peso_etapas");

  const { estado: estadoAdm, puntaje: puntajeAdm } = await estadoAdmisibilidad(postulacion.id);
  const puntajeE2 = await promedioEtapa(postulacion.id, "etapa_2");
  const puntajeE3 = await promedioEtapa(postulacion.id, "etapa_3");
  const { bono, detalle: detalleBono } = await calcularBonificacion(postulacion);

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
  const filas: Omit<FilaRanking, "ranking">[] = [];
  for (const p of postulaciones) {
    const r = await calcularResultadoFinal(p);
    filas.push({
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
    });
  }

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
