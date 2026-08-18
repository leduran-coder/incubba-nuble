import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/LoginForm";
import { asegurarAdminPorDefecto } from "@/lib/auth-users";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/");

  // Crea el usuario admin inicial si la base de datos ya tiene las tablas
  // pero aún no tiene ningún usuario. Si las tablas todavía no existen
  // (no se ha corrido sql/schema.sql en Supabase), se ignora el error acá
  // y se muestra igual el formulario de acceso.
  try {
    await asegurarAdminPorDefecto();
  } catch {
    // silencioso: probablemente falta correr sql/schema.sql en Supabase todavía
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gris-fondo p-4 gap-6">
      <Image
        src="/logo-incubba.png"
        alt="Incubba Ñuble UBB"
        width={400}
        height={134}
        style={{ width: "auto", height: 90 }}
        priority
      />
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl w-full">
        <div className="card p-7 shadow-lg">
          <h3 className="text-xl font-extrabold text-gris-texto mb-1">🔐 Acceso al Portal</h3>
          <p className="text-sm text-gris-muted mb-5">
            Ingresa con tu correo institucional y contraseña asignada para acceder al panel de
            evaluación.
          </p>
          <LoginForm />
        </div>
        <div
          className="rounded-2xl border border-gris-borde p-7"
          style={{ background: "linear-gradient(135deg, #faf8fd 0%, #f1f5f9 100%)" }}
        >
          <h4 className="text-lg font-bold text-morado-oscuro mb-2">
            🌱 Convocatoria Incubba Ñuble UBB 2026
          </h4>
          <p className="text-sm text-slate-700 leading-relaxed">
            Plataforma oficial para la gestión, admisibilidad y evaluación de proyectos de
            emprendimiento e innovación en la Región de Ñuble.
          </p>
        </div>
      </div>
      <Image
        src="/logo-financiadores.png"
        alt="Ejecuta: VRIP, Dirección de Innovación UBB. Proyecto apoyado por CORFO"
        width={700}
        height={235}
        style={{ width: "auto", height: 90 }}
      />
    </div>
  );
}
