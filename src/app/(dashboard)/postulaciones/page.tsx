import { Hero } from "@/components/Hero";
import { PostulacionesExplorer } from "@/components/PostulacionesExplorer";
import { listarPostulaciones } from "@/lib/postulaciones";

export default async function PostulacionesPage() {
  const postulaciones = await listarPostulaciones();

  return (
    <div>
      <Hero
        titulo="Postulaciones"
        subtitulo="Listado y fichas completas de proyectos postulantes 2026"
        pill="Registro Oficial"
      />

      {postulaciones.length === 0 ? (
        <div className="card p-6 text-gris-muted">
          Todavía no hay postulaciones cargadas. Si eres administrador/a, ve a{" "}
          <strong>Configuración → Importar postulaciones</strong> y sube el CSV exportado desde
          la hoja de respuestas del Google Form.
        </div>
      ) : (
        <PostulacionesExplorer postulaciones={postulaciones} />
      )}
    </div>
  );
}
