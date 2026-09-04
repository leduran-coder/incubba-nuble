"use client";

import { useMemo, useState } from "react";
import type { FilaRanking } from "@/lib/scoring";

function toCsv(filas: FilaRanking[]): string {
  const headers = [
    "Ranking",
    "ID",
    "Proyecto",
    "Postulante",
    "Comuna",
    "Género",
    "Tipo",
    "Admisibilidad",
    "Etapa 2",
    "Etapa 3",
    "Bonificación",
    "Puntaje final",
    "Ya factura (SII)",
  ];
  const filasCsv = filas.map((f) =>
    [
      f.ranking,
      f.id,
      f.proyecto,
      f.postulante,
      f.comuna ?? "",
      f.genero ?? "",
      f.tipo ?? "",
      f.admisibilidad,
      f.etapa2 ?? "",
      f.etapa3 ?? "",
      f.bonificacion,
      f.puntajeFinal ?? "",
      f.yaFacturando ? "Sí" : "No",
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  return [headers.join(","), ...filasCsv].join("\n");
}

export function ResultadosTable({ filas, cupoMaximo }: { filas: FilaRanking[]; cupoMaximo: number }) {
  const [fAdmisibilidad, setFAdmisibilidad] = useState<string[]>([]);
  const [soloConPuntaje, setSoloConPuntaje] = useState(false);

  const opciones = useMemo(
    () => Array.from(new Set(filas.map((f) => f.admisibilidad))).sort(),
    [filas]
  );

  const filtradas = useMemo(() => {
    return filas.filter((f) => {
      if (fAdmisibilidad.length && !fAdmisibilidad.includes(f.admisibilidad)) return false;
      if (soloConPuntaje && f.puntajeFinal === null) return false;
      return true;
    });
  }, [filas, fAdmisibilidad, soloConPuntaje]);

  function descargar() {
    const csv = toCsv(filas);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ranking_incubba_nuble_2026.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <details className="card p-4 mb-4">
        <summary className="cursor-pointer font-semibold text-gris-texto">Filtros</summary>
        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          <div>
            <label className="block text-xs font-bold text-gris-muted uppercase mb-1">Admisibilidad</label>
            <select
              multiple
              value={fAdmisibilidad}
              onChange={(e) => setFAdmisibilidad(Array.from(e.target.selectedOptions, (o) => o.value))}
              className="w-full rounded-lg border border-gris-borde px-2 py-1.5 text-sm h-20"
            >
              {opciones.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm mt-6">
            <input
              type="checkbox"
              checked={soloConPuntaje}
              onChange={(e) => setSoloConPuntaje(e.target.checked)}
            />
            Mostrar solo postulaciones con puntaje final calculado
          </label>
        </div>
      </details>

      <div className="card overflow-x-auto mb-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gris-fondo text-left text-gris-muted uppercase text-xs">
              {["Ranking", "ID", "Proyecto", "Postulante", "Comuna", "Género", "Tipo", "Admisibilidad", "Etapa 2", "Etapa 3", "Bonificación", "Puntaje final"].map(
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
              <tr
                key={f.id}
                className="border-t border-gris-borde"
                style={f.ranking <= cupoMaximo ? { background: "#F4F1FA" } : undefined}
              >
                <td className="px-3 py-2 font-bold">{f.ranking}</td>
                <td className="px-3 py-2">{f.id}</td>
                <td className="px-3 py-2 font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    {f.proyecto}
                    {f.yaFacturando ? (
                      <span
                        title="Ya facturando: declaró estar formalizado ante el SII y con ventas generadas."
                        aria-label="Ya facturando"
                        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold leading-none shrink-0"
                      >
                        $
                      </span>
                    ) : null}
                  </span>
                </td>
                <td className="px-3 py-2">{f.postulante}</td>
                <td className="px-3 py-2">{f.comuna ?? "—"}</td>
                <td className="px-3 py-2">{f.genero ?? "—"}</td>
                <td className="px-3 py-2">{f.tipo ?? "—"}</td>
                <td className="px-3 py-2">{f.admisibilidad}</td>
                <td className="px-3 py-2">{f.etapa2 ?? "—"}</td>
                <td className="px-3 py-2">{f.etapa3 ?? "—"}</td>
                <td className="px-3 py-2">{f.bonificacion}</td>
                <td className="px-3 py-2 font-bold">{f.puntajeFinal ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gris-muted mb-1">
        Las filas resaltadas corresponden al top {cupoMaximo} (cupo máximo según las bases).
      </p>
      <p className="text-xs text-gris-muted mb-4 flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold leading-none shrink-0"
        >
          $
        </span>
        junto al nombre del proyecto: el postulante declaró en el formulario que su emprendimiento ya
        está formalizado ante el SII y generando ventas.
      </p>

      <button onClick={descargar} className="btn-primary">
        Descargar ranking como CSV
      </button>
    </div>
  );
}
