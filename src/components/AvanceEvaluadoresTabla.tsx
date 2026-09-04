"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AvanceEvaluador, ResumenProyectoEvaluador } from "@/lib/seguimiento";
import { cambiarInclusionEnResultados } from "@/lib/actions/config";

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
 * completó las demás etapas.
 *
 * También incluye el botón "Incluido en resultados / Excluido de
 * resultados": es una marca distinta de "Activo/a" (que solo controla si el
 * evaluador/a puede iniciar sesión). Al excluir a alguien, sus evaluaciones y
 * bonificaciones YA guardadas dejan de sumarse en Resultados, Estadísticas y
 * los reportes Word -- sin borrar ni tocar ninguna respuesta, y sin quitarle
 * el acceso al sistema. Pensado para cuando hay que cerrar el proceso y
 * algunos evaluadores no alcanzaron a terminar: el administrador/a puede
 * excluirlos para ver cómo varía el ranking sin su aporte, e incluirlos de
 * nuevo en cualquier momento (el cambio se refleja al instante en
 * Resultados/Estadísticas). El resto de la tabla (columnas, avance,
 * "Ver detalle") sigue funcionando exactamente igual que antes.
 */
export function AvanceEvaluadoresTabla({ evaluadores }: { evaluadores: AvanceEvaluador[] }) {
  const router = useRouter();
  const [expandidoId, setExpandidoId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pendienteId, setPendienteId] = useState<number | null>(null);
  // Mismo patrón de cambio optimista que ya usa SeguimientoReportes.tsx: el
  // botón cambia de inmediato al hacer clic, mientras la acción al servidor
  // se guarda en segundo plano.
  const [cambiosOptimistas, setCambiosOptimistas] = useState<Record<number, boolean>>({});

  function toggleInclusion(id: number, valorActual: boolean) {
    const nuevoValor = !valorActual;
    setCambiosOptimistas((c) => ({ ...c, [id]: nuevoValor }));
    setPendienteId(id);
    startTransition(async () => {
      await cambiarInclusionEnResultados(id, nuevoValor);
      router.refresh();
      setPendienteId(null);
    });
  }

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
              "Incluido en resultados",
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
            const incluido = cambiosOptimistas[e.id] ?? e.incluidoEnResultados;
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
                      onClick={() => toggleInclusion(e.id, incluido)}
                      disabled={isPending && pendienteId === e.id}
                      title="Al excluirlo, sus evaluaciones y bonificaciones ya guardadas dejan de sumarse en Resultados, Estadísticas y en el reporte Word -- no se borra ni se modifica ninguna respuesta, y puede seguir entrando al sistema y calificando con normalidad."
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
                        incluido ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {incluido ? "Incluido en resultados" : "Excluido de resultados"}
                    </button>
                  </td>
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
                    <td colSpan={10} className="px-4 py-4">
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
