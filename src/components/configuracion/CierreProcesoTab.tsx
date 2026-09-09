"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cambiarCierreProceso } from "@/lib/actions/config";

/**
 * Botón único para cerrar o reabrir el proceso de evaluación completo.
 * Mientras está cerrado, nadie -- evaluador/a ni administrador/a -- puede
 * guardar evaluaciones de etapas ni bonificación cualitativa en la pantalla
 * Evaluación: ver procesoEvaluacionCerrado en config-store.ts y las
 * validaciones agregadas en actions/evaluacion.ts. No se borra ni se
 * modifica ninguna evaluación o bonificación ya guardada -- Resultados,
 * Estadísticas y los reportes Word siguen funcionando igual con los datos
 * existentes. Es una acción 100% reversible: se puede reabrir en cualquier
 * momento desde esta misma pantalla, por ejemplo si se cerró por error o si
 * hace falta dejar que alguien corrija algo después del cierre.
 */
export function CierreProcesoTab({ cerradoInicial }: { cerradoInicial: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [cerrado, setCerrado] = useState(cerradoInicial);

  function toggle() {
    const nuevoValor = !cerrado;
    setCerrado(nuevoValor);
    startTransition(async () => {
      await cambiarCierreProceso(nuevoValor);
      router.refresh();
    });
  }

  return (
    <div className="card p-5">
      <p className="text-sm text-gris-muted mb-4">
        Usa este botón cuando se cumpla el plazo de evaluación y quieras impedir que se sigan
        guardando calificaciones. Al cerrar el proceso, tanto los evaluadores/as como tú dejan de
        poder guardar evaluaciones de etapas (Admisibilidad, Evaluación de proyecto, Entrevista
        personal) y bonificación cualitativa en la pantalla Evaluación — los botones &quot;Guardar&quot;
        quedan bloqueados de inmediato para todos. Todo lo que ya está guardado se mantiene
        exactamente igual: Resultados, Estadísticas y los reportes Word siguen funcionando con los
        datos existentes, sin ningún cambio.
      </p>
      <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5">
        Es una acción completamente reversible: si cierras el proceso por error, o si más adelante
        necesitas dejar que alguien corrija una evaluación, puedes volver aquí y reabrirlo en
        cualquier momento — no se pierde ni se altera ninguna evaluación ya registrada mientras
        tanto.
      </p>

      <div className="flex items-center gap-3 mb-5">
        <span className="text-sm font-semibold text-gris-texto">Estado actual:</span>
        {cerrado ? (
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700">
            Proceso cerrado
          </span>
        ) : (
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
            Proceso abierto
          </span>
        )}
      </div>

      {cerrado ? (
        <button onClick={toggle} disabled={isPending} className="btn-primary">
          {isPending ? "Guardando..." : "Reabrir proceso de evaluación"}
        </button>
      ) : (
        <button
          onClick={toggle}
          disabled={isPending}
          className="rounded-lg bg-red-600 text-white text-sm font-semibold px-4 py-2.5 disabled:opacity-40"
        >
          {isPending ? "Guardando..." : "Cerrar proceso de evaluación"}
        </button>
      )}
    </div>
  );
}
