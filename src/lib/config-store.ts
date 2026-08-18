/**
 * Acceso de lectura/escritura a la tabla `configuracion` (clave -> JSON),
 * con valores por defecto tomados de rubric.ts la primera vez que se usan.
 * Esto permite que el/la administrador/a ajuste pesos y topes de la
 * bonificación desde la interfaz, sin editar código.
 *
 * Portado desde db/config_store.py.
 */
import { sql } from "@/lib/db";
import { PESO_ETAPAS_DEFAULT, BONIFICACION_DEFAULT, CRITERIOS_ADICIONALES } from "@/lib/rubric";

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
