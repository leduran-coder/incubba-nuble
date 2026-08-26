import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Hero } from "@/components/Hero";
import { avancePorEvaluador, avancePorProyecto } from "@/lib/seguimiento";
import { SeguimientoReportes } from "@/components/SeguimientoReportes";

function formatearFecha(iso: string | null): string {
  if (!iso) return "Sin actividad todavía";
  try {
    return new Date(iso).toLocaleString("es-CL", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

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
      {avanceEvaluadores.length === 0 ? (
        <div className="card p-6 text-gris-muted mb-8">
          Aún no hay evaluadores/as registrados (agrégalos en Configuración → 👥 Evaluadores).
        </div>
      ) : (
        <div className="card overflow-x-auto mb-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gris-fondo text-left text-gris-muted uppercase text-xs">
                {[
                  "Evaluador/a",
                  "Estado",
                  "Etapa 1",
                  "Etapa 2",
                  "Etapa 3",
                  "Bonificación",
                  "Proyectos evaluados por completo",
                  "Última actividad",
                ].map((h) => (
                  <th key={h} className="px-3 py-2.5 font-bold whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {avanceEvaluadores.map((e) => (
                <tr key={e.id} className="border-t border-gris-borde">
                  <td className="px-3 py-2 font-medium">
                    {e.nombre}
                    <div className="text-xs text-gris-muted">{e.email}</div>
                  </td>
                  <td className="px-3 py-2">
                    {e.activo ? (
                      <span className="text-xs font-bold text-menta">Activo/a</span>
                    ) : (
                      <span className="text-xs font-bold text-gris-muted">Desactivado/a</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {e.etapa1Completas} / {e.totalPostulaciones}
                  </td>
                  <td className="px-3 py-2">
                    {e.etapa2Completas} / {e.totalPostulaciones}
                  </td>
                  <td className="px-3 py-2">
                    {e.etapa3Completas} / {e.totalPostulaciones}
                  </td>
                  <td className="px-3 py-2">
                    {e.bonoCompletas} / {e.totalPostulaciones}
                  </td>
                  <td className="px-3 py-2 font-bold text-morado-vibrante">
                    {e.totalmenteEvaluadas} / {e.totalPostulaciones}
                  </td>
                  <td className="px-3 py-2 text-xs">{formatearFecha(e.ultimaActividad)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-gris-muted mb-8">
        Una etapa cuenta como completa cuando el evaluador/a respondió{" "}
        <strong>todos los criterios de esa etapa</strong> para ese proyecto — es la misma regla que ya
        usa la plataforma para promediar los puntajes en Resultados. &quot;Proyectos evaluados por
        completo&quot; exige Etapa 1 + Etapa 2 + Etapa 3 + Bonificación, las 4 a la vez.
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
