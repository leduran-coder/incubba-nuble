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

// Ambas funciones de IA de abajo devuelven este tipo de resultado en vez de
// lanzar ("throw") un error. Es a propósito: en producción, Next.js oculta
// el mensaje de cualquier error que se lance ("throw") desde un Server
// Action y solo deja ver un código genérico ("Minified React error #441"),
// como protección de seguridad para no filtrar detalles internos por
// accidente. Al devolver el error como un dato normal (ok: false, error:
// "texto") en vez de lanzarlo, el mensaje SÍ llega intacto a la pantalla,
// igual que ya hacían crearEvaluador() y cambiarMiPassword() en este mismo
// proyecto (ver src/lib/actions/config.ts).
export type ResultadoIA<T> = { ok: true; data: T } | { ok: false; error: string };

/**
 * Server action que invoca la sugerencia de pre-calificación con IA
 * (Propuesta 2) para una postulación. Cualquier evaluador/a autenticado
 * puede pedirla (igual que puede calificar los sliders manualmente); la
 * sugerencia NUNCA se guarda sola, solo se devuelve para mostrarse en
 * pantalla como texto editable.
 */
export async function generarSugerenciaIA(postulacionId: number): Promise<ResultadoIA<SugerenciaIA>> {
  try {
    const session = await auth();
    if (!session?.user) return { ok: false, error: "No autenticado." };

    const activa = await iaSugerenciaActiva();
    if (!activa) {
      return {
        ok: false,
        error:
          "La función de sugerencias con IA está desactivada. Un administrador/a puede activarla en Configuración → IA.",
      };
    }

    const postulacion = await obtenerPostulacion(postulacionId);
    if (!postulacion) return { ok: false, error: "Postulación no encontrada." };

    const data = await generarSugerenciaIAInterna(postulacion);
    return { ok: true, data };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "No se pudo generar la sugerencia con IA.",
    };
  }
}

/**
 * Server action para la pestaña "🤖 Evaluación Auxiliar IA": genera una
 * evaluación de referencia completa (Etapa 1 + Etapa 2 + bonificación
 * cualitativa) para una postulación. Igual que generarSugerenciaIA(), nunca
 * escribe nada en la base de datos — es puramente informativa.
 */
export async function generarEvaluacionCompletaIA(
  postulacionId: number
): Promise<ResultadoIA<EvaluacionCompletaIA>> {
  try {
    const session = await auth();
    if (!session?.user) return { ok: false, error: "No autenticado." };

    const activa = await iaSugerenciaActiva();
    if (!activa) {
      return {
        ok: false,
        error:
          "La función de sugerencias con IA está desactivada. Un administrador/a puede activarla en Configuración → IA.",
      };
    }

    const postulacion = await obtenerPostulacion(postulacionId);
    if (!postulacion) return { ok: false, error: "Postulación no encontrada." };

    const data = await generarEvaluacionCompletaIAInterna(postulacion);
    return { ok: true, data };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "No se pudo generar la evaluación completa con IA.",
    };
  }
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
