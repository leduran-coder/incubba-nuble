import { sql } from "@/lib/db";
import type { Postulacion } from "@/lib/types";

export async function listarPostulaciones(): Promise<Postulacion[]> {
  return sql<Postulacion[]>`select * from postulaciones order by id`;
}

export async function obtenerPostulacion(id: number): Promise<Postulacion | null> {
  const rows = await sql<Postulacion[]>`select * from postulaciones where id = ${id}`;
  return rows[0] ?? null;
}
