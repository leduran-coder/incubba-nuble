import type { ConteoItem } from "@/components/charts/BarraMagnitud";

export function contarPorCampo(valores: (string | null | undefined)[]): ConteoItem[] {
  const conteo = new Map<string, number>();
  for (const v of valores) {
    const clave = v && v.trim() ? v : "Sin dato";
    conteo.set(clave, (conteo.get(clave) ?? 0) + 1);
  }
  return Array.from(conteo.entries())
    .map(([etiqueta, cantidad]) => ({ etiqueta, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad);
}
