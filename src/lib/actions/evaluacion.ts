"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { sql } from "@/lib/db";
import { ETAPAS_POR_ID, calcularPuntajeCriterio } from "@/lib/rubric";

export async function guardarEvaluacionEtapa(
  postulacionId: number,
  etapaId: string,
  respuestas: Record<string, string | null>,
  comentario: string
): Promise<{ faltantes: string[] }> {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado.");
  const evaluadorId = Number(session.user.id);
  const etapa = ETAPAS_POR_ID[etapaId];
  if (!etapa) throw new Error("Etapa inválida.");

  const faltantes: string[] = [];
  for (const criterio of etapa.criterios) {
    const nivel = respuestas[criterio.id];
    if (nivel === null || nivel === undefined) {
      faltantes.push(criterio.nombre);
      continue; // no sobrescribir con un puntaje 0 falso por no responder
    }
    const puntos = calcularPuntajeCriterio(nivel, criterio);
    await sql`
      insert into evaluaciones (postulacion_id, evaluador_id, etapa_id, criterio_id, nivel_seleccionado, puntos, comentario, actualizado_en)
      values (${postulacionId}, ${evaluadorId}, ${etapaId}, ${criterio.id}, ${nivel}, ${puntos}, ${comentario}, now())
      on conflict (postulacion_id, evaluador_id, etapa_id, criterio_id)
      do update set
        nivel_seleccionado = excluded.nivel_seleccionado,
        puntos = excluded.puntos,
        comentario = excluded.comentario,
        actualizado_en = now()
    `;
  }

  revalidatePath("/evaluacion");
  revalidatePath("/resultados");
  return { faltantes };
}

export async function guardarBonificacionManual(
  postulacionId: number,
  valor: number,
  comentario: string
): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado.");
  const evaluadorId = Number(session.user.id);

  await sql`
    insert into bonificaciones_manuales (postulacion_id, evaluador_id, valor_1_a_5, comentario, actualizado_en)
    values (${postulacionId}, ${evaluadorId}, ${valor}, ${comentario}, now())
    on conflict (postulacion_id, evaluador_id)
    do update set
      valor_1_a_5 = excluded.valor_1_a_5,
      comentario = excluded.comentario,
      actualizado_en = now()
  `;

  revalidatePath("/evaluacion");
  revalidatePath("/resultados");
}
