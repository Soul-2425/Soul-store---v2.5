import postgres from "postgres";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres.idsfywgbrugkkbopfqwe:soulblody15store@aws-0-us-east-1.pooler.supabase.com:6543/postgres";

// Cliente de base de datos directa para Server Actions y Admin API
export const sql = postgres(connectionString, {
  ssl: "require",
  max: 10,
  idle_timeout: 20,
});
