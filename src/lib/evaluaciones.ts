import { sql } from "@/lib/db";
import type { BonificacionManualValores } from "@/lib/types";
import type { FilaBonoManualValores } from "@/lib/rubric";

export async function respuestasEvaluador(
  postulacionId: number,
  evaluadorId: number,
  etapaId: string
): Promise<{ respuestas: Record<string, string | null>; comentario: string }> {
  const rows = await sql<{ criterio_id: string; nivel_seleccionado: string | null; comentario: string | null }[]>`
    select criterio_id, nivel_seleccionado, comentario from evaluaciones
    where postulacion_id = ${postulacionId} and evaluador_id = ${evaluadorId} and etapa_id = ${etapaId}
  `;
  const respuestas: Record<string, string | null> = {};
  let comentario = "";
  for (const r of rows) {
    respuestas[r.criterio_id] = r.nivel_seleccionado;
    if (r.comentario) comentario = r.comentario;
  }
  return { respuestas, comentario };
}

export async function bonoManualEvaluador(
  postulacionId: number,
  evaluadorId: number
): Promise<BonificacionManualValores | null> {
  const rows = await sql<BonificacionManualValores[]>`
    select valor_1_a_5, madurez_tecnologica_1_a_5, escalabilidad_1_a_5, traccion_1_a_5, comentario
    from bonificaciones_manuales
    where postulacion_id = ${postulacionId} and evaluador_id = ${evaluadorId}
  `;
  return rows[0] ?? null;
}

/**
 * Filas de bonificaciones_manuales de TODOS los demás evaluadores (sin
 * incluir al actual) para una postulación. Se usa para recalcular en el
 * navegador, en tiempo real, cuál sería el promedio de cada factor
 * cualitativo si el evaluador actual guardara el valor que su slider tiene
 * en este momento (ver calcularBonoEnVivo en lib/rubric.ts).
 */
export async function bonoManualDeOtrosEvaluadores(
  postulacionId: number,
  evaluadorIdActual: number
): Promise<FilaBonoManualValores[]> {
  return sql<FilaBonoManualValores[]>`
    select valor_1_a_5, madurez_tecnologica_1_a_5, escalabilidad_1_a_5, traccion_1_a_5
    from bonificaciones_manuales
    where postulacion_id = ${postulacionId} and evaluador_id != ${evaluadorIdActual}
  `;
}
