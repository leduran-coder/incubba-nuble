import postgres from "postgres";

// Cliente único de PostgreSQL, reutilizado entre requests (evita abrir una
// conexión nueva por cada función serverless invocada). Usa el Connection
// Pooler de Supabase (Supavisor) en modo transacción, que es compatible con
// entornos serverless como Vercel (a diferencia de la conexión directa, que
// requiere IPv6 y no funciona ahí).
declare global {
  // eslint-disable-next-line no-var
  var __incubbaSql: ReturnType<typeof postgres> | undefined;
}

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Falta la variable de entorno DATABASE_URL. Debe ser la cadena de conexión " +
        "del Connection Pooler de Supabase (Project Settings → Database → Connection Pooling)."
    );
  }
  const esLocal = /localhost|127\.0\.0\.1/.test(url);

  return postgres(url, {
    ssl: esLocal ? false : "require",
    prepare: false, // el pooler de Supabase en modo transacción no soporta prepared statements
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });
}

export const sql = globalThis.__incubbaSql ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__incubbaSql = sql;
}
