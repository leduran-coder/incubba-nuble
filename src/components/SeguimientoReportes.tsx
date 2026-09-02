"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AvanceProyecto } from "@/lib/seguimiento";
import { guardarSinPotencialDinamico } from "@/lib/actions/config";

export function SeguimientoReportes({
  filas,
  totalEvaluadores,
}: {
  filas: AvanceProyecto[];
  totalEvaluadores: number;
}) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [isPending, startTransition] = useTransition();
  const [pendienteId, setPendienteId] = useState<number | null>(null);

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

  function toggleSinPotencialDinamico(id: number, valorActual: boolean) {
    setPendienteId(id);

    startTransition(async () => {
      await guardarSinPotencialDinamico(id, !valorActual);
      router.refresh();
      setPendienteId(null);
    });
  }

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
              {[
                "ID",
                "Proyecto",
                "Postulante",
                "Evaluadores/as que participaron",
                "Evaluaciones completas",
                "Sin potencial dinámico",
                "Reporte",

              ].map((h) => (
                <th key={h} className="px-3 py-2.5 font-bold whitespace-nowrap">
                  {h}
                </th>
              ))}
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
                  <button
                    type="button"
                    onClick={() => toggleSinPotencialDinamico(f.id, f.sinPotencialDinamico)}
                    disabled={isPending && pendienteId === f.id}
                    title="Al marcarlo, la bonificación de este proyecto se fuerza a 0 en Resultados, Estadísticas y en el reporte Word, sin afectar en nada lo que los evaluadores hayan calificado o sigan calificando."
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      f.sinPotencialDinamico ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                    }`}
                  >
                    {isPending && pendienteId === f.id
                      ? "Guardando..."
                      : f.sinPotencialDinamico
                      ? "Sin Potencial Dinámico"
                      : "Con Potencial Dinámico"}

                  </button>
                </td>
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
      <p className="text-xs text-gris-muted mt-2">
        &quot;Sin potencial dinámico&quot; es una marca exclusiva del administrador/a: cuando está activada,
        la bonificación completa de ese proyecto (automática + calificada por el panel) se suma como 0 en
        el resultado final, sin importar lo que los evaluadores hayan registrado o sigan registrando en la
        pestaña Bonificación — sus respuestas guardadas no se tocan ni se borran, y pueden seguir
        calificando con total normalidad.
      </p>
    </div>
  );
}
