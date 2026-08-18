import { auth } from "@/auth";
import { Hero } from "@/components/Hero";
import { sql } from "@/lib/db";

const NAV_CARDS = [
  { icon: "📝", titulo: "Postulaciones", texto: "Revisa y filtra el listado completo importado desde Google Forms." },
  { icon: "🎯", titulo: "Evaluación", texto: "Califica las 3 etapas oficiales: Admisibilidad, Proyecto y Entrevista." },
  { icon: "🏆", titulo: "Resultados", texto: "Ranking consolidado, bonificación por potencial dinámico y metas de paridad." },
  { icon: "📊", titulo: "Estadísticas", texto: "Métricas territoriales de Ñuble, género, sectores y grado de innovación." },
];

export default async function InicioPage() {
  const session = await auth();
  const usuario = session!.user;

  const [{ count }] = await sql<{ count: string }[]>`select count(*)::int as count from postulaciones`;

  return (
    <div>
      <Hero
        titulo="Incubba Ñuble UBB"
        subtitulo="Plataforma de evaluación y registro — Convocatoria 2026"
        pill="Portal Oficial"
      />

      <div
        className="card px-4.5 py-3.5 mb-4"
        style={{ borderLeft: "4px solid var(--color-morado-vibrante)" }}
      >
        <span className="text-lg font-bold text-gris-texto">Bienvenido/a, {usuario.name}</span>
        <span className="inline-block ml-2.5 rounded-full bg-morado-vibrante/10 text-morado-vibrante font-bold text-xs px-2.5 py-0.5 uppercase">
          {usuario.rol}
        </span>
      </div>

      <h3 className="text-lg font-bold mb-3">📊 Resumen Ejecutivo del Proceso</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="metric-card">
          <div className="metric-label">Postulaciones Registradas</div>
          <div className="metric-value">{Number(count) || 0}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Cupos Disponibles (Bases)</div>
          <div className="metric-value">40</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Duración del Programa</div>
          <div className="metric-value">8 meses</div>
        </div>
      </div>

      <div className="card p-6">
        <h4 className="font-bold text-gris-texto mb-3">📌 Navegación Rápida</h4>
        <div className="grid sm:grid-cols-2 gap-3.5">
          {NAV_CARDS.map((c) => (
            <div key={c.titulo} className="rounded-xl border border-gris-borde bg-gris-fondo p-3.5">
              <strong className="text-morado-vibrante">
                {c.icon} {c.titulo}
              </strong>
              <br />
              <small className="text-gris-muted">{c.texto}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
