"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { sql } from "@/lib/db";
import {
  crearUsuario,
  actualizarEstadoUsuario,
  actualizarInclusionEnResultados,
  cambiarPassword,
} from "@/lib/auth-users";
import { getConfig, setConfig } from "@/lib/config-store";
import type { FactorBonificacion } from "@/lib/rubric";

async function requerirAdmin() {
  const session = await auth();
  if (!session?.user || session.user.rol !== "admin") {
    throw new Error("No tienes permisos de administrador/a.");
  }
  return session.user;
}

// --------------------------------- Importación de CSV -----------------------

export async function importarPostulaciones(
  filas: Record<string, string | null>[],
  mapeo: Record<string, string[]>,
  evitarDuplicados: boolean
): Promise<{ nuevas: number; omitidas: number }> {
  await requerirAdmin();

  let existentes = new Set<string>();

  if (evitarDuplicados) {
    const rows = await sql<{ run: string | null; correo: string | null }[]>`
      select run, correo from postulaciones
    `;
    existentes = new Set(rows.map((r) => `${r.run ?? ""}|${r.correo ?? ""}`));
  }

  let nuevas = 0;
  let omitidas = 0;

  // Un campo de destino puede venir de varias columnas del CSV (por ejemplo,
  // "comuna" cuando el formulario tiene una pregunta ramificada en varias
  // columnas condicionales). Se recorren en orden y se usa la primera que
  // tenga un valor no vacío para esa fila.
  function val(fila: Record<string, string | null>, campo: string): string | null {
    const columnas = mapeo[campo];
    if (!columnas || columnas.length === 0) return null;
    for (const col of columnas) {
      if (!(col in fila)) continue;
      const v = fila[col];
      if (v === null || v === undefined) continue;
      const s = String(v).trim();
      if (s !== "") return s;
    }
    return null;
  }

  for (const fila of filas) {
    const run = val(fila, "run");
    const correo = val(fila, "correo");
    const clave = `${run ?? ""}|${correo ?? ""}`;
    if (evitarDuplicados && (run || correo) && existentes.has(clave)) {

      omitidas++;
      continue;
    }

    let numEquipo: number | null = null;
    const numEquipoRaw = val(fila, "num_personas_equipo");
    if (numEquipoRaw) {
      const parsed = parseInt(numEquipoRaw, 10);
      numEquipo = Number.isFinite(parsed) ? parsed : null;
    }

    await sql`
      insert into postulaciones (
        correo, nombres, apellido_paterno, apellido_materno, run, fecha_nacimiento, genero,
        telefono, residencia_tipo, provincia, comuna, participa_programa_similar,
        tipo_emprendimiento, estado_detalle, nombre_emprendimiento, nombre_empresa, rut_empresa,
        tipo_empresa, sector_industria, tamano_empresa, descripcion, propuesta_valor,
        ha_levantado_financiamiento, detalle_financiamiento, cree_que_es_innovacion,
        por_que_innovador, tipo_potencial_innovador, tipo_innovacion, alcance_innovacion,
        sector_area_impacto, resultados_3_anios, impacto_esperado, num_personas_equipo,
        descripcion_equipo, video_link, video_link_alternativo, video_password, raw_json
      ) values (
        ${correo}, ${val(fila, "nombres")}, ${val(fila, "apellido_paterno")}, ${val(fila, "apellido_materno")},
        ${run}, ${val(fila, "fecha_nacimiento")}, ${val(fila, "genero")},
        ${val(fila, "telefono")}, ${val(fila, "residencia_tipo")}, ${val(fila, "provincia")}, ${val(fila, "comuna")},
        ${val(fila, "participa_programa_similar")},
        ${val(fila, "tipo_emprendimiento")}, ${val(fila, "estado_detalle")}, ${val(fila, "nombre_emprendimiento")},
        ${val(fila, "nombre_empresa")}, ${val(fila, "rut_empresa")},
        ${val(fila, "tipo_empresa")}, ${val(fila, "sector_industria")}, ${val(fila, "tamano_empresa")},
        ${val(fila, "descripcion")}, ${val(fila, "propuesta_valor")},
        ${val(fila, "ha_levantado_financiamiento")}, ${val(fila, "detalle_financiamiento")}, ${val(fila, "cree_que_es_innovacion")},
        ${val(fila, "por_que_innovador")}, ${val(fila, "tipo_potencial_innovador")}, ${val(fila, "tipo_innovacion")}, ${val(fila, "alcance_innovacion")},

        ${val(fila, "sector_area_impacto")}, ${val(fila, "resultados_3_anios")}, ${val(fila, "impacto_esperado")}, ${numEquipo},
        ${val(fila, "descripcion_equipo")}, ${val(fila, "video_link")}, ${val(fila, "video_link_alternativo")}, ${val(fila, "video_password")}, ${JSON.stringify(fila)}
      )
    `;
    nuevas++;
    if (run || correo) existentes.add(clave);
  }

  revalidatePath("/postulaciones");
  revalidatePath("/evaluacion");
  revalidatePath("/resultados");
  revalidatePath("/estadisticas");
  revalidatePath("/configuracion");
  return { nuevas, omitidas };
}

