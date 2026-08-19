/**
 * Sugerencia de pre-calificación con IA (Propuesta 2) para los 4 factores
 * cualitativos de bonificación por potencial dinámico (madurez tecnológica,
 * escalabilidad del modelo, tracción temprana, ambición y proyección).
 *
 * Es puramente informativa: nunca escribe en la base de datos. El panel
 * evaluador puede usarla como punto de partida para calificar los sliders de
 * 1 a 5 en la pestaña de Bonificación, pero siempre puede ajustarla o
 * ignorarla — solo se guarda lo que el panel confirme manualmente con el
 * botón "Guardar bonificación cualitativa".
 */
import Anthropic from "@anthropic-ai/sdk";
import { BONIFICACION_DEFAULT, type FactorBonificacion } from "@/lib/rubric";
import type { Postulacion } from "@/lib/types";

const MODELO_IA = "claude-haiku-4-5";

const FACTORES_CUALITATIVOS = [
  "madurez_tecnologica",
  "escalabilidad_modelo",
  "traccion_temprana",
  "ambicion_proyeccion",
] as const;

export interface SugerenciaFactor {
  valor_1_a_5: number;
  justificacion: string;
}

export interface SugerenciaIA {
  madurez_tecnologica: SugerenciaFactor;
  escalabilidad_modelo: SugerenciaFactor;
  traccion_temprana: SugerenciaFactor;
  ambicion_proyeccion: SugerenciaFactor;
}

function textoPostulacion(p: Postulacion): string {
  const campo = (valor: string | null, etiqueta: string) =>
    valor && valor.trim().length > 0 ? `${etiqueta}: ${valor.trim()}\n` : "";

  return (
    campo(p.nombre_emprendimiento ?? p.nombre_empresa, "Proyecto") +
    campo(p.tipo_emprendimiento, "Tipo de emprendimiento") +
    campo(p.sector_industria, "Sector o industria declarado") +
    campo(p.descripcion, "Descripción del proyecto") +
    campo(p.propuesta_valor, "Propuesta de valor") +
    campo(p.por_que_innovador, "Por qué el postulante cree que es innovador") +
    campo(p.detalle_financiamiento, "Detalle de financiamiento previo (si tiene)") +
    campo(p.resultados_3_anios, "Resultados esperados a 3 años") +
    campo(p.impacto_esperado, "Impacto esperado") +
    campo(p.descripcion_equipo, "Descripción del equipo") +
    (p.num_personas_equipo ? `Tamaño del equipo: ${p.num_personas_equipo} personas\n` : "")
  );
}

function describirFactor(factor: FactorBonificacion): string {
  const niveles = (factor.niveles_orientativos ?? [])
    .map((n) => `     - Nivel ${n.nivel}: ${n.ayuda}`)
    .join("\n");
  return `- ${factor.id} (${factor.nombre}): ${factor.descripcion ?? ""}\n${niveles}`;
}

function extraerJSON(texto: string): Record<string, { valor_1_a_5?: unknown; justificacion?: unknown }> {
  // El modelo puede envolver el JSON en ```json ... ``` a pesar de la
  // instrucción de responder solo JSON; como salvaguarda se toma el primer
  // "{" y el último "}" del texto de respuesta.
  const inicio = texto.indexOf("{");
  const fin = texto.lastIndexOf("}");
  if (inicio === -1 || fin === -1 || fin < inicio) {
    throw new Error("La respuesta de la IA no contenía un JSON reconocible.");
  }
  try {
    return JSON.parse(texto.slice(inicio, fin + 1));
  } catch {
    throw new Error("No se pudo interpretar la respuesta de la IA como JSON válido.");
  }
}

function limpiarFactor(bruto: { valor_1_a_5?: unknown; justificacion?: unknown } | undefined): SugerenciaFactor {
  const valorNum = Number(bruto?.valor_1_a_5);
  const valor = Number.isFinite(valorNum) ? Math.min(5, Math.max(1, Math.round(valorNum))) : 3;
  const justificacionBruta = typeof bruto?.justificacion === "string" ? bruto.justificacion.trim() : "";
  return {
    valor_1_a_5: valor,
    justificacion: justificacionBruta.slice(0, 600) || "La IA no entregó una justificación para este factor.",
  };
}

/**
 * Genera la sugerencia de 1 a 5 para los 4 factores cualitativos de
 * bonificación, a partir del texto ya escrito en la postulación.
 */
export async function generarSugerenciaIA(postulacion: Postulacion): Promise<SugerenciaIA> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Falta la variable de entorno ANTHROPIC_API_KEY. Debe configurarse en Vercel → Project Settings → Environment Variables → Production."
    );
  }

  const factores = BONIFICACION_DEFAULT.factores.filter((f) =>
    (FACTORES_CUALITATIVOS as readonly string[]).includes(f.id)
  );

  const client = new Anthropic({ apiKey });

  const prompt = `Eres un asistente que apoya a un panel evaluador de un programa de incubación de emprendimientos (Incubba Ñuble, Universidad del Bío-Bío, financiado por CORFO). Tu tarea es sugerir, a partir del texto de la postulación, un valor de 1 a 5 para cada uno de estos 4 factores cualitativos de "potencial dinámico", junto con una justificación breve (máximo 2 frases, en español). Esta sugerencia es solo una referencia: la decisión final siempre la toma el panel evaluador humano.

Factores a evaluar:

${factores.map(describirFactor).join("\n")}

Texto de la postulación a evaluar:

${textoPostulacion(postulacion) || "(el postulante no completó los campos de texto libre; responde con el valor intermedio 3 para cada factor y justificación indicando que no hay información suficiente)"}

Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional antes ni después, con esta forma exacta:
{
  ${factores.map((f) => `"${f.id}": { "valor_1_a_5": <entero de 1 a 5>, "justificacion": "<texto breve>" }`).join(",\n  ")}
}`;

  const respuesta = await client.messages.create({
    model: MODELO_IA,
    max_tokens: 1200,
    messages: [{ role: "user", content: prompt }],
  });

  const textoRespuesta = respuesta.content
    .filter((bloque): bloque is Anthropic.TextBlock => bloque.type === "text")
    .map((bloque) => bloque.text)
    .join("\n");

  const json = extraerJSON(textoRespuesta);

  return {
    madurez_tecnologica: limpiarFactor(json["madurez_tecnologica"]),
    escalabilidad_modelo: limpiarFactor(json["escalabilidad_modelo"]),
    traccion_temprana: limpiarFactor(json["traccion_temprana"]),
    ambicion_proyeccion: limpiarFactor(json["ambicion_proyeccion"]),
  };
}
