"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setCargando(false);
    if (res?.error) {
      setError("Correo o contraseña incorrectos.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-semibold text-gris-texto mb-1">Correo electrónico</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ejemplo@incubba.cl"
          className="w-full rounded-lg border border-gris-borde px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-morado-vibrante/30 focus:border-morado-vibrante"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gris-texto mb-1">Contraseña</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full rounded-lg border border-gris-borde px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-morado-vibrante/30 focus:border-morado-vibrante"
        />
      </div>
      {error ? <p className="text-sm text-red-600 font-medium">{error}</p> : null}
      <button type="submit" disabled={cargando} className="btn-primary w-full">
        {cargando ? "Ingresando..." : "Ingresar al Sistema"}
      </button>
    </form>
  );
}
