"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { FactorBonificacion } from "@/lib/rubric";
import { guardarConfigBonificacion, guardarSectoresEstrategicos } from "@/lib/actions/config";

export function BonificacionTab({
  activaInicial,
  puntajeMaximoInicial,
  factoresIniciales,
  sectoresEstrategicosIniciales,
}: {
  activaInicial: boolean;
  puntajeMaximoInicial: number;
  factoresIniciales: FactorBonificacion[];
  sectoresEstrategicosIniciales: string[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activa, setActiva] = useState(activaInicial);
  const [puntajeMaximo, setPuntajeMaximo] = useState(puntajeMaximoInicial);
  const [factores, setFactores] = useState(factoresIniciales);
  const [guardado, setGuardado] = useState(false);

  const [sectoresTexto, setSectoresTexto] = useState(sectoresEstrategicosIniciales.join("\n"));
  const [guardandoSectores, startTransitionSectores] = useTransition();
  const [sectoresGuardados, setSectoresGuardados] = useState(false);

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

  function guardarSectores() {
    setSectoresGuardados(false);
    startTransitionSectores(async () => {
      const lista = sectoresTexto.split("\n");
      await guardarSectoresEstrategicos(lista);
      setSectoresGuardados(true);
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

      <div className="mt-6 pt-5 border-t border-gris-borde">
        <p className="font-semibold text-gris-texto text-sm mb-1">
          Sectores estratégicos regionales (uno por línea)
        </p>
        <p className="text-xs text-gris-muted mb-2">
          Se usan para el factor automático &quot;Alineación con sectores estratégicos
          regionales&quot;: si el sector o industria que declaró el postulante coincide (aunque sea
          parcialmente) con alguna línea de esta lista, obtiene el puntaje máximo de ese factor.
        </p>
        <textarea
          value={sectoresTexto}
          onChange={(e) => setSectoresTexto(e.target.value)}
          rows={6}
          className="w-full rounded-lg border border-gris-borde px-3 py-2 text-sm mb-3"
        />
        {sectoresGuardados ? (
          <p className="text-sm text-green-700 mb-3">Lista de sectores estratégicos actualizada.</p>
        ) : null}
        <button onClick={guardarSectores} disabled={guardandoSectores} className="btn-primary">
          {guardandoSectores ? "Guardando..." : "Guardar sectores estratégicos"}
        </button>
      </div>
    </div>
  );
}