/**
 * Corrige o completa postulaciones YA IMPORTADAS, sin crear ninguna fila
 * nueva ni duplicar nada. Sirve para el caso en que, al importar por primera
 * vez, alguna pregunta del formulario no se emparejó con el campo correcto
 * (por ejemplo, quedó en "(no importar)" en vez de la columna real del CSV)
 * y ese dato nunca quedó guardado -- en vez de borrar todo y volver a
 * importar desde cero (lo que perdería las evaluaciones y bonificaciones ya
 * registradas, porque dependen del ID de la postulación), se vuelve a subir
 * el mismo archivo, se corrige el mapeo de la columna que faltaba, y esta
 * función busca cada fila del CSV en la base de datos por RUN o por correo
 * (el mismo criterio que ya usa la importación para detectar duplicados) y
 * actualiza SOLO esa postulación existente.
 *
 * Por seguridad, cada campo se actualiza con "coalesce(nuevo, actual)": si
 * para una fila y un campo el CSV no trae dato (columna sin mapear, o vacía
 * en esa fila puntual), se conserva el valor que ya estaba guardado -- no se

 * borra ni se deja en blanco. Si el campo sí trae dato, se reemplaza por el
 * valor del CSV (pensado para corregir justamente los campos que quedaron
 * mal importados la primera vez).
 */
