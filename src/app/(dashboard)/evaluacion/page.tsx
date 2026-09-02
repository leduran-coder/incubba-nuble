import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Hero } from "@/components/Hero";
import { EvaluacionPanel } from "@/components/EvaluacionPanel";
import { listarPostulaciones } from "@/lib/postulaciones";
import { nombreCompleto, nombreProyecto } from "@/lib/types";
import { ETAPA_1, ETAPA_2, ETAPA_3, BONIFICACION_DEFAULT } from "@/lib/rubric";
import { respuestasEvaluador, bonoManualEvaluador, bonoManualDeOtrosEvaluadores } from "@/lib/evaluaciones";
import { promedioEtapa, estadoAdmisibilidad, calcularBonificacion } from "@/lib/scoring";
import { getConfigBonificacion, iaSugerenciaActiva } from "@/lib/config-store";

export default async function EvaluacionPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const evaluadorId = Number(session.user.id);

  const postulaciones = await listarPostulaciones();

  if (postulaciones.length === 0) {
    return (
      <div>
        <Hero titulo="Evaluación de postulaciones" subtitulo="Calificación según las rúbricas oficiales de las bases" pill="Pauta de Evaluación" />
        <div className="card p-6 text-gris-muted">
          Aún no hay postulaciones importadas. Ve a Configuración → Importar postulaciones.
        </div>
      </div>
    );
  }


  const { id } = await searchParams;
  const postulacionId = id ? Number(id) : postulaciones[0].id;
  const postulacion = postulaciones.find((p) => p.id === postulacionId) ?? postulaciones[0];

  const etapas = [ETAPA_1, ETAPA_2, ETAPA_3];
  const etapasData = await Promise.all(
    etapas.map(async (etapa) => {
      const { respuestas, comentario } = await respuestasEvaluador(postulacion.id, evaluadorId, etapa.id);
      const promedio = await promedioEtapa(postulacion.id, etapa.id);
      return { etapa, respuestas, comentario, promedio };
    })
  );

  const admisibilidad = await estadoAdmisibilidad(postulacion.id);
  const bonoManual = await bonoManualEvaluador(postulacion.id, evaluadorId);
  const bonoCalculado = await calcularBonificacion(postulacion);
  const otrosValoresManuales = await bonoManualDeOtrosEvaluadores(postulacion.id, evaluadorId);
  const config = await getConfigBonificacion();
  const iaActiva = await iaSugerenciaActiva();

  return (
    <div>
      <Hero
        titulo="Evaluación de Postulaciones"
        subtitulo="Calificación según las rúbricas oficiales de las bases y bonificación dinámica"
        pill="Pauta de Evaluación"
      />
      <EvaluacionPanel
        postulaciones={postulaciones.map((p) => ({
          id: p.id,
          label: `#${p.id} · ${nombreProyecto(p)} — ${nombreCompleto(p)}`,

        }))}
        postulacionId={postulacion.id}
        etapasData={etapasData}
        admisibilidad={admisibilidad}
        bonoManual={bonoManual}
        bonoCalculado={bonoCalculado}
        otrosValoresManuales={otrosValoresManuales}
        factoresBonificacion={config.factores ?? BONIFICACION_DEFAULT.factores}
        resumenAutomatico={{
          tipo_potencial_innovador: postulacion.tipo_potencial_innovador,
          alcance_innovacion: postulacion.alcance_innovacion,
          ha_levantado_financiamiento: postulacion.ha_levantado_financiamiento,
          sector_industria: postulacion.sector_industria,
        }}
        puntajeMaximoBono={config.puntaje_maximo ?? 10}
        iaActiva={iaActiva}
        sinPotencialDinamico={postulacion.sin_potencial_dinamico}
      />
    </div>
  );
}
