"use client";

import { useState, useTransition } from "react";
import { generarEvaluacionCompletaIA } from "@/lib/actions/ia";
import type { EvaluacionCompletaIA, SugerenciaCriterio } from "@/lib/ai-evaluacion-completa";
import { ETAPA_1, ETAPA_2 } from "@/lib/rubric";

const CLAVES_BONO = [
  "madurez_tecnologica",
  "escalabilidad_modelo",
  "traccion_temprana",
  "ambicion_proyeccion",
] as const;

const NOMBRE_BONO: Record<(typeof CLAVES_BONO)[number], string> = {
  madurez_tecnologica: "Madurez tecnológica y propiedad intelectual",
  escalabilidad_modelo: "Escalabilidad del modelo de negocio",
  traccion_temprana: "Tracción temprana validada",
  ambicion_proyeccion: "Ambición y credibilidad de la proyección a 3 años",
};

export function EvaluacionAuxiliarIA({
  postulacionId,
  iaActiva,
}: {
  postulacionId: number;
  iaActiva: boolean;
}) {
  const [resultado, setResultado] = useState<EvaluacionCompletaIA | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function generar() {
    setError(null);
    setResultado(null);
    startTransition(async () => {
      try {
        const r = await generarEvaluacionCompletaIA(postulacionId);
        setResultado(r);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo generar la evaluación completa con IA.");
      }
    });
  }

  if (!iaActiva) {
    return (
      <div className="card p-5">
        <p className="text-sm text-gris-muted">
          La función de sugerencias con IA está desactivada. Un administrador/a puede activarla desde
          Configuración → 🤖 Sugerencias con IA.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <p className="text-sm text-gris-muted mb-4">
        Genera una evaluación de referencia completa hecha por IA para esta postulación: los 3
        criterios de Admisibilidad (Etapa 1), los 5 criterios de Evaluación de proyecto (Etapa 2) y
        los 4 factores cualitativos de bonificación — 12 puntos evaluables en total, basados en el
        texto de la postulación. Es solo una referencia auxiliar: no se guarda en ningún lado ni
        reemplaza la evaluación oficial del panel, que se sigue registrando en las pestañas de Etapa
        1/2/3 y Bonificación. La Etapa 3 (Entrevista personal) queda fuera porque depende de una
        conversación real, no de texto ya escrito en el formulario.
      </p>

      <button onClick={generar} disabled={isPending} className="btn-primary mb-4">
        {isPending ? "Generando evaluación completa..." : "Generar evaluación completa con IA"}
      </button>

      {error ? (
        <p className="text-sm text-red-600 mb-4 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>
      ) : null}

      {resultado ? (
        <div className="flex flex-col gap-6">
          <SeccionCriterios
            titulo={`📋 ${ETAPA_1.nombre}`}
            criterios={ETAPA_1.criterios}
            sugerencias={resultado.etapa1}
          />
          <SeccionCriterios
            titulo={`📊 ${ETAPA_2.nombre}`}
            criterios={ETAPA_2.criterios}
            sugerencias={resultado.etapa2}
          />

          <div>
            <p className="font-semibold text-gris-texto mb-3">🚀 Factores cualitativos de bonificación</p>
            <div className="flex flex-col gap-3">
              {CLAVES_BONO.map((clave) => {
                const factor = resultado.bono[clave];
                return (
                  <div key={clave} className="rounded-lg border border-gris-borde p-3">
                    <p className="font-semibold text-gris-texto text-sm">{NOMBRE_BONO[clave]}</p>
                    <p className="text-sm text-morado-vibrante font-bold">{factor.valor_1_a_5} / 5</p>
                    <p className="text-sm text-gris-muted">{factor.justificacion}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SeccionCriterios({
  titulo,
  criterios,
  sugerencias,
}: {
  titulo: string;
  criterios: { id: string; nombre: string; peso: number }[];
  sugerencias: Record<string, SugerenciaCriterio>;
}) {
  return (
    <div>
      <p className="font-semibold text-gris-texto mb-3">{titulo}</p>
      <div className="flex flex-col gap-3">
        {criterios.map((c) => {
          const s = sugerencias[c.id];
          return (
            <div key={c.id} className="rounded-lg border border-gris-borde p-3">
              <p className="font-semibold text-gris-texto text-sm">
                {c.nombre} <span className="text-gris-muted font-normal">· peso {Math.round(c.peso * 100)}%</span>
              </p>
              {s ? (
                <>
                  <p className="text-sm text-morado-vibrante font-bold">{s.nivel_sugerido}</p>
                  <p className="text-sm text-gris-muted">{s.justificacion}</p>
                </>
              ) : (
                <p className="text-sm text-gris-muted">Sin datos.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