export async function actualizarPostulacionesDesdeCsv(
  filas: Record<string, string | null>[],
  mapeo: Record<string, string[]>
): Promise<{ actualizadas: number; sinCoincidencia: number }> {
  await requerirAdmin();

  const existentes = await sql<{ id: number; run: string | null; correo: string | null }[]>`
    select id, run, correo from postulaciones
  `;
  const porRun = new Map<string, number>();
  const porCorreo = new Map<string, number>();
  for (const p of existentes) {
    if (p.run && p.run.trim()) porRun.set(p.run.trim(), p.id);
    if (p.correo && p.correo.trim()) porCorreo.set(p.correo.trim().toLowerCase(), p.id);
  }

  function val(fila: Record<string, string | null>, campo: string): string | null {
    const columnas = mapeo[campo];
    if (!columnas || columnas.length === 0) return null;
    for (const col of columnas) {
      if (!(col in fila)) continue;
      const v = fila[col];
      if (v === null || v === undefined) continue;
      const s = String(v).trim();
      if (s !== "") return s;
    }
    return null;
  }


  let actualizadas = 0;
  let sinCoincidencia = 0;

  for (const fila of filas) {
    const run = val(fila, "run");
    const correo = val(fila, "correo");

    let id: number | undefined;
    if (run) id = porRun.get(run.trim());
    if (!id && correo) id = porCorreo.get(correo.trim().toLowerCase());

    if (!id) {
      sinCoincidencia++;
      continue;
    }

    let numEquipo: number | null = null;
    const numEquipoRaw = val(fila, "num_personas_equipo");
    if (numEquipoRaw) {
      const parsed = parseInt(numEquipoRaw, 10);
      numEquipo = Number.isFinite(parsed) ? parsed : null;
    }

    await sql`
      update postulaciones set
        correo = coalesce(${correo}, correo),
        nombres = coalesce(${val(fila, "nombres")}, nombres),
        apellido_paterno = coalesce(${val(fila, "apellido_paterno")}, apellido_paterno),
        apellido_materno = coalesce(${val(fila, "apellido_materno")}, apellido_materno),
        run = coalesce(${run}, run),
        fecha_nacimiento = coalesce(${val(fila, "fecha_nacimiento")}, fecha_nacimiento),

        genero = coalesce(${val(fila, "genero")}, genero),
        telefono = coalesce(${val(fila, "telefono")}, telefono),
        residencia_tipo = coalesce(${val(fila, "residencia_tipo")}, residencia_tipo),
        provincia = coalesce(${val(fila, "provincia")}, provincia),
        comuna = coalesce(${val(fila, "comuna")}, comuna),
        participa_programa_similar = coalesce(${val(fila, "participa_programa_similar")}, participa_programa_similar),
        tipo_emprendimiento = coalesce(${val(fila, "tipo_emprendimiento")}, tipo_emprendimiento),
        estado_detalle = coalesce(${val(fila, "estado_detalle")}, estado_detalle),
        nombre_emprendimiento = coalesce(${val(fila, "nombre_emprendimiento")}, nombre_emprendimiento),
        nombre_empresa = coalesce(${val(fila, "nombre_empresa")}, nombre_empresa),
        rut_empresa = coalesce(${val(fila, "rut_empresa")}, rut_empresa),
        tipo_empresa = coalesce(${val(fila, "tipo_empresa")}, tipo_empresa),
        sector_industria = coalesce(${val(fila, "sector_industria")}, sector_industria),
        tamano_empresa = coalesce(${val(fila, "tamano_empresa")}, tamano_empresa),
        descripcion = coalesce(${val(fila, "descripcion")}, descripcion),
        propuesta_valor = coalesce(${val(fila, "propuesta_valor")}, propuesta_valor),
        ha_levantado_financiamiento = coalesce(${val(fila, "ha_levantado_financiamiento")}, ha_levantado_financiamiento),
        detalle_financiamiento = coalesce(${val(fila, "detalle_financiamiento")}, detalle_financiamiento),
        cree_que_es_innovacion = coalesce(${val(fila, "cree_que_es_innovacion")}, cree_que_es_innovacion),
        por_que_innovador = coalesce(${val(fila, "por_que_innovador")}, por_que_innovador),
        tipo_potencial_innovador = coalesce(${val(fila, "tipo_potencial_innovador")}, tipo_potencial_innovador),
        tipo_innovacion = coalesce(${val(fila, "tipo_innovacion")}, tipo_innovacion),
        alcance_innovacion = coalesce(${val(fila, "alcance_innovacion")}, alcance_innovacion),
        sector_area_impacto = coalesce(${val(fila, "sector_area_impacto")}, sector_area_impacto),
        resultados_3_anios = coalesce(${val(fila, "resultados_3_anios")}, resultados_3_anios),
        impacto_esperado = coalesce(${val(fila, "impacto_esperado")}, impacto_esperado),
        num_personas_equipo = coalesce(${numEquipo}, num_personas_equipo),
        descripcion_equipo = coalesce(${val(fila, "descripcion_equipo")}, descripcion_equipo),
        video_link = coalesce(${val(fila, "video_link")}, video_link),
        video_link_alternativo = coalesce(${val(fila, "video_link_alternativo")}, video_link_alternativo),
        video_password = coalesce(${val(fila, "video_password")}, video_password),
        raw_json = ${JSON.stringify(fila)}

      where id = ${id}
    `;
    actualizadas++;
  }

  revalidatePath("/postulaciones");
  revalidatePath("/evaluacion");
  revalidatePath("/resultados");
  revalidatePath("/estadisticas");
  revalidatePath("/configuracion");
  return { actualizadas, sinCoincidencia };
}

/**
 * Borra TODAS las postulaciones (y, en cascada, sus evaluaciones y
 * bonificaciones manuales asociadas). Pensado para limpiar datos de prueba
 * antes de una convocatoria real -- es irreversible, por eso exige admin y
 * una palabra de confirmación exacta desde la interfaz.
 *
 * Se usa TRUNCATE ... RESTART IDENTITY en vez de DELETE para que, además de
 * borrar las filas, el contador de ID vuelva a partir en 1 la próxima vez
 * que se importe un CSV (con DELETE el contador seguía subiendo aunque la
 * tabla quedara vacía). CASCADE incluye automáticamente a evaluaciones y
 * bonificaciones_manuales, que dependen de postulaciones, y también
 * reinicia sus propios contadores de ID.
 */
export async function eliminarTodasLasPostulaciones(confirmacion: string): Promise<{ eliminadas: number }> {
  await requerirAdmin();
  if (confirmacion !== "ELIMINAR") {
    throw new Error('Escribe exactamente "ELIMINAR" para confirmar.');
  }


  const [{ total }] = await sql<{ total: number }[]>`select count(*)::int as total from postulaciones`;

  await sql`truncate table postulaciones restart identity cascade`;

  revalidatePath("/postulaciones");
  revalidatePath("/evaluacion");
  revalidatePath("/resultados");
  revalidatePath("/estadisticas");
  revalidatePath("/configuracion");
  return { eliminadas: total };
}

// --------------------------------- Evaluadores -------------------------------

