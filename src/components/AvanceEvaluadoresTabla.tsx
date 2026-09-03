"use client";

import { Fragment, useState } from "react";
import type { AvanceEvaluador } from "@/lib/seguimiento";

function formatearFecha(iso: string | null): string {
  if (!iso) return "Sin actividad todavía";
  try {
    return new Date(iso).toLocaleString("es-CL", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

/**
 * Tabla "Avance por evaluador/a" de la página Seguimiento, con un botón
 * "Ver detalle" adicional por fila: al hacer clic, despliega debajo la
 * lista concreta de proyectos que ese evaluador/a ya evaluó por completo y
 * la de los que todavía tiene pendientes. Es una funcionalidad puramente
 * agregada sobre la tabla que ya existía -- ninguna columna, dato ni
 * comportamiento anterior se quita o se cambia; el detalle simplemente
 * empieza oculto y solo se muestra si el administrador/a lo pide.
 */
export function AvanceEvaluadoresTabla({ evaluadores }: { evaluadores: AvanceEvaluador[] }) {
  const [expandidoId, setExpandidoId] = useState<number | null>(null);

  if (evaluadores.length === 0) {
    return (
      <div className="card p-6 text-gris-muted mb-8">
        Aún no hay evaluadores/as registrados (agrégalos en Configuración → 👥 Evaluadores).
      </div>
    );
  }

  return (
    <div className="card overflow-x-auto mb-2">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gris-fondo text-left text-gris-muted uppercase text-xs">
            {[
              "Evaluador/a",
              "Estado",
              "Etapa 1",
              "Etapa 2",
              "Etapa 3",
              "Bonificación",
              "Proyectos evaluados por completo",
              "Última actividad",
              "Detalle",
            ].map((h) => (
              <th key={h} className="px-3 py-2.5 font-bold whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {evaluadores.map((e) => {
            const expandido = expandidoId === e.id;
            return (
              <Fragment key={e.id}>
                <tr className="border-t border-gris-borde">
                  <td className="px-3 py-2 font-medium">
                    {e.nombre}
                    <div className="text-xs text-gris-muted">{e.email}</div>
                  </td>
                  <td className="px-3 py-2">
                    {e.activo ? (
                      <span className="text-xs font-bold text-menta">Activo/a</span>
                    ) : (
                      <span className="text-xs font-bold text-gris-muted">Desactivado/a</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {e.etapa1Completas} / {e.totalPostulaciones}
                  </td>
                  <td className="px-3 py-2">
                    {e.etapa2Completas} / {e.totalPostulaciones}
                  </td>
                  <td className="px-3 py-2">
                    {e.etapa3Completas} / {e.totalPostulaciones}
                  </td>
                  <td className="px-3 py-2">
                    {e.bonoCompletas} / {e.totalPostulaciones}
                  </td>
                  <td className="px-3 py-2 font-bold text-morado-vibrante">
                    {e.totalmenteEvaluadas} / {e.totalPostulaciones}
                  </td>
                  <td className="px-3 py-2 text-xs">{formatearFecha(e.ultimaActividad)}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setExpandidoId(expandido ? null : e.id)}
                      className="text-xs font-semibold text-morado-vibrante hover:underline whitespace-nowrap"
                    >
                      {expandido ? "Ocultar detalle" : "Ver detalle"}
                    </button>
                  </td>
                </tr>
                {expandido ? (
                  <tr className="border-t border-gris-borde bg-gris-fondo/40">
                    <td colSpan={9} className="px-4 py-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <p className="font-semibold text-gris-texto mb-2">
                            ✅ Evaluados por completo ({e.proyectosEvaluados.length})
                          </p>
                          {e.proyectosEvaluados.length === 0 ? (
                            <p className="text-xs text-gris-muted">Todavía ninguno.</p>
                          ) : (
                            <ul className="text-xs flex flex-col gap-1">
                              {e.proyectosEvaluados.map((p) => (
                                <li key={p.id}>
                                  #{p.id} · {p.proyecto} — {p.postulante}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gris-texto mb-2">
                            ⏳ Pendientes ({e.proyectosPendientes.length})
                          </p>
                          {e.proyectosPendientes.length === 0 ? (
                            <p className="text-xs text-gris-muted">
                              Ninguno — ya evaluó todos los proyectos por completo.
                            </p>
                          ) : (
                            <ul className="text-xs flex flex-col gap-1">
                              {e.proyectosPendientes.map((p) => (
                                <li key={p.id}>
                                  #{p.id} · {p.proyecto} — {p.postulante}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
