/**
 * Definición de las rúbricas oficiales de Incubba Ñuble UBB (Generación 2026),
 * tal como aparecen en las Bases del Concurso, sección 4.5 y 6.
 *
 * Estas estructuras son la "fuente de verdad" que usan las páginas de
 * evaluación y de resultados. Si el comité cambia pesos o niveles en una
 * futura convocatoria, este es el ÚNICO archivo que hay que tocar.
 *
 * Portado 1:1 desde config/rubric.py de la versión Streamlit — no se cambió
 * ningún peso, nivel ni fórmula.
 */

export interface NivelCriterio {
  nivel: string;
  puntos: number;
  ayuda?: string;
}

export interface Criterio {
  id: string;
  nombre: string;
  peso: number;
  niveles: NivelCriterio[];
}

export interface Etapa {
  id: string;
  nombre: string;
  descripcion: string;
  umbral_aprobacion?: number;
  criterios: Criterio[];
}

export const NIVELES_100: NivelCriterio[] = [
  { nivel: "Excelente", puntos: 100 },
  { nivel: "Aceptable", puntos: 75 },
  { nivel: "En desarrollo", puntos: 50 },
  { nivel: "Deficiente", puntos: 25 },
];

export const NIVELES_ADMISIBILIDAD: NivelCriterio[] = [
  { nivel: "Recomendado", puntos: 100 },
  { nivel: "Recomendado con observaciones", puntos: 50 },
  { nivel: "No recomendado", puntos: 0 },
];

export const ETAPA_1: Etapa = {
  id: "etapa_1",
  nombre: "Etapa 1 · Admisibilidad",
  descripcion:
    "Verifica el cumplimiento de requisitos generales, territoriales y la " +
    "coherencia del emprendimiento con los criterios de innovación y " +
    "potencial dinámico informados.",
  umbral_aprobacion: 50,
  criterios: [
    {
      id: "territorialidad",
      nombre: "Territorialidad",
      peso: 0.5,
      niveles: [
        {
          nivel: "Recomendado",
          puntos: 100,
          ayuda: "El emprendedor y/o su emprendimiento PERTENECE a la región de Ñuble.",
        },
        {
          nivel: "No recomendado",
          puntos: 0,
          ayuda: "El emprendedor y/o su emprendimiento NO PERTENECE a la región de Ñuble.",
        },
      ],
    },
    {
      id: "potencial_crecimiento_admisibilidad",
      nombre: "Potencial de crecimiento",
      peso: 0.25,
      niveles: [
        {
          nivel: "Recomendado",
          puntos: 100,
          ayuda: "Cumple íntegramente el requerimiento de potencial dinámico de crecimiento.",
        },
        {
          nivel: "Recomendado con observaciones",
          puntos: 50,
          ayuda:
            "Muestra potencial, pero requiere ajustes u orientación adicional para justificar el dinamismo de la propuesta.",
        },
        {
          nivel: "No recomendado",
          puntos: 0,
          ayuda: "No cumple con los criterios de potencial dinámico.",
        },
      ],
    },
    {
      id: "innovacion_admisibilidad",
      nombre: "Innovación y diferenciación",
      peso: 0.25,
      niveles: [
        {
          nivel: "Recomendado",
          puntos: 100,
          ayuda:
            "Cumple íntegramente el requerimiento de propuesta innovadora para la región y/o país.",
        },
        {
          nivel: "Recomendado con observaciones",
          puntos: 50,
          ayuda:
            "Muestra potencial, pero requiere ajustes u orientación adicional para justificar el nivel de innovación en la propuesta.",
        },
        {
          nivel: "No recomendado",
          puntos: 0,
          ayuda: "No cumple con los criterios de innovación y diferenciación.",
        },
      ],
    },
  ],
};

