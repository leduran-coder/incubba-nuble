/**
 * Paleta de gráficos validada con la guía de dataviz (contraste, separación
 * para daltonismo, piso de croma). Portada desde config/theme.py de la
 * versión Streamlit — los colores de marca (morado/menta) se reservan para
 * la interfaz, nunca para codificar datos.
 */
export const PALETA_CATEGORICA = [
  "#2a78d6", // azul
  "#eb6834", // naranjo
  "#1baf7a", // aqua
  "#eda100", // amarillo
  "#e87ba4", // magenta
  "#008300", // verde
  "#4a3aa7", // violeta
  "#e34948", // rojo
];

export const PALETA_SECUENCIAL = ["#cde2fb", "#9ec5f4", "#5598e7", "#2a78d6", "#184f95"];
export const PALETA_DIVERGENTE = ["#2a78d6", "#9ec5f4", "#f0efec", "#f0a19f", "#e34948"];

export const AZUL_MAGNITUD = PALETA_SECUENCIAL[3]; // #2a78d6, tono ancla para barras de magnitud
export const COLOR_BUENO = "#0ca30c";
export const COLOR_ADVERTENCIA = "#fab219";
export const COLOR_CRITICO = "#d03b3b";

export const GRID = "#E1E0D9";
export const TEXTO_MUTED = "#898781";
