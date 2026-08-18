import { Hero } from "@/components/Hero";
import { ResultadosTable } from "@/components/ResultadosTable";
import { listarPostulaciones } from "@/lib/postulaciones";
import { tablaRanking } from "@/lib/scoring";
import { CRITERIOS_ADICIONALES } from "@/lib/rubric";

export default async function ResultadosPage() {
  const postulaciones = await listarPostulaciones();

  if (postulaciones.length === 0) {
    return (
      <div>
        <Hero titulo="Resultados y Ranking Final" subtitulo="Puntajes consolidados, bonificación dinámica y cumplimiento de metas" pill="Selección Oficial" />
        <div className="card p-6 text-gris-muted">Aún no hay postulaciones cargadas.</div>
      </div>
    );
  }

  const filas = await tablaRanking(postulaciones);
  const cupoMaximo = CRITERIOS_ADICIONALES.cupo_maximo;

  const evaluadas = filas.filter((f) => f.puntajeFinal !== null).length;
  const admisibles = filas.filter((f) => f.admisibilidad === "Admisible").length;
  const topCupo = filas.slice(0, cupoMaximo);
  const pctMujeresTop =
    topCupo.length > 0
      ? (topCupo.filter((f) => (f.genero ?? "").toLowerCase() === "femenino").length / topCupo.length) * 100
      : 0;
  const comunasTop = new Set(topCupo.map((f) => f.comuna).filter(Boolean)).size;

  return (
    <div>
      <Hero
        titulo="Resultados y Ranking Final"
        subtitulo="Puntajes consolidados, bonificación dinámica y cumplimiento de metas"
        pill="Selección Oficial"
      />

      <p className="text-sm text-gris-muted mb-4">
        El ranking ordena primero las postulaciones <strong>Admisibles</strong>, luego las{" "}
        <strong>Pendientes</strong> de evaluación y al final las <strong>No admisibles</strong>{" "}
        (quedan fuera de la fase siguiente según el punto 4.5.1 de las bases). El puntaje final de
        una &quot;No admisible&quot; se muestra solo como referencia informativa.
      </p>

      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="metric-card">
          <div className="metric-label">Postulaciones evaluadas</div>
          <div className="metric-value">{evaluadas}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Admisibles</div>
          <div className="metric-value">{admisibles}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">% liderado por mujeres (top {cupoMaximo})</div>
          <div className="metric-value">{pctMujeresTop.toFixed(0)}%</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Comunas cubiertas (top {cupoMaximo})</div>
          <div className="metric-value">{comunasTop} / 21</div>
        </div>
      </div>

      {pctMujeresTop < 50 ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-sm p-4 mb-6">
          El top {cupoMaximo} por puntaje puro no alcanza el 50% de proyectos liderados por mujeres
          exigido en las bases (criterio 4.4). Este ajuste se aplica DESPUÉS del ranking por
          rúbrica — revisa manualmente qué proyectos liderados por mujeres, mejor evaluados fuera
          del corte, podrían incorporarse para cumplir la meta.
        </div>
      ) : null}

      <ResultadosTable filas={filas} cupoMaximo={cupoMaximo} />
    </div>
  );
}