export async function crearEvaluador(
  nombre: string,
  email: string,
  password: string,
  rol: "admin" | "evaluador"
): Promise<{ error?: string }> {
  await requerirAdmin();
  if (!nombre || !email || !password) {
    return { error: "Completa nombre, correo y contraseña." };
  }
  try {
    await crearUsuario(nombre, email, password, rol);
    revalidatePath("/configuracion");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al crear el usuario." };
  }
}


export async function cambiarEstadoEvaluador(id: number, activo: boolean): Promise<void> {
  await requerirAdmin();
  await actualizarEstadoUsuario(id, activo);
  revalidatePath("/configuracion");
}

/**
 * Incluye o excluye del cálculo de resultados a un evaluador/a puntual, sin
 * tocar si puede iniciar sesión ni borrar ninguna evaluación o bonificación
 * ya guardada -- ver actualizarInclusionEnResultados en auth-users.ts y el
 * filtro correspondiente en scoring.ts. Pensado para cuando hay que cerrar
 * el proceso y algunos evaluadores no alcanzaron a terminar: el
 * administrador/a puede excluirlos para ver cómo queda el ranking sin su
 * aporte, e incluirlos de nuevo en cualquier momento si cambia de opinión.
 */
export async function cambiarInclusionEnResultados(id: number, incluido: boolean): Promise<void> {
  await requerirAdmin();
  await actualizarInclusionEnResultados(id, incluido);
  revalidatePath("/seguimiento");
  revalidatePath("/evaluacion");
  revalidatePath("/resultados");
  revalidatePath("/estadisticas");
  revalidatePath("/configuracion");
}

// --------------------------------- Bonificación / pesos ----------------------

export async function guardarConfigBonificacion(
  activa: boolean,
  puntajeMaximo: number,
  factores: FactorBonificacion[]

): Promise<void> {
  await requerirAdmin();
  const config = await getConfig<{ activa?: boolean; puntaje_maximo?: number; factores?: FactorBonificacion[] }>(
    "bonificacion"
  );
  await setConfig("bonificacion", { ...config, activa, puntaje_maximo: puntajeMaximo, factores });
  revalidatePath("/configuracion");
  revalidatePath("/evaluacion");
  revalidatePath("/resultados");
}

export async function guardarPesoEtapas(pesoEtapa2: number, pesoEtapa3: number): Promise<void> {
  await requerirAdmin();
  const pesos = await getConfig<Record<string, number>>("peso_etapas");
  await setConfig("peso_etapas", { ...pesos, etapa_2: pesoEtapa2, etapa_3: pesoEtapa3 });
  revalidatePath("/configuracion");
  revalidatePath("/resultados");
}

/**
 * Marca (o desmarca) un proyecto puntual como "sin potencial dinámico".
 * Es una decisión exclusiva del administrador/a (por eso exige requerirAdmin,
 * a diferencia de guardarBonificacionManual que puede usar cualquier
 * evaluador/a) y actúa como un multiplicador ×0 sobre la bonificación
 * completa de ese proyecto: no borra ni modifica ninguna fila de
 * bonificaciones_manuales, y los evaluadores siguen viendo y usando la
 * pestaña "Bonificación" con total normalidad. El efecto se aplica en un
 * único lugar (calcularBonificacionDesdeDatos, en scoring.ts) para que se
 * refleje automáticamente en Resultados, Estadísticas y en los reportes
 * Word de Seguimiento.
 */
export async function guardarSinPotencialDinamico(postulacionId: number, valor: boolean): Promise<void> {

  await requerirAdmin();
  await sql`update postulaciones set sin_potencial_dinamico = ${valor} where id = ${postulacionId}`;
  revalidatePath("/seguimiento");
  revalidatePath("/evaluacion");
  revalidatePath("/resultados");
  revalidatePath("/estadisticas");
}

/**
 * Guarda la lista configurable de sectores/industrias estratégicas usada por
 * el factor automático "Alineación con sectores estratégicos regionales".
 * Se recibe una línea de texto por sector; se descartan líneas vacías.
 */
export async function guardarSectoresEstrategicos(sectores: string[]): Promise<void> {
  await requerirAdmin();
  const limpios = sectores.map((s) => s.trim()).filter((s) => s.length > 0);
  await setConfig("sectores_estrategicos", limpios);
  revalidatePath("/configuracion");
  revalidatePath("/evaluacion");
  revalidatePath("/resultados");
}

// --------------------------------- Cuenta propia -----------------------------

export async function cambiarMiPassword(nuevaPassword: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado." };
  if (!nuevaPassword || nuevaPassword.length < 4) {
    return { error: "La contraseña debe tener al menos 4 caracteres." };
  }
  await cambiarPassword(Number(session.user.id), nuevaPassword);
  return {};

}
