import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Hero } from "@/components/Hero";
import { ConfiguracionTabs } from "@/components/configuracion/ConfiguracionTabs";
import { listarUsuarios } from "@/lib/auth-users";
import { getConfig, getConfigBonificacion } from "@/lib/config-store";

export default async function ConfiguracionPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.rol !== "admin") redirect("/");

  const usuarios = await listarUsuarios();
  const bonificacion = await getConfigBonificacion();
  const pesoEtapas = await getConfig<Record<string, number>>("peso_etapas");

  return (
    <div>
      <Hero
        titulo="Panel de Configuración y Administración"
        subtitulo="Importación masiva, gestión del comité evaluador y calibración de ponderaciones"
        pill="Solo Administradores"
      />
      <ConfiguracionTabs
        usuarios={usuarios.sort((a, b) => a.rol.localeCompare(b.rol) || a.nombre.localeCompare(b.nombre))}
        usuarioActual={{ nombre: session.user.name ?? "", email: session.user.email ?? "" }}
        bonificacion={{
          activa: bonificacion.activa ?? true,
          puntaje_maximo: bonificacion.puntaje_maximo ?? 10,
          factores: bonificacion.factores ?? [],
        }}
        pesoEtapas={{ etapa_2: pesoEtapas.etapa_2 ?? 0.65, etapa_3: pesoEtapas.etapa_3 ?? 0.35 }}
      />
    </div>
  );
}
