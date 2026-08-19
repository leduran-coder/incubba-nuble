"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { obtenerPostulacion } from "@/lib/postulaciones";
import { iaSugerenciaActiva, setConfig, type ConfigIA } from "@/lib/config-store";
import { generarSugerenciaIA as generarSugerenciaIAInterna, type SugerenciaIA } from "@/lib/ai-sugerencia";
import {
  generarEvaluacionCompletaIA as generarEvaluacionCompletaIAInterna,
  type EvaluacionCompletaIA,
} from "@/lib/ai-evaluacion-completa";

/**
 * Server action que invoca la sugerencia de pre-calificación con IA
 * (Propuesta 2) para una postulación. Cualquier evaluador/a autenticado
 * puede pedirla (igual que puede calificar los sliders manualmente); la
 * sugerencia NUNCA se guarda sola, solo se devuelve para mostrarse en
 * pantalla como texto editable.
 */
export async function generarSugerenciaIA(postulacionId: number): Promise<SugerenciaIA> {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado.");

  const activa = await iaSugerenciaActiva();
  if (!activa) {
    throw new Error(
      "La función de sugerencias con IA está desactivada. Un administrador/a puede activarla en Configuración → IA."
    );
  }

  const postulacion = await obtenerPostulacion(postulacionId);
  if (!postulacion) throw new Error("Postulación no encontrada.");

  return generarSugerenciaIAInterna(postulacion);
}

/**
 * Server action para la pestaña "🤖 Evaluación Auxiliar IA": genera una
 * evaluación de referencia completa (Etapa 1 + Etapa 2 + bonificación
 * cualitativa) para una postulación. Igual que generarSugerenciaIA(), nunca
 * escribe nada en la base de datos — es puramente informativa.
 */
export async function generarEvaluacionCompletaIA(postulacionId: number): Promise<EvaluacionCompletaIA> {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado.");

  const activa = await iaSugerenciaActiva();
  if (!activa) {
    throw new Error(
      "La función de sugerencias con IA está desactivada. Un administrador/a puede activarla en Configuración → IA."
    );
  }

  const postulacion = await obtenerPostulacion(postulacionId);
  if (!postulacion) throw new Error("Postulación no encontrada.");

  return generarEvaluacionCompletaIAInterna(postulacion);
}

/**
 * Activa o desactiva la función de sugerencias con IA. Solo administradores.
 */
export async function guardarConfigIA(activa: boolean): Promise<void> {
  const session = await auth();
  if (!session?.user || session.user.rol !== "admin") {
    throw new Error("No tienes permisos de administrador/a.");
  }
  const config: ConfigIA = { activa };
  await setConfig("ia_sugerencia", config);
  revalidatePath("/configuracion");
  revalidatePath("/evaluacion");
}
