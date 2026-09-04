import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Hero } from "@/components/Hero";
import { avancePorEvaluador, avancePorProyecto } from "@/lib/seguimiento";
import { SeguimientoReportes } from "@/components/SeguimientoReportes";
import { AvanceEvaluadoresTabla } from "@/components/AvanceEvaluadoresTabla";

export default async function SeguimientoPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.rol !== "admin") redirect("/");

  const [avanceEvaluadores, avanceProyectos] = await Promise.all([
    avancePorEvaluador(),
    avancePorProyecto(),
  ]);

  const totalPostulaciones = avanceEvaluadores[0]?.totalPostulaciones ?? avanceProyectos.length;

  return (
    <div>
      <Hero
        titulo="Seguimiento y Control del Equipo Evaluador"
        subtitulo="Avance de cada evaluador/a y reportes consolidados descargables por proyecto"
        pill="Solo Administradores"
      />

      <h3 className="text-lg font-bold mb-3">Avance por evaluador/a</h3>
      <AvanceEvaluadoresTabla evaluadores={avanceEvaluadores} />
      <p className="text-xs text-gris-muted mb-8">
        Una etapa cuenta como completa cuando el evaluador/a respondió{" "}
        <strong>todos los criterios de esa etapa</strong> para ese proyecto — es la misma regla que ya
        usa la plataforma para promediar los puntajes en Resultados. &quot;Proyectos evaluados por
        completo&quot; exige Etapa 1 + Etapa 2 + Etapa 3 + Bonificación, las 4 a la vez. Haz clic en
        &quot;Ver detalle&quot; en la fila de cada evaluador/a para ver, separado por Etapa 1, Etapa 2,
        Etapa 3 y Bonificación, cuáles proyectos le faltan todavía en cada una. El botón &quot;Incluido en
        resultados&quot; es distinto de &quot;Activo/a&quot; (que solo controla el acceso al sistema): si
        excluyes a un evaluador/a, sus evaluaciones y bonificaciones ya guardadas dejan de sumarse en
        Resultados, Estadísticas y en el reporte Word al instante — sin borrar ni tocar ninguna respuesta,
        y puedes volver a incluirlo cuando quieras. Útil para ver cómo varía el ranking al cerrar el
        proceso si algún evaluador/a no alcanzó a terminar.
      </p>

      <h3 className="text-lg font-bold mb-3">Reportes consolidados por proyecto</h3>
      <p className="text-sm text-gris-muted mb-4">
        Descarga un documento Word con todas las evaluaciones registradas de un proyecto (criterio por
        criterio, evaluador por evaluador) y el puntaje final ya calculado. Se genera al momento con los
        datos actuales — no hace falta bajar postulaciones ni tocar las evaluaciones ya hechas.
      </p>
      <SeguimientoReportes filas={avanceProyectos} totalEvaluadores={avanceEvaluadores.length} />
      <p className="text-xs text-gris-muted mt-2">
        Total de postulaciones cargadas en el sistema: {totalPostulaciones}.
      </p>
    </div>
  );
}
