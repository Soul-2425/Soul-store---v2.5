import postgres from "postgres";

const connStr = process.env.DATABASE_URL || "postgresql://postgres.idsfywgbrugkkbopfqwe:soulblody15store@aws-0-us-east-1.pooler.supabase.com:6543/postgres";
const sql = postgres(connStr, { ssl: "require", prepare: false });

async function run() {
  console.log("Creando tabla public.codigos_referido_rango...");
  await sql`
    CREATE TABLE IF NOT EXISTS public.codigos_referido_rango (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      codigo VARCHAR(100) UNIQUE NOT NULL,
      rango_asignado VARCHAR(50) NOT NULL,
      creado_por_admin_id UUID,
      expira_en TIMESTAMPTZ NOT NULL,
      duracion_horas INT NOT NULL DEFAULT 24,
      usado BOOLEAN DEFAULT FALSE,
      usado_por_usuario_id UUID,
      usado_en TIMESTAMPTZ,
      nota TEXT,
      creado_en TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_codigos_referido_rango_codigo ON public.codigos_referido_rango(codigo);
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_codigos_referido_rango_usado ON public.codigos_referido_rango(usado);
  `;

  console.log("TABLA CREADA CON EXITO");
  await sql.end();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
