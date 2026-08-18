import { sql } from "@/lib/db";

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
): Promise<{ valor_1_a_5: number | null; comentario: string | null } | null> {
  const rows = await sql<{ valor_1_a_5: number | null; comentario: string | null }[]>`
    select valor_1_a_5, comentario from bonificaciones_manuales
    where postulacion_id = ${postulacionId} and evaluador_id = ${evaluadorId}
  `;
  return rows[0] ?? null;
}
