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

export interface NivelOrientativo {
  nivel: number;
  ayuda: string;
}

export interface FactorBonificacion {
  id: string;
  nombre: string;
  peso: number;
  fuente_formulario: string;
  mapeo?: Record<string, number>;
  escala?: string;
  conversion?: string;
  descripcion?: string;
  niveles_orientativos?: NivelOrientativo[];
  tipo?: "categorico" | "lista_estrategica";
}

/**
 * Lista configurable (Configuración → Bonificación) de sectores o industrias
 * estratégicas / de alto crecimiento para la región de Ñuble, usada por el
 * factor automático "Alineación con sectores estratégicos regionales".
 * Fuente: Ministerio de Economía, CORFO y Gobierno Regional de Ñuble
 * (noviembre 2025). Un/a administrador/a puede editarla sin tocar código.
 */
export const SECTORES_ESTRATEGICOS_DEFAULT: string[] = [
  "Agroindustria",
  "Turismo",
  "Economía circular",
  "Logística",
  "Industria creativa",
];

/**
 * Modelo de "potencial dinámico" (bonificación no exigida literalmente por las
 * bases, punto 4.1: capacidad de crecer a tasas superiores al 20% anual).
 *
 * Combina 3 factores autorreportados por el postulante en el formulario con
 * 4 factores evaluados por el panel en una escala de 1 a 5, inspirados en
 * marcos usados para estimar potencial de crecimiento de emprendimientos en
 * etapa temprana: el indicador de "high-growth expectation entrepreneurship"
 * del Global Entrepreneurship Monitor (alcance de mercado e innovación), la
 * escala TRL/MRL (madurez tecnológica y de mercado) que CORFO ya usa en otros
 * instrumentos, y los factores de escalabilidad y tracción temprana que la
 * literatura de aceleradoras (Startup Genome, métodos Berkus/Scorecard de
 * valoración ángel) asocia con trayectorias de crecimiento acelerado.
 *
 * Los pesos son editables desde Configuración → Bonificación sin tocar
 * código; los valores acá son solo el punto de partida sugerido.
 */
export const BONIFICACION_DEFAULT = {
  activa: true,
  puntaje_maximo: 10,
  factores: [
    {
      id: "tipo_innovacion",
      nombre: "Tipo de potencial innovador declarado",
      peso: 0.15,
      fuente_formulario: "pregunta_32_tipo_potencial_innovador",
      mapeo: { Disruptiva: 10, Incremental: 6, Marginal: 2 },
    },
    {
      id: "alcance_innovacion",
      nombre: "Alcance proyectado de la innovación",
      peso: 0.15,
      fuente_formulario: "pregunta_34_alcance_innovacion",
      mapeo: { Internacional: 10, Nacional: 6, Regional: 3 },
    },
    {
      id: "financiamiento_previo",
      nombre: "Financiamiento público o privado ya levantado",
      peso: 0.1,
      fuente_formulario: "pregunta_28_ha_levantado_financiamiento",
      mapeo: { Sí: 10, No: 0 },
    },
    {
      id: "alineacion_sectorial",
      nombre: "Alineación con sectores estratégicos regionales",
      peso: 0.15,
      fuente_formulario: "sector_industria",
      tipo: "lista_estrategica",
      descripcion:
        "Compara el sector o industria declarado por el postulante contra la lista " +
        "configurable de sectores estratégicos o de alto crecimiento para la región de Ñuble " +
        "(ver Configuración → Bonificación). Usa coincidencia parcial de texto: si el sector " +
        "declarado contiene o coincide con alguno de la lista, obtiene el puntaje máximo; si no " +
        "coincide con ninguno, obtiene 0 puntos. Si el postulante no declaró sector, el factor " +
        "se omite del cálculo (no cuenta ni como puntaje ni como peso).",
    },
    {
      id: "madurez_tecnologica",
      nombre: "Madurez tecnológica y propiedad intelectual",
      peso: 0.15,
      fuente_formulario: "evaluacion_manual_panel",
      escala: "slider_1_a_5",
      conversion: "puntos = (valor_1_a_5 - 1) / 4 * 10",
      descripcion:
        "Nivel de madurez de la tecnología o solución (escala TRL simplificada) y si existe " +
        "propiedad intelectual registrada o en trámite (patente, modelo de utilidad, marca).",
      niveles_orientativos: [
        { nivel: 1, ayuda: "TRL 1-2: idea o investigación conceptual, sin prototipo." },
        { nivel: 2, ayuda: "TRL 3-4: prototipo de laboratorio o validación inicial de componentes." },
        { nivel: 3, ayuda: "TRL 5-6: prototipo validado en un entorno relevante (piloto controlado)." },
        { nivel: 4, ayuda: "TRL 7-8: sistema demostrado funcionando en un entorno operacional real." },
        {
          nivel: 5,
          ayuda: "TRL 9: tecnología probada en operación comercial; existe PI registrada o en trámite.",
        },
      ],
    },
    {
      id: "escalabilidad_modelo",
      nombre: "Escalabilidad del modelo de negocio",
      peso: 0.2,
      fuente_formulario: "evaluacion_manual_panel",
      escala: "slider_1_a_5",
      conversion: "puntos = (valor_1_a_5 - 1) / 4 * 10",
      descripcion:
        "Qué tan bajo es el costo marginal de atender un cliente adicional, qué tan replicable " +
        "es el modelo fuera de Ñuble sin rediseñarlo, y si existen efectos de red.",
      niveles_orientativos: [
        {
          nivel: 1,
          ayuda: "Alto costo marginal por cliente adicional (servicio local intensivo en mano de obra); difícil de replicar fuera de la comuna.",
        },
        { nivel: 3, ayuda: "Costo marginal moderado; el modelo es replicable en otras regiones con ajustes." },
        {
          nivel: 5,
          ayuda: "Costo marginal bajo (plataforma/software), replicable geográficamente y con efectos de red.",
        },
      ],
    },
    {
      id: "traccion_temprana",
      nombre: "Tracción temprana validada",
      peso: 0.15,
      fuente_formulario: "evaluacion_manual_panel",
      escala: "slider_1_a_5",
      conversion: "puntos = (valor_1_a_5 - 1) / 4 * 10",
      descripcion:
        "Evidencia concreta de demanda ya validada: cartas de intención, pilotos, lista de " +
        "espera, ventas o alianzas con clientes/socios ancla.",
      niveles_orientativos: [
        { nivel: 1, ayuda: "Sin evidencia de demanda validada; solo hipótesis del equipo." },
        { nivel: 3, ayuda: "Lista de espera, cartas de intención o pilotos en curso." },
        { nivel: 5, ayuda: "Pilotos o ventas con clientes ancla, alianzas estratégicas ya firmadas." },
      ],
    },
    {
      id: "ambicion_proyeccion",
      nombre: "Ambición y credibilidad de la proyección de crecimiento a 3 años",
      peso: 0.1,
      fuente_formulario: "evaluacion_manual_panel",
      escala: "slider_1_a_5",
      conversion: "puntos = (valor_1_a_5 - 1) / 4 * 10",
      descripcion:
        "Qué tan creíble (no solo ambiciosa) es la proyección de crecimiento del equipo, " +
        "considerando su capacidad de ejecución y redes de apoyo para escalar.",
    },
  ] as FactorBonificacion[],
};

