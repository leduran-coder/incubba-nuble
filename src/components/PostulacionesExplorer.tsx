"use client";

import { useMemo, useState } from "react";
import type { Postulacion } from "@/lib/types";
import { nombreCompleto, nombreProyecto } from "@/lib/types";

function unicos(valores: (string | null)[]): string[] {
  return Array.from(new Set(valores.filter((v): v is string => !!v))).sort();
}

export function PostulacionesExplorer({ postulaciones }: { postulaciones: Postulacion[] }) {
  const [fProvincia, setFProvincia] = useState<string[]>([]);
  const [fComuna, setFComuna] = useState<string[]>([]);
  const [fGenero, setFGenero] = useState<string[]>([]);
  const [fTipo, setFTipo] = useState<string[]>([]);
  const [seleccionId, setSeleccionId] = useState<number | null>(postulaciones[0]?.id ?? null);
  const [tab, setTab] = useState<"listado" | "ficha">("listado");

  const opciones = useMemo(
    () => ({
      provincia: unicos(postulaciones.map((p) => p.provincia)),
      comuna: unicos(postulaciones.map((p) => p.comuna)),
      genero: unicos(postulaciones.map((p) => p.genero)),
      tipo: unicos(postulaciones.map((p) => p.tipo_emprendimiento)),
    }),
    [postulaciones]
  );

  const filtradas = useMemo(() => {
    return postulaciones.filter((p) => {
      if (fProvincia.length && !(p.provincia && fProvincia.includes(p.provincia))) return false;
      if (fComuna.length && !(p.comuna && fComuna.includes(p.comuna))) return false;
      if (fGenero.length && !(p.genero && fGenero.includes(p.genero))) return false;
      if (fTipo.length && !(p.tipo_emprendimiento && fTipo.includes(p.tipo_emprendimiento))) return false;
      return true;
    });
  }, [postulaciones, fProvincia, fComuna, fGenero, fTipo]);

  const seleccionada = postulaciones.find((p) => p.id === seleccionId) ?? null;

  function verFicha(id: number) {
    setSeleccionId(id);
    setTab("ficha");
  }

  return (
    <div>
      <div className="flex gap-2 mb-5 flex-wrap bg-gris-fondo border border-gris-borde rounded-2xl p-1.5">
        <button
          onClick={() => setTab("listado")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
            tab === "listado" ? "bg-white text-morado-vibrante shadow" : "text-gris-muted"
          }`}
        >
          📋 Listado general
        </button>
        <button
          onClick={() => setTab("ficha")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
            tab === "ficha" ? "bg-white text-morado-vibrante shadow" : "text-gris-muted"
          }`}
        >
          📄 Ficha técnica de postulación
        </button>
      </div>

      {tab === "listado" ? (
        <div>
          <details className="card p-4 mb-4">
            <summary className="cursor-pointer font-semibold text-gris-texto">
              🔍 Filtros de búsqueda avanzada
            </summary>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <MultiFiltro etiqueta="Provincia" opciones={opciones.provincia} valor={fProvincia} onChange={setFProvincia} />
              <MultiFiltro etiqueta="Comuna" opciones={opciones.comuna} valor={fComuna} onChange={setFComuna} />
              <MultiFiltro etiqueta="Género" opciones={opciones.genero} valor={fGenero} onChange={setFGenero} />
              <MultiFiltro etiqueta="Tipo de emprendimiento" opciones={opciones.tipo} valor={fTipo} onChange={setFTipo} />
            </div>
          </details>

          <div className="flex justify-between items-center mb-3">
            <span className="font-bold text-gris-texto text-lg">Listado General</span>
            <span className="bg-morado-vibrante/10 text-morado-vibrante font-bold text-sm px-3 py-1 rounded-full">
              Mostrando {filtradas.length} de {postulaciones.length} postulaciones
            </span>
          </div>

          <p className="text-xs text-gris-muted mb-2">
            Haz clic en una fila para abrir su ficha técnica completa.
          </p>

          <div className="card overflow-x-auto mb-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gris-fondo text-left text-gris-muted uppercase text-xs">
                  {["ID", "Proyecto", "Postulante", "Género", "Provincia", "Comuna", "Tipo", "Sector"].map((h) => (
                    <th key={h} className="px-3 py-2.5 font-bold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtradas.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => verFicha(p.id)}
                    className={`border-t border-gris-borde cursor-pointer hover:bg-morado-vibrante/5 ${
                      p.id === seleccionId ? "bg-morado-vibrante/10" : ""
                    }`}
                  >
                    <td className="px-3 py-2">{p.id}</td>
                    <td className="px-3 py-2 font-medium">{nombreProyecto(p)}</td>
                    <td className="px-3 py-2">{nombreCompleto(p)}</td>
                    <td className="px-3 py-2">{p.genero ?? "—"}</td>
                    <td className="px-3 py-2">{p.provincia ?? "—"}</td>
                    <td className="px-3 py-2">{p.comuna ?? "—"}</td>
                    <td className="px-3 py-2">{p.tipo_emprendimiento ?? "—"}</td>
                    <td className="px-3 py-2">{p.sector_industria ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div>
          <h3 className="text-lg font-bold mb-3">📄 Ficha Técnica de Postulación</h3>
          <select
            value={seleccionId ?? ""}
            onChange={(e) => setSeleccionId(Number(e.target.value))}
            className="w-full rounded-lg border border-gris-borde px-3 py-2.5 text-sm mb-5"
          >
            {postulaciones.map((p) => (
              <option key={p.id} value={p.id}>
                #{p.id} · {nombreProyecto(p)} — {nombreCompleto(p)}
              </option>
            ))}
          </select>

          {seleccionada ? <FichaPostulacion p={seleccionada} /> : null}
        </div>
      )}
    </div>
  );
}

function MultiFiltro({
  etiqueta,
  opciones,
  valor,
  onChange,
}: {
  etiqueta: string;
  opciones: string[];
  valor: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-gris-muted uppercase mb-1">{etiqueta}</label>
      <select
        multiple
        value={valor}
        onChange={(e) => onChange(Array.from(e.target.selectedOptions, (o) => o.value))}
        className="w-full rounded-lg border border-gris-borde px-2 py-1.5 text-sm h-24"
      >
        {opciones.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function FichaPostulacion({ p }: { p: Postulacion }) {
  const videoEsUrl = p.video_link?.startsWith("http");
  return (
    <div>
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="card p-5">
          <h4 className="text-morado-vibrante font-bold border-b-2 border-gris-fondo pb-2 mb-2">
            👤 Antecedentes del Postulante
          </h4>
          <Dato label="Postulante" valor={nombreCompleto(p)} />
          <Dato label="RUN" valor={p.run} />
          <Dato label="Contacto" valor={[p.correo, p.telefono].filter(Boolean).join(" · ")} />
          <Dato label="Género" valor={p.genero} />
          <Dato label="Ubicación" valor={`${p.provincia ?? "—"} / ${p.comuna ?? "—"} (${p.residencia_tipo ?? "—"})`} />
          <h4 className="text-morado-vibrante font-bold border-b-2 border-gris-fondo pb-2 mb-2 mt-4">
            🏢 Emprendimiento
          </h4>
          <Dato label="Proyecto" valor={nombreProyecto(p)} />
          <Dato label="Estado" valor={`${p.tipo_emprendimiento ?? "—"} — ${p.estado_detalle ?? "—"}`} />
          <Dato label="Empresa" valor={`${p.nombre_empresa || "No formalizada"} (${p.rut_empresa || "S/RUT"})`} />
          <Dato label="Sector" valor={`${p.sector_industria ?? "—"} · Tamaño: ${p.tamano_empresa ?? "—"}`} />
        </div>
        <div className="card p-5">
          <h4 className="text-menta font-bold border-b-2 border-gris-fondo pb-2 mb-2" style={{ color: "#0D9488" }}>
            💡 Innovación y Escalabilidad
          </h4>
          <Dato label="Potencial innovador" valor={p.tipo_potencial_innovador} />
          <Dato label="Tipo innovación" valor={p.tipo_innovacion} />
          <Dato label="Alcance territorial" valor={p.alcance_innovacion} />
          <Dato label="Financiamiento previo" valor={p.ha_levantado_financiamiento} />
          <h4 className="font-bold border-b-2 border-gris-fondo pb-2 mb-2 mt-4" style={{ color: "#0D9488" }}>
            👥 Equipo y Pitch
          </h4>
          <Dato label="Integrantes" valor={p.num_personas_equipo ? `${p.num_personas_equipo} personas` : "—"} />
          <p className="text-sm my-1.5">
            <strong>Video Pitch:</strong>{" "}
            {p.video_link ? (
              videoEsUrl ? (
                <a href={p.video_link} target="_blank" rel="noreferrer" className="text-blue-600 font-semibold">
                  Ver video ↗
                </a>
              ) : (
                p.video_link
              )
            ) : (
              "No registrado"
            )}
          </p>
        </div>
      </div>

      <details className="card p-5" open>
        <summary className="cursor-pointer font-bold text-gris-texto mb-2">
          📖 Respuestas detalladas del formulario
        </summary>
        <div className="mt-3 flex flex-col gap-3 text-sm">
          <RespuestaLarga titulo="Descripción del Proyecto" texto={p.descripcion} />
          <RespuestaLarga titulo="Propuesta de Valor" texto={p.propuesta_valor} />
          <RespuestaLarga titulo="Justificación de Innovación" texto={p.por_que_innovador} />
          <RespuestaLarga titulo="Proyección a 3 años" texto={p.resultados_3_anios} />
          <RespuestaLarga titulo="Impacto Esperado" texto={p.impacto_esperado} />
          <RespuestaLarga titulo="Descripción del Equipo" texto={p.descripcion_equipo} />
        </div>
      </details>
    </div>
  );
}

function Dato({ label, valor }: { label: string; valor: string | null | undefined }) {
  return (
    <p className="text-sm my-1.5">
      <strong>{label}:</strong> {valor || "—"}
    </p>
  );
}

function RespuestaLarga({ titulo, texto }: { titulo: string; texto: string | null }) {
  return (
    <div>
      <p className="font-semibold text-gris-texto">{titulo}:</p>
      <p className="text-gris-muted whitespace-pre-wrap">{texto || "—"}</p>
    </div>
  );
}
