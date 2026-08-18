"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cambiarEstadoEvaluador, crearEvaluador } from "@/lib/actions/config";
import type { Usuario } from "@/lib/types";

export function EvaluadoresTab({ usuarios }: { usuarios: Usuario[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<"evaluador" | "admin">("evaluador");
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  function crear() {
    setMensaje(null);
    startTransition(async () => {
      const res = await crearEvaluador(nombre, email, password, rol);
      if (res.error) {
        setMensaje({ tipo: "error", texto: res.error });
      } else {
        setMensaje({ tipo: "ok", texto: `Usuario ${email} creado.` });
        setNombre("");
        setEmail("");
        setPassword("");
        router.refresh();
      }
    });
  }

  function toggleEstado(id: number, activoActual: boolean) {
    startTransition(async () => {
      await cambiarEstadoEvaluador(id, !activoActual);
      router.refresh();
    });
  }

  return (
    <div className="card p-5">
      <p className="font-semibold text-gris-texto mb-3">Crear nuevo evaluador/a</p>
      <div className="grid sm:grid-cols-2 gap-3 mb-3">
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre completo"
          className="rounded-lg border border-gris-borde px-3 py-2 text-sm"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Correo"
          type="email"
          className="rounded-lg border border-gris-borde px-3 py-2 text-sm"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña temporal"
          type="password"
          className="rounded-lg border border-gris-borde px-3 py-2 text-sm"
        />
        <select
          value={rol}
          onChange={(e) => setRol(e.target.value as "evaluador" | "admin")}
          className="rounded-lg border border-gris-borde px-3 py-2 text-sm"
        >
          <option value="evaluador">evaluador</option>
          <option value="admin">admin</option>
        </select>
      </div>
      {mensaje ? (
        <p className={`text-sm mb-3 ${mensaje.tipo === "ok" ? "text-green-700" : "text-red-600"}`}>{mensaje.texto}</p>
      ) : null}
      <button onClick={crear} disabled={isPending} className="btn-primary mb-6">
        {isPending ? "Creando..." : "Crear usuario"}
      </button>

      <hr className="border-gris-borde mb-5" />

      <p className="font-semibold text-gris-texto mb-3">Usuarios existentes</p>
      <div className="flex flex-col divide-y divide-gris-borde">
        {usuarios.map((u) => (
          <div key={u.id} className="grid grid-cols-[3fr_3fr_2fr_2fr] gap-2 items-center py-2 text-sm">
            <span>{u.nombre}</span>
            <span className="text-gris-muted">{u.email}</span>
            <span>{u.rol}</span>
            <button
              onClick={() => toggleEstado(u.id, u.activo)}
              disabled={isPending}
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                u.activo ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"
              }`}
            >
              {u.activo ? "Activo" : "Inactivo"} — clic para cambiar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