export const ETAPA_2: Etapa = {
  id: "etapa_2",
  nombre: "Etapa 2 · Evaluación de proyecto",
  descripcion:
    "Panel de evaluación pondera el potencial de crecimiento, la innovación " +
    "y diferenciación de la propuesta, el perfil del equipo emprendedor y, " +
    "según corresponda, la viabilidad, tracción e impacto del proyecto.",
  criterios: [
    {
      id: "potencial_crecimiento",
      nombre: "Potencial de crecimiento",
      peso: 0.3,
      niveles: [
        {
          nivel: "Excelente",
          puntos: 100,
          ayuda:
            "Mercado objetivo amplio y bien definido; alta escalabilidad y modelo de sostenibilidad sólido y claro.",
        },
        {
          nivel: "Aceptable",
          puntos: 75,
          ayuda: "Mercado objetivo bien definido; escalabilidad y sostenibilidad razonable.",
        },
        {
          nivel: "En desarrollo",
          puntos: 50,
          ayuda:
            "Mercado objetivo identificado, pero requiere mayor análisis; escalabilidad y sostenibilidad incipiente.",
        },
        {
          nivel: "Deficiente",
          puntos: 25,
          ayuda: "Mercado objetivo poco definido; escalabilidad y sostenibilidad no clara.",
        },
      ],
    },
    {
      id: "innovacion_diferenciacion",
      nombre: "Innovación y diferenciación",
      peso: 0.25,
      niveles: [
        {
          nivel: "Excelente",
          puntos: 100,
          ayuda:
            "Propuesta de valor disruptiva, altamente innovadora y con una ventaja competitiva significativa en el mercado.",
        },
        {
          nivel: "Aceptable",
          puntos: 75,
          ayuda: "Propuesta de valor innovadora y con diferenciación clara en el mercado.",
        },
        {
          nivel: "En desarrollo",
          puntos: 50,
          ayuda: "Propuesta de valor con elementos de innovación, pero la diferenciación no es clara.",
        },
        {
          nivel: "Deficiente",
          puntos: 25,
          ayuda: "Propuesta de valor poco innovadora y sin diferenciación en el mercado.",
        },
      ],
    },
    {
      id: "perfil_emprendedor",
      nombre: "Perfil emprendedor",
      peso: 0.2,
      niveles: [
        {
          nivel: "Excelente",
          puntos: 100,
          ayuda:
            "Equipo emprendedor altamente capacitado, con experiencia sólida y gran complementariedad de habilidades.",
        },
        {
          nivel: "Aceptable",
          puntos: 75,
          ayuda: "Equipo emprendedor con experiencia relevante y buena complementariedad.",
        },
        {
          nivel: "En desarrollo",
          puntos: 50,
          ayuda: "Equipo emprendedor con alguna experiencia, pero complementariedad limitada.",
        },
        {
          nivel: "Deficiente",
          puntos: 25,
          ayuda: "Equipo emprendedor sin experiencia relevante y poca complementariedad.",
        },
      ],
    },
    {
      id: "viabilidad_traccion",
      nombre: "Viabilidad y tracción",
      peso: 0.15,
      niveles: [
        {
          nivel: "Excelente",
          puntos: 100,
          ayuda:
            "Producto/servicio validado en el mercado con tracción comprobada y gran potencial de crecimiento rápido.",
        },
        {
          nivel: "Aceptable",
          puntos: 75,
          ayuda: "Producto/servicio bien desarrollado y con validaciones significativas.",
        },
        {
          nivel: "En desarrollo",
          puntos: 50,
          ayuda: "Producto/servicio en desarrollo con algunas validaciones preliminares.",
        },
        {
          nivel: "Deficiente",
          puntos: 25,
          ayuda: "Producto/servicio en etapa muy temprana de desarrollo, sin validaciones.",
        },
      ],
    },
    {
      id: "impacto_sostenibilidad",
      nombre: "Impacto y sostenibilidad",
      peso: 0.1,
      niveles: [
        {
          nivel: "Excelente",
          puntos: 100,
          ayuda:
            "Impacto social, ambiental y económico altamente positivo, generando un valor compartido para la comunidad y el entorno.",
        },
        {
          nivel: "Aceptable",
          puntos: 75,
          ayuda: "Impacto social, ambiental y económico positivo y significativo.",
        },
        {
          nivel: "En desarrollo",
          puntos: 50,
          ayuda: "Impacto social, ambiental y económico positivo, pero limitado.",
        },
        {
          nivel: "Deficiente",
          puntos: 25,
          ayuda: "Impacto social, ambiental y económico poco claro o negativo.",
        },
      ],
    },
  ],
};

