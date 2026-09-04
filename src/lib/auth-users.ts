/**
 * Autenticación simple basada en usuario/contraseña propios (no depende de
 * servicios externos). Dos roles:
 *
 *   - admin:     puede importar postulaciones, crear/editar evaluadores,
 *                ajustar la bonificación y ver todo.
 *   - evaluador: solo puede calificar postulaciones y ver resultados/estadísticas.
 *
 * Las contraseñas se guardan con hash bcrypt, nunca en texto plano.
 *
 * Portado desde auth.py.
 */
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import type { Usuario } from "@/lib/types";

export const ADMIN_POR_DEFECTO_EMAIL = "admin@incubba.cl";
export const ADMIN_POR_DEFECTO_PASSWORD = "incubba2026"; // el admin DEBE cambiarla en su primer ingreso

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verificarPassword(password: string, passwordHash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, passwordHash);
  } catch {
    return false;
  }
}

/** Crea un usuario admin inicial si la tabla de usuarios está vacía. */
export async function asegurarAdminPorDefecto(): Promise<void> {
  const rows = await sql<{ id: number }[]>`select id from usuarios limit 1`;
  if (rows.length > 0) return;
  const hash = await hashPassword(ADMIN_POR_DEFECTO_PASSWORD);
  await sql`
    insert into usuarios (nombre, email, password_hash, rol, activo)
    values ('Administrador/a', ${ADMIN_POR_DEFECTO_EMAIL}, ${hash}, 'admin', true)
  `;
}

export interface SesionUsuario {
  id: number;
  nombre: string;
  email: string;
  rol: "admin" | "evaluador";
}

export async function login(email: string, password: string): Promise<SesionUsuario | null> {
  const emailNorm = email.trim().toLowerCase();
  const rows = await sql<Usuario[]>`
    select * from usuarios where email = ${emailNorm}
  `;
  const usuario = rows[0];
  if (!usuario || !usuario.activo) return null;
  if (!(await verificarPassword(password, usuario.password_hash))) return null;
  return { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol as "admin" | "evaluador" };
}

export async function crearUsuario(
  nombre: string,
  email: string,
  password: string,
  rol: "admin" | "evaluador" = "evaluador"
): Promise<number> {
  const emailNorm = email.trim().toLowerCase();
  const existentes = await sql<{ id: number }[]>`select id from usuarios where email = ${emailNorm}`;
  if (existentes.length > 0) {
    throw new Error("Ya existe un usuario con ese correo.");
  }
  const hash = await hashPassword(password);
  const rows = await sql<{ id: number }[]>`
    insert into usuarios (nombre, email, password_hash, rol, activo)
    values (${nombre.trim()}, ${emailNorm}, ${hash}, ${rol}, true)
    returning id
  `;
  return rows[0].id;
}

export async function listarUsuarios(): Promise<Usuario[]> {
  return sql<Usuario[]>`select * from usuarios order by id`;
}

export async function actualizarEstadoUsuario(id: number, activo: boolean): Promise<void> {
  await sql`update usuarios set activo = ${activo} where id = ${id}`;
}

/**
 * Cambia si las evaluaciones y bonificaciones de este usuario cuentan en los
 * promedios (Resultados, Estadísticas, reportes Word). No toca "activo" --
 * el usuario puede seguir entrando al sistema y calificando con normalidad
 * aunque esté excluido del cálculo, y sus respuestas ya guardadas no se
 * borran ni se modifican: simplemente no se suman mientras esté excluido.
 */
export async function actualizarInclusionEnResultados(id: number, incluido: boolean): Promise<void> {
  await sql`update usuarios set incluido_en_resultados = ${incluido} where id = ${id}`;
}

export async function cambiarPassword(id: number, nuevaPassword: string): Promise<void> {
  const hash = await hashPassword(nuevaPassword);
  await sql`update usuarios set password_hash = ${hash} where id = ${id}`;
}
