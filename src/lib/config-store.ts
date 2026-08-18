/**
 * Acceso de lectura/escritura a la tabla `configuracion` (clave -> JSON),
 * con valores por defecto tomados de rubric.ts la primera vez que se usan.
 * Esto permite que el/la administrador/a ajuste pesos y topes de la
 * bonificación desde la interfaz, sin editar código.
 *
 * Portado desde db/config_store.py.
 */
import { sql } from "@/lib/db";
import { PESO_ETAPAS_DEFAULT, BONIFICACION_DEFAULT, CRITERIOS_ADICIONALES, type FactorBonificacion } from "@/lib/rubric";

const DEFAULTS: Record<string, unknown> = {
  peso_etapas: PESO_ETAPAS_DEFAULT,
  bonificacion: BONIFICACION_DEFAULT,
  criterios_adicionales: CRITERIOS_ADICIONALES,
};

export async function getConfig<T = Record<string, unknown>>(clave: string): Promise<T> {
  const rows = await sql<{ valor_json: string }[]>`
    select valor_json from configuracion where clave = ${clave}
  `;
  if (rows.length === 0) {
    const valor = (DEFAULTS[clave] ?? {}) as T;
    await setConfig(clave, valor);
    return valor;
  }
  return JSON.parse(rows[0].valor_json) as T;
}

export async function setConfig<T = Record<string, unknown>>(clave: string, valor: T): Promise<T> {
  const payload = JSON.stringify(valor);
  await sql`
    insert into configuracion (clave, valor_json, actualizado_en)
    values (${clave}, ${payload}, now())
    on conflict (clave)
    do update set valor_json = excluded.valor_json, actualizado_en = now()
  `;
  return valor;
}

export interface ConfigBonificacion {
  activa?: boolean;
  puntaje_maximo?: number;
  factores?: FactorBonificacion[];
}

/**
 * Carga la configuración de bonificación y la completa con cualquier factor
 * que exista en BONIFICACION_DEFAULT (rubric.ts) pero que todavía no esté
 * guardado en la fila de la base de datos para este proyecto.
 *
 * Por qué hace falta: la primera vez que se llama a getConfig("bonificacion")
 * en un proyecto, esta graba una COPIA de BONIFICACION_DEFAULT tal como era
 * en ese momento. Si más adelante el código agrega un factor nuevo a
 * BONIFICACION_DEFAULT (como pasó con "Madurez tecnológica", "Escalabilidad
 * del modelo" y "Tracción temprana"), esa copia ya guardada NO se actualiza
 * sola — se queda con la lista antigua de factores para siempre. El
 * resultado es que el factor nuevo queda invisible: no aparece en
 * Configuración → Bonificación para ajustar su peso, y ningún cálculo de
 * bonificación lo toma en cuenta, aunque el panel evaluador sí llene su
 * slider correspondiente en la pantalla de Evaluación y crea que se está
 * guardando con efecto.
 *
 * Esta función detecta esos factores faltantes, los agrega (con el peso
 * sugerido por defecto) y guarda la versión completa de vuelta, para que
 * quede resuelto de forma permanente desde la primera vez que se detecta.
 */
export async function getConfigBonificacion(): Promise<ConfigBonificacion> {
  const config = await getConfig<ConfigBonificacion>("bonificacion");
  const factoresActuales = config.factores ?? [];
  const idsActuales = new Set(factoresActuales.map((f) => f.id));
  const faltantes = BONIFICACION_DEFAULT.factores.filter((f) => !idsActuales.has(f.id));

  if (faltantes.length === 0) return config;

  const completo: ConfigBonificacion = {
    ...config,
    factores: [...factoresActuales, ...faltantes],
  };
  await setConfig("bonificacion", completo);
  return completo;
}