export const ETAPA_3: Etapa = {
  id: "etapa_3",
  nombre: "Etapa 3 · Entrevista personal",
  descripcion:
    "Profundiza en el conocimiento del proyecto, valida antecedentes " +
    "declarados y evalúa el nivel de compromiso, claridad estratégica y " +
    "dominio de la propuesta por parte de la persona postulante o del " +
    "equipo emprendedor.",
  criterios: [
    {
      id: "compromiso_lider",
      nombre: "Compromiso del líder del proyecto",
      peso: 0.35,
      niveles: [
        {
          nivel: "Excelente",
          puntos: 100,
          ayuda:
            "El/la líder demuestra dedicación clara, alta disponibilidad y fuerte vínculo con el proyecto; evidencia convicción, constancia y liderazgo activo en su desarrollo.",
        },
        {
          nivel: "Aceptable",
          puntos: 75,
          ayuda:
            "El/la líder muestra compromiso evidente y participación activa, aunque con algunos aspectos aún por fortalecer en disponibilidad o proyección de dedicación.",
        },
        {
          nivel: "En desarrollo",
          puntos: 50,
          ayuda:
            "El compromiso es parcial o poco consistente; existen dudas sobre la continuidad, disponibilidad o nivel real de involucramiento.",
        },
        {
          nivel: "Deficiente",
          puntos: 25,
          ayuda:
            "No se advierte compromiso suficiente, hay baja disposición, débil involucramiento o escasa responsabilidad respecto del proyecto.",
        },
      ],
    },
    {
      id: "dominio_propuesta",
      nombre: "Dominio de la propuesta",
      peso: 0.25,
      niveles: [
        {
          nivel: "Excelente",
          puntos: 100,
          ayuda:
            "Conoce en profundidad el problema, la solución, el modelo de negocio y el estado del proyecto; responde con claridad, consistencia y solvencia.",
        },
        {
          nivel: "Aceptable",
          puntos: 75,
          ayuda:
            "Maneja adecuadamente los elementos principales del proyecto, con algunas brechas menores de profundidad o precisión.",
        },
        {
          nivel: "En desarrollo",
          puntos: 50,
          ayuda:
            "Presenta conocimiento básico o incompleto del proyecto; responde de manera general y con vacíos relevantes.",
        },
        {
          nivel: "Deficiente",
          puntos: 25,
          ayuda:
            "Evidencia desconocimiento importante de la propuesta, inconsistencias o incapacidad para explicar sus aspectos centrales.",
        },
      ],
    },
    {
      id: "claridad_estrategica",
      nombre: "Claridad estratégica",
      peso: 0.2,
      niveles: [
        {
          nivel: "Excelente",
          puntos: 100,
          ayuda:
            "Presenta una visión clara, ordenada y coherente de corto, mediano y largo plazo; identifica metas, prioridades y próximos pasos con realismo.",
        },
        {
          nivel: "Aceptable",
          puntos: 75,
          ayuda:
            "Tiene una orientación estratégica definida, aunque con algunos elementos todavía poco detallados o por consolidar.",
        },
        {
          nivel: "En desarrollo",
          puntos: 50,
          ayuda:
            "La estrategia es incipiente, parcial o poco estructurada; existen dudas sobre foco, prioridades o proyección.",
        },
        {
          nivel: "Deficiente",
          puntos: 25,
          ayuda:
            "No presenta claridad estratégica, ni definición consistente de objetivos, ruta de crecimiento o dirección del proyecto.",
        },
      ],
    },
    {
      id: "validacion_antecedentes",
      nombre: "Validación de antecedentes declarados",
      peso: 0.2,
      niveles: [
        {
          nivel: "Excelente",
          puntos: 100,
          ayuda:
            "Los antecedentes expuestos son consistentes, verificables y coherentes con la postulación; demuestra alto nivel de veracidad y respaldo.",
        },
        {
          nivel: "Aceptable",
          puntos: 75,
          ayuda:
            "La información es en general consistente, con observaciones menores que no comprometen la credibilidad global del proyecto.",
        },
        {
          nivel: "En desarrollo",
          puntos: 50,
          ayuda:
            "Se observan vacíos, inconsistencias o falta de respaldo en parte de los antecedentes declarados.",
        },
        {
          nivel: "Deficiente",
          puntos: 25,
          ayuda:
            "Existen contradicciones relevantes, falta de respaldo o dudas serias respecto de la veracidad de los antecedentes.",
        },
      ],
    },
  ],
};

