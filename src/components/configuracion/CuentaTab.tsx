"use client";

import { useState, useTransition } from "react";
import { cambiarMiPassword } from "@/lib/actions/config";

export function CuentaTab({ nombre, email }: { nombre: string; email: string }) {
  const [isPending, startTransition] = useTransition();
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  function cambiar() {
    setMensaje(null);
    if (!nueva || nueva !== confirmar) {
      setMensaje({ tipo: "error", texto: "Las contraseñas no coinciden o están vacías." });
      return;
    }
    startTransition(async () => {
      const res = await cambiarMiPassword(nueva);
      if (res.error) {
        setMensaje({ tipo: "error", texto: res.error });
      } else {
        setMensaje({ tipo: "ok", texto: "Contraseña actualizada." });
        setNueva("");
        setConfirmar("");
      }
    });
  }

  return (
    <div className="card p-5 max-w-md">
      <p className="text-sm text-gris-muted mb-4">
        Sesión actual: <strong>{nombre}</strong> ({email})
      </p>
      <div className="flex flex-col gap-3 mb-4">
        <input
          type="password"
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          placeholder="Nueva contraseña"
          className="rounded-lg border border-gris-borde px-3 py-2 text-sm"
        />
        <input
          type="password"
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          placeholder="Confirmar nueva contraseña"
          className="rounded-lg border border-gris-borde px-3 py-2 text-sm"
        />
      </div>
      {mensaje ? (
        <p className={`text-sm mb-3 ${mensaje.tipo === "ok" ? "text-green-700" : "text-red-600"}`}>{mensaje.texto}</p>
      ) : null}
      <button onClick={cambiar} disabled={isPending} className="btn-primary">
        {isPending ? "Cambiando..." : "Cambiar contraseña"}
      </button>
    </div>
  );
}
