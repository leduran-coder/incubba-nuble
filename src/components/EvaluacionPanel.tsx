"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Etapa } from "@/lib/rubric";
import type { BonificacionManualValores } from "@/lib/types";
import { guardarBonificacionManual, guardarEvaluacionEtapa } from "@/lib/actions/evaluacion";

interface EtapaData {
  etapa: Etapa;
  respuestas: Record<string, string | null>;
  comentario: string;
  promedio: number | null;
}

interface Props {
  postulaciones: { id: number; label: string }[];
  postulacionId: number;
  etapasData: EtapaData[];
  admisibilidad: { estado: "Admisible" | "No admisible" | "Pendiente"; puntaje: number | null };
  bonoManual: BonificacionManualValores | null;
  bonoCalculado: { bono: number; detalle: Record<string, number> };
  resumenAutomatico: {
    tipo_potencial_innovador: string | null;
    alcance_innovacion: string | null;
    ha_levantado_financiamiento: string | null;
  };
  puntajeMaximoBono: number;
}

const COLOR_ADMISIBILIDAD: Record<string, string> = {
  Admisible: "text-green-600",
  "No admisible": "text-red-600",
  Pendiente: "text-gris-muted",
};

export function EvaluacionPanel({
  postulaciones,
  postulacionId,
  etapasData,
  admisibilidad,
  bonoManual,
  bonoCalculado,
  resumenAutomatico,
  puntajeMaximoBono,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState(0);

  function cambiarPostulacion(id: number) {
    router.push(`/evaluacion?id=${id}`);
  }

  const tabs = [...etapasData.map((e) => e.etapa.nombre), "🚀 Bonificación potencial dinámico"];

  return (
    <div>
      <select
        value={postulacionId}
        onChange={(e) => cambiarPostulacion(Number(e.target.value))}
        className="w-full rounded-lg border border-gris-borde px-3 py-2.5 text-sm mb-5"
      >
        {postulaciones.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>

      <div className="flex gap-2 mb-5 flex-wrap bg-gris-fondo border border-gris-borde rounded-2xl p-1.5">
        {tabs.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              tab === i ? "bg-white text-morado-vibrante shadow" : "text-gris-muted"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab < etapasData.length ? (
        <EtapaForm
          key={etapasData[tab].etapa.id}
          postulacionId={postulacionId}
          data={etapasData[tab]}
        />
      ) : (
        <BonoTab
          postulacionId={postulacionId}
          bonoManual={bonoManual}
          bonoCalculado={bonoCalculado}
          resumenAutomatico={resumenAutomatico}
          puntajeMaximoBono={puntajeMaximoBono}
        />
      )}

      {tab === 0 ? (
        <p className="mt-5 text-sm">
          <strong>Estado de admisibilidad:</strong>{" "}
          <span className={`font-bold ${COLOR_ADMISIBILIDAD[admisibilidad.estado]}`}>
            {admisibilidad.estado}
          </span>
        </p>
      ) : null}
    </div>
  );
}

function EtapaForm({ postulacionId, data }: { postulacionId: number; data: EtapaData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [respuestas, setRespuestas] = useState<Record<string, string | null>>(data.respuestas);
  const [comentario, setComentario] = useState(data.comentario);
  const [faltantes, setFaltantes] = useState<string[] | null>(null);
  const [guardado, setGuardado] = useState(false);

  function guardar() {
    setGuardado(false);
    startTransition(async () => {
      const res = await guardarEvaluacionEtapa(postulacionId, data.etapa.id, respuestas, comentario);
      setFaltantes(res.faltantes.length ? res.faltantes : null);
      if (res.faltantes.length === 0) setGuardado(true);
      router.refresh();
    });
  }

  return (
    <div className="card p-5">
      <p className="text-sm text-gris-muted mb-4">{data.etapa.descripcion}</p>

      <div className="flex flex-col gap-5">
        {data.etapa.criterios.map((criterio) => {
          const nivelSel = respuestas[criterio.id] ?? null;
          const ayuda = criterio.niveles.find((n) => n.nivel === nivelSel)?.ayuda;
          return (
            <div key={criterio.id}>
              <label className="block font-semibold text-gris-texto mb-2">
                {criterio.nombre} · peso {Math.round(criterio.peso * 100)}%
              </label>
              <div className="flex flex-wrap gap-2">
                {criterio.niveles.map((n) => (
                  <button
                    key={n.nivel}
                    type="button"
                    onClick={() => setRespuestas((r) => ({ ...r, [criterio.id]: n.nivel }))}
                    className={`px-3.5 py-2 rounded-lg text-sm font-medium border transition ${
                      nivelSel === n.nivel
                        ? "bg-morado-vibrante text-white border-morado-vibrante"
                        : "border-gris-borde text-gris-texto hover:border-morado-vibrante"
                    }`}
                  >
                    {n.nivel}
                  </button>
                ))}
              </div>
              {ayuda ? <p className="text-xs text-gris-muted mt-1.5">ℹ️ {ayuda}</p> : null}
            </div>
          );
        })}

        <div>
          <label className="block font-semibold text-gris-texto mb-1">
            Comentarios / justificación (opcional)
          </label>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gris-borde px-3 py-2 text-sm"
          />
        </div>

        {faltantes ? (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
            Falta calificar: {faltantes.join(", ")}. Guarda solo los criterios ya calificados; el
            promedio de la etapa se calculará cuando estén todos completos.
          </p>
        ) : null}
        {guardado ? <p className="text-sm text-green-700">Evaluación guardada.</p> : null}

        <button onClick={guardar} disabled={isPending} className="btn-primary self-start">
          {isPending ? "Guardando..." : "Guardar evaluación de esta etapa"}
        </button>

        <div className="metric-card mt-2">
          <div className="metric-label">Puntaje promedio de esta etapa (todos los evaluadores)</div>
          <div className="metric-value">
            {data.promedio !== null ? data.promedio : "—"}
          </div>
          {data.promedio === null ? (
            <p className="text-xs text-gris-muted mt-1">
              Aún no hay evaluaciones completas de esta etapa para calcular un promedio.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

interface FactorSlider {
  id: "madurezTecnologica" | "escalabilidadModelo" | "traccionTemprana" | "ambicionProyeccion";
  titulo: string;
  pregunta: string;
  ancla1: string;
  ancla5: string;
}

const FACTORES_SLIDER: FactorSlider[] = [
  {
    id: "madurezTecnologica",
    titulo: "Madurez tecnológica y propiedad intelectual",
    pregunta: "¿Qué tan madura y protegida está la tecnología o solución (escala TRL simplificada)?",
    ancla1: "TRL 1-2: idea o investigación conceptual, sin prototipo",
    ancla5: "TRL 9: probada en operación comercial; PI registrada o en trámite",
  },
  {
    id: "escalabilidadModelo",
    titulo: "Escalabilidad del modelo de negocio",
    pregunta:
      "¿Qué tan bajo es el costo de atender un cliente adicional, y qué tan replicable es el modelo fuera de Ñuble?",
    ancla1: "Alto costo marginal; difícil de replicar fuera de la comuna",
    ancla5: "Costo marginal bajo (plataforma/software), replicable y con efectos de red",
  },
  {
    id: "traccionTemprana",
    titulo: "Tracción temprana validada",
    pregunta: "¿Qué tanta evidencia concreta hay de demanda ya validada (no solo proyectada)?",
    ancla1: "Sin evidencia de demanda validada; solo hipótesis",
    ancla5: "Pilotos o ventas con clientes ancla, alianzas ya firmadas",
  },
  {
    id: "ambicionProyeccion",
    titulo: "Ambición y credibilidad de la proyección a 3 años",
    pregunta: "¿Qué tan creíble (no solo ambiciosa) es la proyección de crecimiento del equipo?",
    ancla1: "Poco creíble o poco ambiciosa",
    ancla5: "Muy creíble y muy ambiciosa, con capacidad real de ejecutarla",
  },
];

function BonoTab({
  postulacionId,
  bonoManual,
  bonoCalculado,
  resumenAutomatico,
  puntajeMaximoBono,
}: {
  postulacionId: number;
  bonoManual: BonificacionManualValores | null;
  bonoCalculado: { bono: number; detalle: Record<string, number> };
  resumenAutomatico: Props["resumenAutomatico"];
  puntajeMaximoBono: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [valores, setValores] = useState({
    madurezTecnologica: bonoManual?.madurez_tecnologica_1_a_5 ?? 3,
    escalabilidadModelo: bonoManual?.escalabilidad_1_a_5 ?? 3,
    traccionTemprana: bonoManual?.traccion_1_a_5 ?? 3,
    ambicionProyeccion: bonoManual?.valor_1_a_5 ?? 3,
  });
  const [comentario, setComentario] = useState(bonoManual?.comentario ?? "");
  const [guardado, setGuardado] = useState(false);

  function guardar() {
    setGuardado(false);
    startTransition(async () => {
      await guardarBonificacionManual(postulacionId, valores, comentario);
      setGuardado(true);
      router.refresh();
    });
  }

  return (
    <div className="card p-5">
      <p className="text-sm text-gris-muted mb-4">
        Bonificación adicional (no exigida literalmente por las bases) que premia el potencial
        dinámico real del proyecto: capacidad de crecer a tasas superiores al 20% anual, según la
        definición de CORFO citada en el punto 4.1 de las bases. Los factores automáticos se toman
        de lo declarado en el formulario; los 4 factores cualitativos los califica el panel.
      </p>

      <p className="font-semibold text-gris-texto mb-2">Factores automáticos (declarados por el postulante)</p>
      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <div className="metric-card">
          <div className="metric-label">Tipo de potencial innovador</div>
          <div className="metric-value text-lg">{resumenAutomatico.tipo_potencial_innovador ?? "—"}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Alcance de la innovación</div>
          <div className="metric-value text-lg">{resumenAutomatico.alcance_innovacion ?? "—"}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Financiamiento previo</div>
          <div className="metric-value text-lg">{resumenAutomatico.ha_levantado_financiamiento ?? "—"}</div>
        </div>
      </div>

      <p className="font-semibold text-gris-texto mb-1">Factores cualitativos del panel</p>
      <p className="text-sm text-gris-muted mb-4">
        Califica cada uno de 1 a 5 según la evidencia presentada en la postulación.
      </p>

      <div className="flex flex-col gap-5 mb-4">
        {FACTORES_SLIDER.map((factor) => (
          <div key={factor.id}>
            <label className="block font-semibold text-gris-texto mb-1">{factor.titulo}</label>
            <p className="text-xs text-gris-muted mb-2">{factor.pregunta}</p>
            <input
              type="range"
              min={1}
              max={5}
              value={valores[factor.id]}
              onChange={(e) => setValores((v) => ({ ...v, [factor.id]: Number(e.target.value) }))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gris-muted">
              <span>1 = {factor.ancla1}</span>
              <span className="font-bold text-morado-vibrante text-base">{valores[factor.id]}</span>
              <span className="text-right">5 = {factor.ancla5}</span>
            </div>
          </div>
        ))}
      </div>

      <textarea
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        placeholder="Justificación de estas calificaciones (opcional)"
        rows={2}
        className="w-full rounded-lg border border-gris-borde px-3 py-2 text-sm mb-4"
      />

      {guardado ? <p className="text-sm text-green-700 mb-2">Bonificación cualitativa guardada.</p> : null}

      <button onClick={guardar} disabled={isPending} className="btn-primary mb-5">
        {isPending ? "Guardando..." : "Guardar bonificación cualitativa"}
      </button>

      <div className="metric-card">
        <div className="metric-label">Bonificación total estimada (máx. {puntajeMaximoBono} pts)</div>
        <div className="metric-value">{bonoCalculado.bono}</div>
      </div>
    </div>
  );
}