export const ETAPAS: Etapa[] = [ETAPA_1, ETAPA_2, ETAPA_3];
export const ETAPAS_POR_ID: Record<string, Etapa> = {
  etapa_1: ETAPA_1,
  etapa_2: ETAPA_2,
  etapa_3: ETAPA_3,
};

export const PESO_ETAPAS_DEFAULT: Record<string, number> = {
  etapa_1: 0.0,
  etapa_2: 0.65,
  etapa_3: 0.35,
};

export const CRITERIOS_ADICIONALES = {
  paridad_genero: {
    nombre: "Paridad de género",
    meta: 0.5,
    descripcion:
      "La selección final debe tener al menos un 50% de proyectos liderados por mujeres.",
  },
  cobertura_comunal: {
    nombre: "Cobertura comunal",
    meta_comunas: 21,
    descripcion:
      "Se prioriza representar la mayor cantidad posible de las 21 comunas de la región de Ñuble.",
  },
  cupo_maximo: 40,
};

export interface FactorBonificacion {
  id: string;
  nombre: string;
  peso: number;
  fuente_formulario: string;
  mapeo?: Record<string, number>;
  escala?: string;
  conversion?: string;
}

export const BONIFICACION_DEFAULT = {
  activa: true,
  puntaje_maximo: 10,
  factores: [
    {
      id: "tipo_innovacion",
      nombre: "Tipo de potencial innovador declarado",
      peso: 0.3,
      fuente_formulario: "pregunta_32_tipo_potencial_innovador",
      mapeo: { Disruptiva: 10, Incremental: 6, Marginal: 2 },
    },
    {
      id: "alcance_innovacion",
      nombre: "Alcance proyectado de la innovación",
      peso: 0.25,
      fuente_formulario: "pregunta_34_alcance_innovacion",
      mapeo: { Internacional: 10, Nacional: 6, Regional: 3 },
    },
    {
      id: "financiamiento_previo",
      nombre: "Financiamiento público o privado ya levantado",
      peso: 0.15,
      fuente_formulario: "pregunta_28_ha_levantado_financiamiento",
      mapeo: { Sí: 10, No: 0 },
    },
    {
      id: "ambicion_proyeccion",
      nombre: "Ambición y credibilidad de la proyección a 3 años (evaluada por el panel)",
      peso: 0.3,
      fuente_formulario: "evaluacion_manual_panel",
      escala: "slider_1_a_5",
      conversion: "puntos = (valor_1_a_5 - 1) / 4 * 10",
    },
  ] as FactorBonificacion[],
};

export function calcularPuntajeCriterio(
  nivelSeleccionado: string | null | undefined,
  criterio: Criterio
): number {
  for (const nivel of criterio.niveles) {
    if (nivel.nivel === nivelSeleccionado) return nivel.puntos;
  }
  return 0;
}

export function calcularPuntajeEtapa(
  respuestas: Record<string, string | null | undefined>,
  etapa: Etapa
): number {
  let total = 0;
  for (const criterio of etapa.criterios) {
    const nivelSel = respuestas[criterio.id];
    if (nivelSel === null || nivelSel === undefined) continue;
    const puntos = calcularPuntajeCriterio(nivelSel, criterio);
    total += puntos * criterio.peso;
  }
  return Math.round(total * 100) / 100;
}
