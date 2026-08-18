"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { FactorBonificacion } from "@/lib/rubric";
import { guardarConfigBonificacion } from "@/lib/actions/config";

export function BonificacionTab({
  activaInicial,
  puntajeMaximoInicial,
  factoresIniciales,
}: {
  activaInicial: boolean;
  puntajeMaximoInicial: number;
  factoresIniciales: FactorBonificacion[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activa, setActiva] = useState(activaInicial);
  const [puntajeMaximo, setPuntajeMaximo] = useState(puntajeMaximoInicial);
  const [factores, setFactores] = useState(factoresIniciales);
  const [guardado, setGuardado] = useState(false);

  function actualizarPeso(id: string, peso: number) {
    setFactores((fs) => fs.map((f) => (f.id === id ? { ...f, peso } : f)));
  }

  function guardar() {
    setGuardado(false);
    startTransition(async () => {
      await guardarConfigBonificacion(activa, puntajeMaximo, factores);
      setGuardado(true);
      router.refresh();
    });
  }

  return (
    <div className="card p-5">
      <p className="text-sm text-gris-muted mb-4">
        Ajusta la importancia relativa de cada factor de la bonificación por{" "}
        <strong>potencial dinámico</strong>. Los pesos se re-normalizan automáticamente aunque no
        sumen 100.
      </p>

      <label className="flex items-center gap-2 text-sm mb-4">
        <input type="checkbox" checked={activa} onChange={(e) => setActiva(e.target.checked)} />
        Bonificación activa
      </label>

      <label className="block text-sm font-semibold text-gris-texto mb-1">
        Puntaje máximo de bonificación (puntos extra sobre el puntaje final de 100)
      </label>
      <input
        type="number"
        min={0}
        max={30}
        value={puntajeMaximo}
        onChange={(e) => setPuntajeMaximo(Number(e.target.value))}
        className="rounded-lg border border-gris-borde px-3 py-2 text-sm mb-5 w-40"
      />

      <div className="flex flex-col gap-4 mb-5">
        {factores.map((factor) => (
          <div key={factor.id}>
            <p className="font-semibold text-gris-texto text-sm mb-1">{factor.nombre}</p>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={factor.peso}
                onChange={(e) => actualizarPeso(factor.id, Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-bold text-morado-vibrante w-12 text-right">
                {factor.peso.toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {guardado ? <p className="text-sm text-green-700 mb-3">Configuración de bonificación actualizada.</p> : null}

      <button onClick={guardar} disabled={isPending} className="btn-primary">
        {isPending ? "Guardando..." : "Guardar configuración de bonificación"}
      </button>
    </div>
  );
}
