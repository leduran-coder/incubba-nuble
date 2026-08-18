"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AZUL_MAGNITUD, GRID } from "@/lib/chart-colors";

export interface ConteoItem {
  etiqueta: string;
  cantidad: number;
}

// Algunas respuestas del formulario son el texto completo de una alternativa
// de opción múltiple (por ejemplo, "Disruptiva: crea un nuevo modelo de
// negocio o transforma la manera en que se resuelve un problema...") en vez
// de una palabra corta. Mostrar ese texto completo como etiqueta del eje
// hacía que se superpusiera con las etiquetas de las barras vecinas. Para
// evitarlo, se trunca el texto visible del eje a un largo fijo; el texto
// completo sigue disponible al pasar el mouse por encima de la etiqueta
// (title nativo del navegador) y en el tooltip que aparece al pasar el
// mouse sobre la barra (que siempre usa el dato original, sin truncar).
const MAX_CARACTERES_ETIQUETA = 26;

function truncar(texto: string, maxCaracteres: number): string {
  if (texto.length <= maxCaracteres) return texto;
  return texto.slice(0, maxCaracteres - 1).trimEnd() + "…";
}

function TickEtiquetaEje(props: { x?: number; y?: number; payload?: { value: string } }) {
  const { x = 0, y = 0, payload } = props;
  const texto = String(payload?.value ?? "");
  return (
    <g transform={`translate(${x},${y})`}>
      <title>{texto}</title>
      <text x={0} y={0} dy={4} textAnchor="end" fontSize={12} fill="#666">
        {truncar(texto, MAX_CARACTERES_ETIQUETA)}
      </text>
    </g>
  );
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
              <YAxis type="category" dataKey="etiqueta" width={170} tick={<TickEtiquetaEje />} />
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
