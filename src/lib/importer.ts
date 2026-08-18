/**
 * Importador de postulaciones desde el CSV de respuestas del Google Form.
 * Portado desde utils/importer.py — misma lista de campos y misma
 * estrategia de sugerencia automática de columnas (coincidencia por
 * palabra clave, con similitud de texto como respaldo).
 */

export const FIELD_DEFINITIONS: Array<[string, string, string[]]> = [
  ["correo", "Correo electrónico", ["correo"]],
  ["nombres", "Nombres", ["nombres"]],
  ["apellido_paterno", "Apellido paterno", ["apellido paterno"]],
  ["apellido_materno", "Apellido materno", ["apellido materno"]],
  ["run", "RUN", ["run"]],
  ["fecha_nacimiento", "Fecha de nacimiento", ["fecha de nacimiento"]],
  ["genero", "Género", ["género", "genero"]],
  ["telefono", "Número de contacto / teléfono", ["número de contacto", "telefono", "teléfono"]],
  ["residencia_tipo", "Residencia del emprendedor o el emprendimiento", ["residencia del emprendedor"]],
  ["provincia", "Provincia de residencia", ["provincia de residencia", "provincia"]],
  ["comuna", "Comuna de residencia", ["comuna de residencia", "comuna"]],
  ["participa_programa_similar", "¿Participando en otro programa similar?", ["programa similar de formación"]],
  ["tipo_emprendimiento", "Tipo de emprendimiento (Idea/Formalizado)", ["tipo de emprendimiento"]],
  ["estado_detalle", "Alternativa que corresponde a su caso", ["alternativa que corresponda a su caso"]],
  ["nombre_emprendimiento", "Nombre del emprendimiento/negocio/idea", ["nombre del emprendimiento"]],
  ["nombre_empresa", "Nombre empresa o razón social", ["nombre empresa", "razón social"]],
  ["rut_empresa", "RUT de la empresa", ["rut de la empresa"]],
  ["tipo_empresa", "Tipo de empresa", ["tipo de empresa"]],
  ["sector_industria", "Sector o industria", ["sector o industria"]],
  ["tamano_empresa", "Tamaño de la empresa", ["tamaño de la empresa"]],
  ["descripcion", "Descripción de la idea o emprendimiento", ["descripción de mi idea"]],
  ["propuesta_valor", "Propuesta de valor", ["propuesta de valor"]],
  ["ha_levantado_financiamiento", "¿Ha levantado financiamiento?", ["levantado financiamiento"]],
  ["detalle_financiamiento", "Indique qué financiamiento ha levantado", ["qué financiamiento ha levantado"]],
  ["cree_que_es_innovacion", "¿Cree que su emprendimiento es innovación?", ["cree usted que su emprendimiento es innovación"]],
  ["por_que_innovador", "¿Por qué cree que es innovador?", ["por qué cree usted que su emprendimiento es innovador"]],
  ["tipo_potencial_innovador", "Tipo de potencial innovador", ["qué tipo potencial innovador"]],
  ["tipo_innovacion", "Tipo de innovación", ["tipo de innovación"]],
  ["alcance_innovacion", "Alcance de la innovación", ["alcance de la innovación"]],
  ["sector_area_impacto", "Sector o área económica de impacto", ["sector o área económica de impacto"]],
  ["resultados_3_anios", "Resultados esperados próximos 3 años", ["resultados espera lograr"]],
  ["impacto_esperado", "Impacto social/económico/ambiental esperado", ["impacto social, económico o ambiental"]],
  ["num_personas_equipo", "N° de personas en el equipo", ["cuántas personas conforman su equipo"]],
  ["descripcion_equipo", "Descripción del equipo", ["describa a su equipo"]],
  ["video_link", "Enlace del video pitch", ["enlace donde podamos ver su video"]],
  ["video_password", "Contraseña del video", ["contraseña"]],
];

function normaliza(texto: string): string {
  return String(texto).trim().toLowerCase();
}

/** Similitud aproximada de texto (coeficiente de Dice sobre bigramas),
 * usada como respaldo cuando ninguna palabra clave calza literalmente. */
function similitud(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const bigramas = (s: string) => {
    const out = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i++) {
      const bg = s.slice(i, i + 2);
      out.set(bg, (out.get(bg) ?? 0) + 1);
    }
    return out;
  };
  const ba = bigramas(a);
  const bb = bigramas(b);
  let interseccion = 0;
  for (const [bg, count] of ba) {
    if (bb.has(bg)) interseccion += Math.min(count, bb.get(bg)!);
  }
  const total = [...ba.values()].reduce((s, v) => s + v, 0) + [...bb.values()].reduce((s, v) => s + v, 0);
  return total === 0 ? 0 : (2 * interseccion) / total;
}

/**
 * Sugiere, para cada campo de destino, la o las columnas del CSV que le
 * corresponden.
 *
 * Devuelve un array de columnas por campo (en vez de una sola) porque
 * algunas preguntas del formulario de Google están "ramificadas" en
 * secciones condicionales (por ejemplo, una pregunta que se repite en 3
 * columnas distintas según la rama que tomó la persona al responder, como
 * pasa con "Comuna de residencia"). En esos casos cada fila del CSV solo
 * trae dato en UNA de esas columnas; las demás quedan vacías para esa fila.
 *
 * Para decidir esto se recorre CADA COLUMNA del CSV y se le asigna el campo
 * de destino para el que obtiene el mejor puntaje (en vez de, al revés,
 * preguntar por cada campo qué columnas calzan). Esto evita que una palabra
 * clave corta de un campo (p. ej. "provincia") aparezca por accidente dentro
 * del encabezado largo de otra pregunta (p. ej. "Comuna de residencia [...
 * provincia de Itata]") y termine sugerida como columna de ese otro campo:
 * como esa columna calza mejor con "comuna" que con "provincia", queda
 * asignada solo a "comuna". Dos o más columnas solo se agrupan bajo el mismo
 * campo cuando cada una, de forma independiente, es su mejor calce posible.
 */
export function sugerirMapeo(columnasCsv: string[]): Record<string, string[]> {
  const columnasNorm = columnasCsv.map((c) => [c, normaliza(c)] as const);
  const asignaciones: Record<string, { col: string; score: number }[]> = {};
  for (const [campo] of FIELD_DEFINITIONS) asignaciones[campo] = [];

  for (const [col, colNorm] of columnasNorm) {
    let mejorCampo: string | null = null;
    let mejorScore = 0;
    for (const [campo, , keywords] of FIELD_DEFINITIONS) {
      let score = 0;
      for (const kw of keywords) {
        if (colNorm.includes(kw)) {
          score = Math.max(score, 0.9 + 0.1 * (kw.length / Math.max(colNorm.length, 1)));
        }
      }
      if (score === 0) {
        score = similitud(colNorm, keywords[0]) * 0.5;
      }
      if (score > mejorScore) {
        mejorScore = score;
        mejorCampo = campo;
      }
    }
    if (mejorCampo && mejorScore >= 0.35) {
      asignaciones[mejorCampo].push({ col, score: mejorScore });
    }
  }

  const mapeo: Record<string, string[]> = {};
  for (const [campo] of FIELD_DEFINITIONS) {
    mapeo[campo] = asignaciones[campo]
      .slice()
      .sort((a, b) => b.score - a.score)
      .map((c) => c.col);
  }
  return mapeo;
}
