"use client";

import { Fragment, useState } from "react";
import type { AvanceEvaluador, ResumenProyectoEvaluador } from "@/lib/seguimiento";

function formatearFecha(iso: string | null): string {
  if (!iso) return "Sin actividad todavía";
  try {
    return new Date(iso).toLocaleString("es-CL", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function ListaPendientes({ titulo, items }: { titulo: string; items: ResumenProyectoEvaluador[] }) {
  return (
    <div>
      <p className="font-semibold text-gris-texto mb-2">
        {titulo} ({items.length})
      </p>
      {items.length === 0 ? (
        <p className="text-xs text-gris-muted">Ninguno pendiente — ya está al día en esta etapa.</p>
      ) : (
        <ul className="text-xs flex flex-col gap-1">
          {items.map((p) => (
            <li key={p.id}>
              #{p.id} · {p.proyecto} — {p.postulante}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Tabla "Avance por evaluador/a" de la página Seguimiento, con un botón
 * "Ver detalle" adicional por fila: al hacer clic, despliega debajo, para
 * ese evaluador/a, únicamente lo que le falta por hacer, separado en 4
 * listas independientes (Etapa 1, Etapa 2, Etapa 3, Bonificación) -- un
 * mismo proyecto puede aparecer en más de una lista, o solo en una si ya
 * completó las demás etapas. Es una funcionalidad puramente agregada sobre
 * la tabla que ya existía -- ninguna columna, dato ni comportamiento
 * anterior se quita o se cambia; el detalle simplemente empieza oculto y
 * solo se muestra si el administrador/a lo pide.
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
                      <p className="text-xs text-gris-muted mb-3">
                        Solo se muestran los proyectos que le faltan a {e.nombre} en cada etapa. Un mismo
                        proyecto puede aparecer en más de una lista (por ejemplo, si todavía no hace ninguna
                        de las 3 etapas) o en una sola (si ya completó las demás y solo le falta la
                        bonificación).
                      </p>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <ListaPendientes titulo="⏳ Etapa 1 · Admisibilidad" items={e.pendientesEtapa1} />
                        <ListaPendientes
                          titulo="⏳ Etapa 2 · Evaluación de proyecto"
                          items={e.pendientesEtapa2}
                        />
                        <ListaPendientes titulo="⏳ Etapa 3 · Entrevista personal" items={e.pendientesEtapa3} />
                        <ListaPendientes titulo="⏳ Bonificación" items={e.pendientesBono} />
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