export interface FilaBonoManualValores {
  valor_1_a_5: number | null;
  madurez_tecnologica_1_a_5: number | null;
  escalabilidad_1_a_5: number | null;
  traccion_1_a_5: number | null;
}

const COLUMNA_MANUAL_POR_FACTOR: Record<string, keyof FilaBonoManualValores> = {
  ambicion_proyeccion: "valor_1_a_5",
  madurez_tecnologica: "madurez_tecnologica_1_a_5",
  escalabilidad_modelo: "escalabilidad_1_a_5",
  traccion_temprana: "traccion_1_a_5",
};

/**
 * Recalcula la bonificación total en el navegador, en tiempo real, mientras
 * el panel evaluador mueve los sliders de los 4 factores cualitativos —
 * ANTES de guardar. Reproduce la misma fórmula que
 * calcularBonificacionDesdeDatos() en scoring.ts (la que realmente corre en
 * el servidor y calcula lo que se guarda), con una sola diferencia
 * intencional: para el evaluador actual usa el valor que el slider tiene en
 * este instante, en vez de su último valor guardado en la base de datos, de
 * modo que la cifra "Bonificación total estimada" reaccione al tiro cuando
 * se mueve un slider, en vez de solo actualizarse después de guardar.
 *
 * `detalleAutomatico` son los puntos ya calculados en el servidor para los
 * factores automáticos (tipo de innovación, alcance, financiamiento previo):
 * esos no dependen de los sliders, así que no hace falta recalcularlos acá.
 * `otrosValoresManuales` son las filas guardadas de bonificaciones_manuales
 * de TODOS los demás evaluadores (sin incluir al actual) para esta
 * postulación.
 */
export function calcularBonoEnVivo(
  factores: FactorBonificacion[],
  detalleAutomatico: Record<string, number>,
  otrosValoresManuales: FilaBonoManualValores[],
  valoresSliderActual: {
    madurezTecnologica: number;
    escalabilidadModelo: number;
    traccionTemprana: number;
    ambicionProyeccion: number;
  },
  puntajeMaximo: number
): number {
  const sliderPorColumna: Record<keyof FilaBonoManualValores, number> = {
    madurez_tecnologica_1_a_5: valoresSliderActual.madurezTecnologica,
    escalabilidad_1_a_5: valoresSliderActual.escalabilidadModelo,
    traccion_1_a_5: valoresSliderActual.traccionTemprana,
    valor_1_a_5: valoresSliderActual.ambicionProyeccion,
  };

  let totalPonderado = 0;
  let pesoTotal = 0;

  for (const factor of factores) {
    const peso = factor.peso ?? 0;
    const columnaManual = COLUMNA_MANUAL_POR_FACTOR[factor.id];

    let puntosFactor: number;
    if (columnaManual) {
      const otros = otrosValoresManuales
        .map((f) => f[columnaManual])
        .filter((v): v is number => v !== null);
      const todos = [...otros, sliderPorColumna[columnaManual]];
      const promedio1a5 = todos.reduce((a, b) => a + b, 0) / todos.length;
      puntosFactor = ((promedio1a5 - 1) / 4) * 10;
    } else {
      if (detalleAutomatico[factor.id] === undefined) continue;
      puntosFactor = detalleAutomatico[factor.id];
    }

    totalPonderado += puntosFactor * peso;
    pesoTotal += peso;
  }

  if (pesoTotal === 0) return 0;
  const puntaje0a10 = totalPonderado / pesoTotal;
  return Math.round(((puntaje0a10 / 10) * puntajeMaximo) * 100) / 100;
}

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
