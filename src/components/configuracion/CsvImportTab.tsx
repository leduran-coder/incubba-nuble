"use client";

import { useState, useTransition } from "react";
import Papa from "papaparse";
import { FIELD_DEFINITIONS, sugerirMapeo } from "@/lib/importer";
import { importarPostulaciones } from "@/lib/actions/config";

export function CsvImportTab() {
  const [isPending, startTransition] = useTransition();
  const [columnas, setColumnas] = useState<string[] | null>(null);
  const [filas, setFilas] = useState<Record<string, string | null>[] | null>(null);
  const [mapeo, setMapeo] = useState<Record<string, string | null>>({});
  const [evitarDup, setEvitarDup] = useState(true);
  const [resultado, setResultado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setError(null);
    setResultado(null);
    Papa.parse<Record<string, string>>(archivo, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const cols = res.meta.fields ?? [];
        setColumnas(cols);
        setFilas(res.data);
        setMapeo(sugerirMapeo(cols));
      },
      error: (err) => setError(`No se pudo leer el archivo: ${err.message}`),
    });
  }

  const TAMANO_LOTE = 40;

  function importar() {
    if (!filas) return;
    setResultado(null);
    startTransition(async () => {
      // Se envía en lotes (en vez de todas las filas en una sola petición)
      // para no toparse con el límite de tamaño de envío del servidor
      // cuando hay muchas postulaciones o respuestas de texto largas.
      let nuevas = 0;
      let omitidas = 0;
      const totalLotes = Math.ceil(filas.length / TAMANO_LOTE);
      for (let i = 0; i < filas.length; i += TAMANO_LOTE) {
        const lote = filas.slice(i, i + TAMANO_LOTE);
        setResultado(`Importando lote ${Math.floor(i / TAMANO_LOTE) + 1} de ${totalLotes}...`);
        const res = await importarPostulaciones(lote, mapeo, evitarDup);
        nuevas += res.nuevas;
        omitidas += res.omitidas;
      }
      setResultado(`Importación completa: ${nuevas} postulaciones nuevas, ${omitidas} omitidas por duplicado.`);
    });
  }

  return (
    <div className="card p-5">
      <p className="text-sm text-gris-muted mb-4">
        <strong>Cómo obtener el archivo:</strong> abre la hoja de cálculo de &quot;Respuestas&quot;
        vinculada al formulario de Google → <strong>Archivo → Descargar → Valores separados por
        comas (.csv)</strong> → súbelo aquí abajo.
      </p>

      <input type="file" accept=".csv" onChange={handleFile} className="mb-4 text-sm" />

      {error ? <p className="text-sm text-red-600 mb-3">{error}</p> : null}

      {columnas && filas ? (
        <>
          <p className="text-sm text-green-700 mb-3">
            Se detectaron {filas.length} filas y {columnas.length} columnas.
          </p>

          <p className="font-semibold text-gris-texto mb-2">
            Revisa el mapeo de columnas (se sugiere automáticamente; ajusta si algo no calzó):
          </p>
          <div className="grid sm:grid-cols-2 gap-3 mb-4 max-h-96 overflow-y-auto pr-1">
            {FIELD_DEFINITIONS.map(([campo, label]) => (
              <div key={campo}>
                <label className="block text-xs font-semibold text-gris-muted mb-1">{label}</label>
                <select
                  value={mapeo[campo] ?? "(no importar)"}
                  onChange={(e) =>
                    setMapeo((m) => ({ ...m, [campo]: e.target.value === "(no importar)" ? null : e.target.value }))
                  }
                  className="w-full rounded-lg border border-gris-borde px-2 py-1.5 text-sm"
                >
                  <option>(no importar)</option>
                  {columnas.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <label className="flex items-center gap-2 text-sm mb-4">
            <input type="checkbox" checked={evitarDup} onChange={(e) => setEvitarDup(e.target.checked)} />
            Omitir filas que ya fueron importadas antes (mismo RUN o correo)
          </label>

          {resultado ? <p className="text-sm text-green-700 mb-3">{resultado}</p> : null}

          <button onClick={importar} disabled={isPending} className="btn-primary">
            {isPending ? "Importando..." : "Importar postulaciones"}
          </button>
        </>
      ) : null}
    </div>
  );
}
