"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { guardarConfigIA } from "@/lib/actions/ia";

export function IATab({ activaInicial }: { activaInicial: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activa, setActiva] = useState(activaInicial);
  const [guardado, setGuardado] = useState(false);

  function guardar() {
    setGuardado(false);
    startTransition(async () => {
      await guardarConfigIA(activa);
      setGuardado(true);
      router.refresh();
    });
  }

  return (
    <div className="card p-5">
      <p className="text-sm text-gris-muted mb-4">
        Activa esta función para que el panel evaluador pueda pedirle a un modelo de IA (Claude, de
        Anthropic) una sugerencia preliminar de calificación a partir del texto ya escrito en cada
        postulación — tanto para los 4 factores cualitativos de bonificación (pestaña
        Bonificación) como, si se usa, para la pestaña &quot;Evaluación Auxiliar IA&quot; con los
        criterios de Admisibilidad y Evaluación de proyecto. La sugerencia nunca se guarda sola ni
        reemplaza la decisión del panel: siempre hay que revisarla y confirmarla manualmente.
      </p>
      <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
        Cada vez que alguien pide una sugerencia se hace una llamada a la API de Anthropic, lo que
        tiene un costo pequeño pero real (se cobra a la cuenta configurada en la variable de
        entorno ANTHROPIC_API_KEY en Vercel) y toma unos segundos en responder. Si tu organización
        no ha definido aún una política sobre el uso de IA en el proceso de evaluación, te
        recomendamos dejarla desactivada hasta conversarlo con el comité.
      </p>

      <label className="flex items-center gap-2 text-sm mb-4">
        <input type="checkbox" checked={activa} onChange={(e) => setActiva(e.target.checked)} />
        Activar sugerencias con IA
      </label>

      {guardado ? <p className="text-sm text-green-700 mb-3">Configuración de IA actualizada.</p> : null}

      <button onClick={guardar} disabled={isPending} className="btn-primary">
        {isPending ? "Guardando..." : "Guardar configuración de IA"}
      </button>
    </div>
  );
}
