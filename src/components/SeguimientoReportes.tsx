"use client";

import { useMemo, useState } from "react";
import type { AvanceProyecto } from "@/lib/seguimiento";

export function SeguimientoReportes({
  filas,
  totalEvaluadores,
}: {
  filas: AvanceProyecto[];
  totalEvaluadores: number;
}) {
  const [busqueda, setBusqueda] = useState("");

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return filas;
    return filas.filter(
      (f) =>
        f.proyecto.toLowerCase().includes(q) ||
        f.postulante.toLowerCase().includes(q) ||
        String(f.id).includes(q)
    );
  }, [filas, busqueda]);

  if (filas.length === 0) {
    return <div className="card p-6 text-gris-muted">Aún no hay postulaciones cargadas.</div>;
  }

  return (
    <div>
      <input
        type="text"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar por proyecto, postulante o ID..."
        className="w-full rounded-lg border border-gris-borde px-3 py-2 text-sm mb-3"
      />
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gris-fondo text-left text-gris-muted uppercase text-xs">
              {["ID", "Proyecto", "Postulante", "Evaluadores/as que participaron", "Evaluaciones completas", "Reporte"].map(
                (h) => (
                  <th key={h} className="px-3 py-2.5 font-bold whitespace-nowrap">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {filtradas.map((f) => (
              <tr key={f.id} className="border-t border-gris-borde">
                <td className="px-3 py-2">{f.id}</td>
                <td className="px-3 py-2 font-medium">{f.proyecto}</td>
                <td className="px-3 py-2">{f.postulante}</td>
                <td className="px-3 py-2">
                  {f.evaluadoresQueParticiparon} / {totalEvaluadores || "—"}
                </td>
                <td className="px-3 py-2">{f.evaluacionesCompletas}</td>
                <td className="px-3 py-2">
                  <a href={`/api/reportes/${f.id}`} className="btn-primary inline-block px-3 py-1.5 text-xs">
                    Descargar Word
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtradas.length === 0 ? (
        <p className="text-sm text-gris-muted mt-3">Ningún proyecto coincide con esa búsqueda.</p>
      ) : null}
    </div>
  );
}
