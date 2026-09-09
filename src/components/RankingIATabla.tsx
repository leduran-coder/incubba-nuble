"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import type { FilaRankingIA } from "@/lib/ai-ranking";
import { generarRankingIAPostulacion, borrarRankingIA } from "@/lib/actions/ia";
import { SeccionCriterios, CLAVES_BONO, NOMBRE_BONO } from "@/components/EvaluacionAuxiliarIA";
import { ETAPA_1, ETAPA_2 } from "@/lib/rubric";

function formatearFecha(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-CL", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

/**
 * Pantalla del Ranking IA: un botón procesa, UNA POSTULACIÓN A LA VEZ (con
 * una pequeña barra de progreso), las que todavía no tengan un resultado
 * guardado -- así cada llamada al servidor es corta (una sola postulación,
 * las 3 llamadas a la IA que ya hace la pestaña "Evaluación Auxiliar IA") y
 * nunca se corre el riesgo de que una función de Vercel se corte a la mitad
 * por demorar demasiado. Si se cierra la pestaña o el navegador a mitad de
 * camino, lo ya generado queda guardado: basta con volver y presionar
 * "Generar" de nuevo para seguir justo donde quedó, porque solo se procesan
 * las postulaciones que todavía no tienen fila en ranking_ia.
 */
export function RankingIATabla({
  filas,
  pendientesIniciales,
  totalPostulaciones,
}: {
  filas: FilaRankingIA[];
  pendientesIniciales: { id: number; label: string }[];
  totalPostulaciones: number;
}) {
  const router = useRouter();
  const [procesando, setProcesando] = useState(false);
  const [progreso, setProgreso] = useState({ hecho: 0, total: 0 });
  const [errores, setErrores] = useState<string[]>([]);
  const [expandidoId, setExpandidoId] = useState<number | null>(null);
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);

  async function procesarCola(pendientes: { id: number; label: string }[]) {
    setProcesando(true);
    setErrores([]);
    setProgreso({ hecho: 0, total: pendientes.length });

    for (let i = 0; i < pendientes.length; i++) {
      const p = pendientes[i];
      const res = await generarRankingIAPostulacion(p.id);
      if (!res.ok) {
        setErrores((e) => [...e, `${p.label}: ${res.error}`]);
      }
      setProgreso({ hecho: i + 1, total: pendientes.length });
      router.refresh();
    }

    setProcesando(false);
  }

  function generarPendientes() {
    procesarCola(pendientesIniciales);
  }

  async function regenerarTodo() {
    setConfirmarBorrado(false);
    setProcesando(true);
    setErrores([]);
    const res = await borrarRankingIA();
    if (!res.ok) {
      setErrores([res.error]);
      setProcesando(false);
      return;
    }
    router.refresh();
    // Después de borrar, TODAS las postulaciones quedan pendientes -- se
    // vuelve a construir la cola completa a partir de las filas actuales más
    // las que ya estaban pendientes, para no depender de que el refresh del
    // servidor ya haya llegado.
    const todas = [
      ...filas.map((f) => ({ id: f.id, label: `#${f.id} · ${f.proyecto} — ${f.postulante}` })),
      ...pendientesIniciales,
    ];
    await procesarCola(todas);
  }

  const generadas = totalPostulaciones - pendientesIniciales.length;

  return (
    <div>
      <div className="card p-5 mb-5">
        <p className="text-sm text-gris-muted mb-3">
          <strong>
            {generadas} de {totalPostulaciones}
          </strong>{" "}
          postulaciones tienen un Ranking IA generado.
          {filas.length > 0 ? (
            <>
              {" "}
              Última actualización más reciente:{" "}
              {formatearFecha(filas.reduce((max, f) => (f.generadoEn > max ? f.generadoEn : max), filas[0].generadoEn))}.
            </>
          ) : null}
        </p>

        {procesando ? (
          <div className="mb-3">
            <div className="w-full h-2.5 rounded-full bg-gris-fondo overflow-hidden">
              <div
                className="h-full bg-morado-vibrante transition-all"
                style={{
                  width: progreso.total > 0 ? `${(progreso.hecho / progreso.total) * 100}%` : "0%",
                }}
              />
            </div>
            <p className="text-xs text-gris-muted mt-1.5">
              Procesando {progreso.hecho} de {progreso.total}… no cierres esta pestaña. Si la cierras,
              lo ya generado queda guardado y puedes continuar más tarde presionando &quot;Generar&quot;
              de nuevo.
            </p>
          </div>
        ) : null}

        {errores.length > 0 ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 mb-3 text-sm text-red-700">
            <p className="font-semibold mb-1">
              {errores.length} postulación(es) no se pudieron procesar:
            </p>
            <ul className="list-disc list-inside">
              {errores.slice(0, 10).map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3 items-center">
          <button
            onClick={generarPendientes}
            disabled={procesando || pendientesIniciales.length === 0}
            className="btn-primary"
          >
            {procesando
              ? "Generando..."
              : pendientesIniciales.length === 0
              ? "Ya está todo generado"
              : `Generar Ranking IA (${pendientesIniciales.length} pendiente${pendientesIniciales.length === 1 ? "" : "s"})`}
          </button>

          {confirmarBorrado ? (
            <span className="flex items-center gap-2 text-sm">
              <span className="text-red-700">
                ¿Borrar todo lo generado y volver a calcularlo desde cero?
              </span>
              <button
                onClick={regenerarTodo}
                disabled={procesando}
                className="rounded-lg bg-red-600 text-white text-xs font-semibold px-3 py-1.5 disabled:opacity-40"
              >
                Sí, regenerar todo
              </button>
              <button
                onClick={() => setConfirmarBorrado(false)}
                disabled={procesando}
                className="text-xs font-semibold text-gris-muted hover:underline"
              >
                Cancelar
              </button>
            </span>
          ) : (
            <button
              onClick={() => setConfirmarBorrado(true)}
              disabled={procesando || filas.length === 0}
              className="text-xs font-semibold text-gris-muted hover:underline disabled:opacity-40"
            >
              Regenerar todo desde cero
            </button>
          )}
        </div>
      </div>

      {filas.length === 0 ? (
        <div className="card p-6 text-gris-muted">
          Aún no se ha generado ningún Ranking IA. Presiona &quot;Generar Ranking IA&quot; arriba para
          empezar.
        </div>
      ) : (
        <div className="card overflow-x-auto mb-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gris-fondo text-left text-gris-muted uppercase text-xs">
                {["Ranking", "Proyecto", "Postulante", "Admisibilidad", "Etapa 2", "Bonificación", "Puntaje final", "Detalle"].map(
                  (h) => (
                    <th key={h} className="px-3 py-2.5 font-bold whitespace-nowrap">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => {
                const expandido = expandidoId === f.id;
                return (
                  <Fragment key={f.id}>
                    <tr className="border-t border-gris-borde">
                      <td className="px-3 py-2 font-bold">{f.ranking}</td>
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
                      <td className="px-3 py-2">{f.admisibilidad}</td>
                      <td className="px-3 py-2">{f.puntajeEtapa2 ?? "—"}</td>
                      <td className="px-3 py-2">{f.puntajeBono ?? "—"}</td>
                      <td className="px-3 py-2 font-bold">{f.puntajeFinal ?? "—"}</td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => setExpandidoId(expandido ? null : f.id)}
                          className="text-xs font-semibold text-morado-vibrante hover:underline whitespace-nowrap"
                        >
                          {expandido ? "Ocultar detalle" : "Ver detalle"}
                        </button>
                      </td>
                    </tr>
                    {expandido ? (
                      <tr className="border-t border-gris-borde bg-gris-fondo/40">
                        <td colSpan={8} className="px-4 py-4">
                          <p className="text-xs text-gris-muted mb-3">
                            Generado el {formatearFecha(f.generadoEn)}. Detalle criterio por criterio de
                            la sugerencia de la IA para este proyecto.
                          </p>
                          <div className="flex flex-col gap-6">
                            <SeccionCriterios titulo={`📋 ${ETAPA_1.nombre}`} criterios={ETAPA_1.criterios} sugerencias={f.etapa1} />
                            <SeccionCriterios titulo={`📊 ${ETAPA_2.nombre}`} criterios={ETAPA_2.criterios} sugerencias={f.etapa2} />
                            <div>
                              <p className="font-semibold text-gris-texto mb-3">
                                🚀 Factores cualitativos de bonificación
                              </p>
                              <div className="grid sm:grid-cols-2 gap-3">
                                {CLAVES_BONO.map((clave) => {
                                  const factor = f.bono[clave];
                                  return (
                                    <div key={clave} className="rounded-lg border border-gris-borde p-3">
                                      <p className="font-semibold text-gris-texto text-sm">{NOMBRE_BONO[clave]}</p>
                                      <p className="text-sm text-morado-vibrante font-bold">
                                        {factor.valor_1_a_5} / 5
                                      </p>
                                      <p className="text-sm text-gris-muted">{factor.justificacion}</p>
                                    </div>
                                  );
                                })}
                              </div>
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
      )}
    </div>
  );
}
