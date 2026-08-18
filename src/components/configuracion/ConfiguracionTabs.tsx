"use client";

import { useState } from "react";
import { CsvImportTab } from "@/components/configuracion/CsvImportTab";
import { EvaluadoresTab } from "@/components/configuracion/EvaluadoresTab";
import { BonificacionTab } from "@/components/configuracion/BonificacionTab";
import { PesosTab } from "@/components/configuracion/PesosTab";
import { CuentaTab } from "@/components/configuracion/CuentaTab";
import type { Usuario } from "@/lib/types";
import type { FactorBonificacion } from "@/lib/rubric";

const TABS = [
  "📥 Importar postulaciones",
  "👥 Evaluadores",
  "🚀 Bonificación",
  "⚖️ Pesos entre etapas",
  "🔑 Mi cuenta",
];

export function ConfiguracionTabs({
  usuarios,
  usuarioActual,
  bonificacion,
  pesoEtapas,
}: {
  usuarios: Usuario[];
  usuarioActual: { nombre: string; email: string };
  bonificacion: { activa: boolean; puntaje_maximo: number; factores: FactorBonificacion[] };
  pesoEtapas: { etapa_2: number; etapa_3: number };
}) {
  const [tab, setTab] = useState(0);

  return (
    <div>
      <div className="flex gap-2 mb-5 flex-wrap bg-gris-fondo border border-gris-borde rounded-2xl p-1.5">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              tab === i ? "bg-white text-morado-vibrante shadow" : "text-gris-muted"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 0 ? <CsvImportTab /> : null}
      {tab === 1 ? <EvaluadoresTab usuarios={usuarios} /> : null}
      {tab === 2 ? (
        <BonificacionTab
          activaInicial={bonificacion.activa}
          puntajeMaximoInicial={bonificacion.puntaje_maximo}
          factoresIniciales={bonificacion.factores}
        />
      ) : null}
      {tab === 3 ? <PesosTab pesoEtapa2Inicial={pesoEtapas.etapa_2} pesoEtapa3Inicial={pesoEtapas.etapa_3} /> : null}
      {tab === 4 ? <CuentaTab nombre={usuarioActual.nombre} email={usuarioActual.email} /> : null}
    </div>
  );
}
