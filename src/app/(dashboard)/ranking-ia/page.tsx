import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Hero } from "@/components/Hero";
import { RankingIATabla } from "@/components/RankingIATabla";
import { obtenerRankingIA, estadoRankingIA } from "@/lib/ai-ranking";
import { iaSugerenciaActiva } from "@/lib/config-store";

export default async function RankingIAPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.rol !== "admin") redirect("/");

  const iaActiva = await iaSugerenciaActiva();

  return (
    <div>
      <Hero
        titulo="Ranking IA (informativo)"
        subtitulo="Una referencia auxiliar generada por IA para todas las postulaciones a la vez"
        pill="Solo Administradores"
      />

      <div className="rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-sm p-4 mb-6">
        <strong>Esto es solo una referencia informativa generada por IA.</strong> No reemplaza ni
        afecta en nada el ranking oficial de la página Resultados, que sigue basándose
        exclusivamente en las evaluaciones y bonificaciones que registra el panel evaluador humano.
        Nada de lo que se calcula aquí se guarda en las tablas de evaluaciones ni se usa para
        ningún cálculo oficial. Además, como la IA no puede evaluar la Etapa 3 (Entrevista
        personal, depende de una conversación real), el puntaje final de aquí abajo combina solo
        Admisibilidad + Etapa 2 + Bonificación.
      </div>

      {!iaActiva ? (
        <div className="card p-6 text-gris-muted">
          La función de sugerencias con IA está desactivada. Actívala en Configuración → 🤖
          Sugerencias con IA para poder generar el Ranking IA.
        </div>
      ) : (
        <RankingIAContenido />
      )}
    </div>
  );
}

async function RankingIAContenido() {
  const [filas, estado] = await Promise.all([obtenerRankingIA(), estadoRankingIA()]);

  return (
    <RankingIATabla filas={filas} pendientesIniciales={estado.pendientes} totalPostulaciones={estado.total} />
  );
}
