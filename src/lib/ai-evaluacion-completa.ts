/**
 * Evaluación completa auxiliar generada por IA — extensión de la Propuesta 2
 * (sección 9 del documento técnico) pensada para dar al panel evaluador una
 * vista de referencia con TODOS los puntos evaluables de una postulación
 * (Admisibilidad, Evaluación de proyecto, y los factores cualitativos de
 * bonificación), no solo los 4 factores de bonificación que ya cubría
 * ai-sugerencia.ts.
 *
 * Es puramente informativa/auxiliar: nunca se guarda en evaluaciones ni en
 * bonificaciones_manuales, y no reemplaza ni pre-llena los formularios
 * oficiales de las pestañas Etapa 1/2/3 ni Bonificación — vive en su propia
 * pestaña de solo lectura ("🤖 Evaluación Auxiliar IA"). Reutiliza
 * generarSugerenciaIA() de ai-sugerencia.ts para los 4 factores cualitativos
 * de bonificación (sin duplicar esa lógica) y agrega evaluación de los
 * criterios de Etapa 1 (Admisibilidad) y Etapa 2 (Evaluación de proyecto).
 *
 * Etapa 3 (Entrevista personal) queda deliberadamente fuera: sus criterios
 * dependen de una entrevista real con la persona postulante, no de texto ya
 * escrito en el formulario, así que no hay nada confiable que la IA pueda
 * evaluar ahí.
 */
import Anthropic from "@anthropic-ai/sdk";
import { ETAPA_1, ETAPA_2, type Criterio } from "@/lib/rubric";
import type { Postulacion } from "@/lib/types";
import { generarSugerenciaIA, type SugerenciaIA } from "@/lib/ai-sugerencia";

const MODELO_IA = "claude-haiku-4-5";

export interface SugerenciaCriterio {
  nivel_sugerido: string;
  justificacion: string;
}

export interface EvaluacionCompletaIA {
  etapa1: Record<string, SugerenciaCriterio>;
  etapa2: Record<string, SugerenciaCriterio>;
  bono: SugerenciaIA;
}

function textoPostulacion(p: Postulacion): string {
  const campo = (valor: string | null, etiqueta: string) =>
    valor && valor.trim().length > 0 ? `${etiqueta}: ${valor.trim()}\n` : "";

  return (
    campo(p.nombre_emprendimiento ?? p.nombre_empresa, "Proyecto") +
    campo(p.tipo_emprendimiento, "Tipo de emprendimiento") +
    campo(p.provincia, "Provincia") +
    campo(p.comuna, "Comuna") +
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

function describirCriterios(criterios: Criterio[]): string {
  return criterios
    .map((c) => {
      const niveles = c.niveles
        .map((n) => `     - "${n.nivel}"${n.ayuda ? `: ${n.ayuda}` : ""}`)
        .join("\n");
      return `- ${c.id} (${c.nombre}):\n${niveles}`;
    })
    .join("\n");
}

function extraerJSON(texto: string): Record<string, { nivel_sugerido?: unknown; justificacion?: unknown }> {
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

function limpiarCriterio(
  criterio: Criterio,
  bruto: { nivel_sugerido?: unknown; justificacion?: unknown } | undefined
): SugerenciaCriterio {
  const propuesto = typeof bruto?.nivel_sugerido === "string" ? bruto.nivel_sugerido.trim() : "";
  const coincide = criterio.niveles.find((n) => n.nivel.toLowerCase() === propuesto.toLowerCase());
  const justificacionBruta = typeof bruto?.justificacion === "string" ? bruto.justificacion.trim() : "";

  if (coincide) {
    return {
      nivel_sugerido: coincide.nivel,
      justificacion: justificacionBruta.slice(0, 600) || "La IA no entregó una justificación para este criterio.",
    };
  }

  // Si la IA no devolvió exactamente uno de los niveles válidos para este
  // criterio, se usa el nivel intermedio como respuesta neutra en vez de
  // asumir el mejor o el peor caso, y se deja constancia en la
  // justificación para que quede claro que fue un valor de respaldo.
  const nivelNeutro = criterio.niveles[Math.floor((criterio.niveles.length - 1) / 2)];
  return {
    nivel_sugerido: nivelNeutro.nivel,
    justificacion:
      (justificacionBruta ? justificacionBruta.slice(0, 600) + " " : "") +
      "(La IA no devolvió un nivel reconocible para este criterio; se muestra un valor neutro de referencia.)",
  };
}

async function evaluarCriteriosEtapa(
  apiKey: string,
  postulacion: Postulacion,
  etapaNombre: string,
  criterios: Criterio[]
): Promise<Record<string, SugerenciaCriterio>> {
  const client = new Anthropic({ apiKey });

  const prompt = `Eres un asistente que apoya a un panel evaluador de un programa de incubación de emprendimientos (Incubba Ñuble, Universidad del Bío-Bío, financiado por CORFO). Tu tarea es sugerir, a partir del texto de la postulación, cuál de los niveles predefinidos corresponde mejor a cada criterio de "${etapaNombre}", junto con una justificación breve (máximo 2 frases, en español). Estas sugerencias son solo una referencia: la decisión final siempre la toma el panel evaluador humano.

Criterios a evaluar (usa EXACTAMENTE el texto entre comillas de cada nivel al responder "nivel_sugerido", sin inventar otros):

${describirCriterios(criterios)}

Texto de la postulación a evaluar:

${textoPostulacion(postulacion) || "(el postulante no completó los campos de texto libre; responde con el nivel intermedio disponible para cada criterio y justificación indicando que no hay información suficiente)"}

Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional antes ni después, con una entrada por cada criterio (usa el id de criterio como llave), con esta forma exacta:
{
  ${criterios
    .map((c) => `"${c.id}": { "nivel_sugerido": "<uno de los niveles citados arriba>", "justificacion": "<texto breve>" }`)
    .join(",\n  ")}
}`;

  const respuesta = await client.messages.create({
    model: MODELO_IA,
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });

  const textoRespuesta = respuesta.content
    .filter((bloque): bloque is Anthropic.TextBlock => bloque.type === "text")
    .map((bloque) => bloque.text)
    .join("\n");

  const json = extraerJSON(textoRespuesta);

  const resultado: Record<string, SugerenciaCriterio> = {};
  for (const criterio of criterios) {
    resultado[criterio.id] = limpiarCriterio(criterio, json[criterio.id]);
  }
  return resultado;
}

/**
 * Genera la evaluación completa auxiliar de IA para una postulación: los 3
 * criterios de Etapa 1, los 5 criterios de Etapa 2, y los 4 factores
 * cualitativos de bonificación (12 puntos evaluables en total). Las 3
 * llamadas a la API corren en paralelo para no sumar sus tiempos de espera.
 */
export async function generarEvaluacionCompletaIA(postulacion: Postulacion): Promise<EvaluacionCompletaIA> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Falta la variable de entorno ANTHROPIC_API_KEY. Debe configurarse en Vercel → Project Settings → Environment Variables → Production."
    );
  }

  const [etapa1, etapa2, bono] = await Promise.all([
    evaluarCriteriosEtapa(apiKey, postulacion, ETAPA_1.nombre, ETAPA_1.criterios),
    evaluarCriteriosEtapa(apiKey, postulacion, ETAPA_2.nombre, ETAPA_2.criterios),
    generarSugerenciaIA(postulacion),
  ]);

  return { etapa1, etapa2, bono };
}
