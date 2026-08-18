"use client";

import { AZUL_MAGNITUD, COLOR_CRITICO } from "@/lib/chart-colors";

/**
 * Medidor de una razón contra una meta (ej. % de proyectos liderados por
 * mujeres vs 50%). Se implementa como una barra de progreso con marca de
 * meta en vez de un velocímetro circular: para comparar un valor contra un
 * umbral, una barra lineal es más legible y precisa que un gauge circular.
 * Equivalente funcional a utils/charts.py::meter().
 */
export function GaugeMeter({
  valor,
  meta,
  titulo,
  formatoPct = true,
}: {
  valor: number;
  meta: number;
  titulo: string;
  formatoPct?: boolean;
}) {
  const rangoMax = formatoPct ? 100 : Math.max(valor, meta) * 1.2;
  const pctValor = Math.min(100, (valor / rangoMax) * 100);
  const pctMeta = Math.min(100, (meta / rangoMax) * 100);

  return (
    <div className="card p-5">
      <p className="text-sm font-semibold text-gris-muted mb-1">{titulo}</p>
      <div className="text-3xl font-extrabold text-gris-texto mb-3">
        {formatoPct ? `${valor.toFixed(0)}%` : valor.toFixed(1)}
      </div>
      <div className="relative h-4 rounded-full bg-gris-fondo border border-gris-borde overflow-visible">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pctValor}%`, background: AZUL_MAGNITUD }}
        />
        <div
          className="absolute top-[-4px] w-0.5 h-6"
          style={{ left: `${pctMeta}%`, background: COLOR_CRITICO }}
          title={`Meta: ${meta}${formatoPct ? "%" : ""}`}
        />
      </div>
      <div className="flex justify-between text-xs text-gris-muted mt-1.5">
        <span>0</span>
        <span>
          Meta: {meta}
          {formatoPct ? "%" : ""}
        </span>
        <span>
          {rangoMax}
          {formatoPct ? "%" : ""}
        </span>
      </div>
    </div>
  );
}
