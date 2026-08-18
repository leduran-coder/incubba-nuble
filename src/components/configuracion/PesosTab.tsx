"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { guardarPesoEtapas } from "@/lib/actions/config";

export function PesosTab({ pesoEtapa2Inicial, pesoEtapa3Inicial }: { pesoEtapa2Inicial: number; pesoEtapa3Inicial: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pesoE2, setPesoE2] = useState(pesoEtapa2Inicial);
  const [pesoE3, setPesoE3] = useState(pesoEtapa3Inicial);
  const [guardado, setGuardado] = useState(false);

  function guardar() {
    setGuardado(false);
    startTransition(async () => {
      await guardarPesoEtapas(pesoE2, pesoE3);
      setGuardado(true);
      router.refresh();
    });
  }

  return (
    <div className="card p-5">
      <p className="text-sm text-gris-muted mb-5">
        Ponderación de la <strong>Etapa 2 (evaluación de proyecto)</strong> y la{" "}
        <strong>Etapa 3 (entrevista)</strong> en el puntaje final combinado. La Etapa 1
        (admisibilidad) actúa como filtro pasa/no pasa y no suma al puntaje final.
      </p>

      <div className="flex flex-col gap-5 mb-5 max-w-md">
        <div>
          <label className="block text-sm font-semibold text-gris-texto mb-1">Peso Etapa 2 · Proyecto</label>
          <div className="flex items-center gap-3">
            <input type="range" min={0} max={1} step={0.05} value={pesoE2} onChange={(e) => setPesoE2(Number(e.target.value))} className="flex-1" />
            <span className="text-sm font-bold text-morado-vibrante w-12 text-right">{pesoE2.toFixed(2)}</span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gris-texto mb-1">Peso Etapa 3 · Entrevista</label>
          <div className="flex items-center gap-3">
            <input type="range" min={0} max={1} step={0.05} value={pesoE3} onChange={(e) => setPesoE3(Number(e.target.value))} className="flex-1" />
            <span className="text-sm font-bold text-morado-vibrante w-12 text-right">{pesoE3.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {guardado ? <p className="text-sm text-green-700 mb-3">Pesos actualizados.</p> : null}

      <button onClick={guardar} disabled={isPending} className="btn-primary">
        {isPending ? "Guardando..." : "Guardar pesos entre etapas"}
      </button>
    </div>
  );
}
