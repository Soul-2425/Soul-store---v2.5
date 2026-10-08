import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL no está configurada en las variables de entorno");
}

declare global {
  // eslint-disable-next-line no-var
  var _sqlInstance: ReturnType<typeof postgres> | undefined;
}

// Cliente de base de datos directa para Server Actions y Admin API
export const sql =
  global._sqlInstance ||
  (global._sqlInstance = postgres(connectionString, {
    ssl: "require",
    max: 10,
    idle_timeout: 20,
    prepare: false, // Requerido para Supabase Transaction Pooler (puerto 6543)
  }));

