import { Hero } from "@/components/Hero";
import { BarraMagnitud } from "@/components/charts/BarraMagnitud";
import { GaugeMeter } from "@/components/charts/GaugeMeter";
import { listarPostulaciones } from "@/lib/postulaciones";
import { tablaRanking } from "@/lib/scoring";
import { contarPorCampo } from "@/lib/stats";

export default async function EstadisticasPage() {
  const postulaciones = await listarPostulaciones();

  if (postulaciones.length === 0) {
    return (
      <div>
        <Hero
          titulo="Estadísticas Territoriales y de Género"
          subtitulo="Análisis demográfico, comunal, formalización y sectores productivos de Ñuble"
          pill="Dashboard Analítico"
        />
        <div className="card p-6 text-gris-muted">Aún no hay postulaciones cargadas.</div>
      </div>
    );
  }

  const ranking = await tablaRanking(postulaciones);

  const total = postulaciones.length;
  const pctMujeres =
    (postulaciones.filter((p) => (p.genero ?? "").toLowerCase() === "femenino").length / total) * 100;
  const comunasCubiertas = new Set(postulaciones.map((p) => p.comuna).filter(Boolean)).size;
  const pctFormalizado =
    (postulaciones.filter((p) => (p.tipo_emprendimiento ?? "").toLowerCase() === "formalizado").length /
      total) *
    100;

  const conteoGenero = contarPorCampo(postulaciones.map((p) => p.genero));
  const conteoProvincia = contarPorCampo(postulaciones.map((p) => p.provincia));
  const conteoComuna = contarPorCampo(postulaciones.map((p) => p.comuna));
  const conteoTipo = contarPorCampo(postulaciones.map((p) => p.tipo_emprendimiento));
  const conteoInnov = contarPorCampo(postulaciones.map((p) => p.tipo_potencial_innovador));
  const conteoAlcance = contarPorCampo(postulaciones.map((p) => p.alcance_innovacion));
  const conteoFin = contarPorCampo(postulaciones.map((p) => p.ha_levantado_financiamiento));
  const conteoSectores = contarPorCampo(
    postulaciones.map((p) => (p.sector_industria ?? "").trim() || null)
  ).slice(0, 12);
  const conteoAdmisibilidad = contarPorCampo(ranking.map((r) => r.admisibilidad));

  return (
    <div>
      <Hero
        titulo="Estadísticas Territoriales y de Género"
        subtitulo="Análisis demográfico, comunal, formalización y sectores productivos de Ñuble"
        pill="Dashboard Analítico"
      />

      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="metric-card">
          <div className="metric-label">Total postulaciones</div>
          <div className="metric-value">{total}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">% liderado por mujeres</div>
          <div className="metric-value">{pctMujeres.toFixed(0)}%</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Comunas representadas</div>
          <div className="metric-value">{comunasCubiertas} / 21</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">% formalizados</div>
          <div className="metric-value">{pctFormalizado.toFixed(0)}%</div>
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_2fr] gap-4 mb-8">
        <GaugeMeter valor={pctMujeres} meta={50} titulo="Paridad de género (meta 50%)" />
        <BarraMagnitud datos={conteoGenero} titulo="Postulaciones por género" />
      </div>

      <h3 className="text-lg font-bold mb-3">Cobertura territorial</h3>
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <BarraMagnitud datos={conteoProvincia} titulo="Postulaciones por provincia" />
        <BarraMagnitud datos={conteoComuna} titulo="Postulaciones por comuna (todas)" altura={520} />
      </div>

      <h3 className="text-lg font-bold mb-3">Estado de formalización e innovación</h3>
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <BarraMagnitud datos={conteoTipo} titulo="Idea vs. Formalizado" />
        <BarraMagnitud datos={conteoInnov} titulo="Potencial innovador (marginal/incremental/disruptiva)" />
      </div>
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <BarraMagnitud datos={conteoAlcance} titulo="Alcance proyectado (regional/nacional/internacional)" />
        <BarraMagnitud datos={conteoFin} titulo="¿Ha levantado financiamiento previo?" />
      </div>

      <h3 className="text-lg font-bold mb-3">Sectores / industrias más frecuentes</h3>
      <div className="mb-8">
        <BarraMagnitud datos={conteoSectores} titulo="Top 12 sectores declarados" altura={420} />
      </div>

      {conteoAdmisibilidad.length > 0 ? (
        <>
          <h3 className="text-lg font-bold mb-3">Estado de admisibilidad (Etapa 1)</h3>
          <div className="mb-8">
            <BarraMagnitud
              datos={conteoAdmisibilidad}
              titulo="Admisible / No admisible / Pendiente"
              horizontal={false}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
