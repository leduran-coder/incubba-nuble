"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Papa from "papaparse";
import { FIELD_DEFINITIONS, sugerirMapeo } from "@/lib/importer";
import { importarPostulaciones, eliminarTodasLasPostulaciones } from "@/lib/actions/config";

export function CsvImportTab() {
  const [isPending, startTransition] = useTransition();
  const [columnas, setColumnas] = useState<string[] | null>(null);
  const [filas, setFilas] = useState<Record<string, string | null>[] | null>(null);
  const [mapeo, setMapeo] = useState<Record<string, string[]>>({});
  const [camposExpandidos, setCamposExpandidos] = useState<Set<string>>(new Set());
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
        const sugerido = sugerirMapeo(cols);
        setColumnas(cols);
        setFilas(res.data);
        setMapeo(sugerido);
        // Si para algún campo se detectó más de una columna posible (p. ej.
        // una pregunta ramificada como "comuna"), se abre de una vez la
        // sección de columnas alternativas para que quede a la vista.
        setCamposExpandidos(
          new Set(Object.entries(sugerido).filter(([, cs]) => cs.length > 1).map(([campo]) => campo))
        );
      },
      error: (err) => setError(`No se pudo leer el archivo: ${err.message}`),
    });
  }

  function cambiarColumnaPrincipal(campo: string, columna: string | null) {
    setMapeo((m) => {
      const adicionales = (m[campo] ?? []).slice(1);
      return { ...m, [campo]: columna ? [columna, ...adicionales] : adicionales };
    });
  }

  function alternarColumnaAlternativa(campo: string, columna: string, marcada: boolean) {
    setMapeo((m) => {
      const actuales = m[campo] ?? [];
      const principal = actuales[0] ?? null;
      let adicionales = actuales.slice(1);
      adicionales = marcada ? [...adicionales.filter((c) => c !== columna), columna] : adicionales.filter((c) => c !== columna);
      return { ...m, [campo]: principal ? [principal, ...adicionales] : adicionales };
    });
  }

  function alternarExpandido(campo: string) {
    setCamposExpandidos((set) => {
      const nuevo = new Set(set);
      if (nuevo.has(campo)) nuevo.delete(campo);
      else nuevo.add(campo);
      return nuevo;
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
            {FIELD_DEFINITIONS.map(([campo, label]) => {
              const columnaPrincipal = mapeo[campo]?.[0] ?? null;
              const columnasAlternativas = mapeo[campo]?.slice(1) ?? [];
              const expandido = camposExpandidos.has(campo);
              return (
                <div key={campo}>
                  <label className="block text-xs font-semibold text-gris-muted mb-1">{label}</label>
                  <select
                    value={columnaPrincipal ?? "(no importar)"}
                    onChange={(e) =>
                      cambiarColumnaPrincipal(campo, e.target.value === "(no importar)" ? null : e.target.value)
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

                  <button
                    type="button"
                    onClick={() => alternarExpandido(campo)}
                    className="text-xs text-morado-vibrante mt-1 hover:underline"
                  >
                    {expandido
                      ? "Ocultar columnas alternativas"
                      : columnasAlternativas.length > 0
                        ? `+ ${columnasAlternativas.length} columna(s) alternativa(s) — ver`
                        : "¿Esta respuesta puede venir de más de una columna? Agregar alternativa"}
                  </button>

                  {expandido ? (
                    <div className="mt-2 rounded-lg border border-gris-borde bg-gris-fondo p-2 max-h-40 overflow-y-auto">
                      <p className="text-xs text-gris-muted mb-1.5">
                        Marca otras columnas donde esta misma pregunta pueda aparecer (por ejemplo, por
                        una sección condicional del formulario). Se usará la primera columna que tenga
                        dato en cada fila.
                      </p>
                      {columnas
                        .filter((c) => c !== columnaPrincipal)
                        .map((c) => (
                          <label key={c} className="flex items-center gap-2 text-xs py-0.5">
                            <input
                              type="checkbox"
                              checked={columnasAlternativas.includes(c)}
                              onChange={(e) => alternarColumnaAlternativa(campo, c, e.target.checked)}
                            />
                            {c}
                          </label>
                        ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
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

      <ZonaPeligro />
    </div>
  );
}

function ZonaPeligro() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [abierto, setAbierto] = useState(false);
  const [confirmacion, setConfirmacion] = useState("");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function eliminarTodo() {
    setMensaje(null);
    setError(null);
    startTransition(async () => {
      try {
        const res = await eliminarTodasLasPostulaciones(confirmacion);
        setMensaje(`Se eliminaron ${res.eliminadas} postulaciones (junto con sus evaluaciones y bonificaciones).`);
        setConfirmacion("");
        setAbierto(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo eliminar.");
      }
    });
  }

  return (
    <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4">
      <p className="font-semibold text-red-700 text-sm mb-1">⚠️ Zona de peligro</p>
      <p className="text-sm text-red-700 mb-3">
        Borra TODAS las postulaciones importadas, junto con las evaluaciones y bonificaciones ya
        registradas para ellas. Úsalo solo para limpiar datos de prueba antes de una convocatoria
        real — esta acción no se puede deshacer.
      </p>

      {!abierto ? (
        <button
          onClick={() => setAbierto(true)}
          className="rounded-lg border border-red-400 text-red-700 text-sm font-semibold px-4 py-2 hover:bg-red-100"
        >
          Eliminar todas las postulaciones
        </button>
      ) : (
        <div>
          <p className="text-sm text-red-700 mb-2">
            Para confirmar, escribe <strong>ELIMINAR</strong> en el siguiente campo:
          </p>
          <input
            type="text"
            value={confirmacion}
            onChange={(e) => setConfirmacion(e.target.value)}
            className="rounded-lg border border-red-300 px-3 py-2 text-sm mb-3 w-48"
            placeholder="ELIMINAR"
          />
          <div className="flex gap-2">
            <button
              onClick={eliminarTodo}
              disabled={isPending || confirmacion !== "ELIMINAR"}
              className="rounded-lg bg-red-600 text-white text-sm font-semibold px-4 py-2 disabled:opacity-40"
            >
              {isPending ? "Eliminando..." : "Confirmar eliminación definitiva"}
            </button>
            <button
              onClick={() => {
                setAbierto(false);
                setConfirmacion("");
                setError(null);
              }}
              className="rounded-lg border border-gris-borde text-sm px-4 py-2"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {mensaje ? <p className="text-sm text-green-700 mt-3">{mensaje}</p> : null}
      {error ? <p className="text-sm text-red-700 mt-3">{error}</p> : null}
    </div>
  );
}
