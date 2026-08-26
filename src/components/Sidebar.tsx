"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/SignOutButton";

const NAV_ITEMS = [
  { href: "/", label: "Inicio", icon: "🏠" },
  { href: "/postulaciones", label: "Postulaciones", icon: "📝" },
  { href: "/evaluacion", label: "Evaluación", icon: "🎯" },
  { href: "/resultados", label: "Resultados", icon: "🏆" },
  { href: "/estadisticas", label: "Estadísticas", icon: "📊" },
];

export function Sidebar({
  usuario,
}: {
  usuario: { nombre: string; rol: "admin" | "evaluador" } | null;
}) {
  const pathname = usePathname();

  const items = [...NAV_ITEMS];
  if (usuario?.rol === "admin") {
    items.push({ href: "/seguimiento", label: "Seguimiento", icon: "📈" });
    items.push({ href: "/configuracion", label: "Configuración", icon: "⚙️" });
  }

  return (
    <aside className="app-sidebar w-64 shrink-0 flex flex-col p-4 min-h-screen">
      <div className="bg-white rounded-2xl p-3 mb-4 text-center shadow-lg">
        <Image src="/logo.png" alt="Incubba" width={160} height={54} style={{ maxWidth: "100%", maxHeight: 48, objectFit: "contain", margin: "0 auto" }} />
      </div>

      {usuario ? (
        <div className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 mb-4">
          <div className="text-[0.7rem] uppercase tracking-wide font-bold text-slate-400">
            Usuario activo
          </div>
          <div className="text-white font-bold text-sm mt-0.5">{usuario.nombre}</div>
          <span className="inline-block mt-1 rounded-full bg-menta/15 text-menta-claro text-[0.7rem] font-bold px-2 py-0.5">
            {usuario.rol === "admin" ? "Administrador/a" : "Evaluador/a"}
          </span>
        </div>
      ) : null}

      <nav className="flex flex-col gap-1 flex-1">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link block px-3.5 py-2.5 ${active ? "active" : ""}`}
            >
              {item.icon} {item.label}
            </Link>
          );
        })}
      </nav>

      {usuario ? <SignOutButton /> : null}
    </aside>
  );
}
