"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AZUL_MAGNITUD, GRID } from "@/lib/chart-colors";

export interface ConteoItem {
  etiqueta: string;
  cantidad: number;
}

/**
 * Barra de un solo hue para comparar magnitud entre categorías (no
 * identidad) — replica utils/charts.py::barra_magnitud().
 */
export function BarraMagnitud({
  datos,
  titulo,
  horizontal = true,
  altura = 340,
}: {
  datos: ConteoItem[];
  titulo?: string;
  horizontal?: boolean;
  altura?: number;
}) {
  return (
    <div className="card p-4">
      {titulo ? <p className="font-semibold text-gris-texto mb-2 text-sm">{titulo}</p> : null}
      <ResponsiveContainer width="100%" height={altura}>
        <BarChart
          data={datos}
          layout={horizontal ? "vertical" : "horizontal"}
          margin={{ top: 8, right: 28, left: 8, bottom: 8 }}
        >
          <CartesianGrid stroke={GRID} horizontal={!horizontal} vertical={horizontal} />
          {horizontal ? (
            <>
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="etiqueta" width={140} tick={{ fontSize: 12 }} />
            </>
          ) : (
            <>
              <XAxis type="category" dataKey="etiqueta" tick={{ fontSize: 12 }} />
              <YAxis type="number" tick={{ fontSize: 12 }} />
            </>
          )}
          <Tooltip />
          <Bar dataKey="cantidad" radius={4}>
            {datos.map((_, i) => (
              <Cell key={i} fill={AZUL_MAGNITUD} />
            ))}
            <LabelList dataKey="cantidad" position={horizontal ? "right" : "top"} fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
