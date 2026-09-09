"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { sql } from "@/lib/db";
import { ETAPAS_POR_ID, calcularPuntajeCriterio } from "@/lib/rubric";
import { procesoEvaluacionCerrado } from "@/lib/config-store";

// Mensaje mostrado cuando el administrador/a ya cerró el proceso (ver
// procesoEvaluacionCerrado en config-store.ts): se repite igual en las dos
// funciones de este archivo para que evaluadores y administrador/a vean
// siempre la misma explicación, sin importar desde qué pestaña intenten
// guardar.
const MENSAJE_PROCESO_CERRADO =
  "El administrador/a cerró el proceso de evaluación: ya no se pueden guardar cambios. " +
  "Todo lo que ya habías guardado sigue intacto. Si necesitas corregir algo, pídele al " +
  "administrador/a que reabra el proceso en Configuración → 🔒 Cierre del proceso.";

export async function guardarEvaluacionEtapa(
  postulacionId: number,
  etapaId: string,
  respuestas: Record<string, string | null>,
  comentario: string
): Promise<{ faltantes: string[]; error?: string }> {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado.");

  if (await procesoEvaluacionCerrado()) {
    return { faltantes: [], error: MENSAJE_PROCESO_CERRADO };
  }

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
  valores: {
    ambicionProyeccion: number;
    madurezTecnologica: number;
    escalabilidadModelo: number;
    traccionTemprana: number;
  },
  comentario: string
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado.");

  if (await procesoEvaluacionCerrado()) {
    return { error: MENSAJE_PROCESO_CERRADO };
  }

  const evaluadorId = Number(session.user.id);

  await sql`
    insert into bonificaciones_manuales (
      postulacion_id, evaluador_id,
      valor_1_a_5, madurez_tecnologica_1_a_5, escalabilidad_1_a_5, traccion_1_a_5,
      comentario, actualizado_en
    )
    values (
      ${postulacionId}, ${evaluadorId},
      ${valores.ambicionProyeccion}, ${valores.madurezTecnologica}, ${valores.escalabilidadModelo}, ${valores.traccionTemprana},
      ${comentario}, now()
    )
    on conflict (postulacion_id, evaluador_id)
    do update set
      valor_1_a_5 = excluded.valor_1_a_5,
      madurez_tecnologica_1_a_5 = excluded.madurez_tecnologica_1_a_5,
      escalabilidad_1_a_5 = excluded.escalabilidad_1_a_5,
      traccion_1_a_5 = excluded.traccion_1_a_5,
      comentario = excluded.comentario,
      actualizado_en = now()
  `;

  revalidatePath("/evaluacion");
  revalidatePath("/resultados");
  return {};
}
