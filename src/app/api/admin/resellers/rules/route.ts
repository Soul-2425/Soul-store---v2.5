import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Verificar si el usuario es admin
async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return false;
  const [u] = await sql`SELECT rango FROM public.usuarios WHERE id = ${user.id}`;
  return u && u.rango === "admin";
}

// GET: Obtener todas las reglas de escalafón y depósito
export async function GET() {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const rules = await sql`
      SELECT id, rango, deposito_minimo_usdt, nombre_nivel, beneficio_resumen, activo, actualizado_en
      FROM public.reglas_revendedor_escalafon
      ORDER BY deposito_minimo_usdt ASC
    `;

    return NextResponse.json({ rules });
  } catch (error: any) {
    console.error("Error al obtener reglas de depósito:", error);
    return NextResponse.json(
      { error: "Error al cargar reglas", details: error.message },
      { status: 500 }
    );
  }
}

// POST: Actualizar o crear reglas de depósito mínimo por rango
export async function POST(request: Request) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { rules } = body; // Array de { rango, deposito_minimo_usdt, nombre_nivel, beneficio_resumen, activo }

    if (!Array.isArray(rules) || rules.length === 0) {
      return NextResponse.json({ error: "No se proporcionaron reglas para guardar" }, { status: 400 });
    }

    let actualizadas = 0;

    for (const rule of rules) {
      const {
        rango,
        deposito_minimo_usdt,
        nombre_nivel = "",
        beneficio_resumen = "",
        activo = true,
      } = rule;

      if (!rango || deposito_minimo_usdt === undefined) continue;

      const numMonto = parseFloat(deposito_minimo_usdt);
      if (isNaN(numMonto) || numMonto < 0) continue;

      const safeNombre = String(nombre_nivel || rango).trim().slice(0, 100);
      const safeBeneficio = String(beneficio_resumen || "").trim();

      const [existing] = await sql`
        SELECT id FROM public.reglas_revendedor_escalafon WHERE rango = ${rango} LIMIT 1
      `;

      if (existing) {
        await sql`
          UPDATE public.reglas_revendedor_escalafon
          SET 
            deposito_minimo_usdt = ${numMonto},
            nombre_nivel = ${safeNombre},
            beneficio_resumen = ${safeBeneficio},
            activo = ${Boolean(activo)},
            actualizado_en = NOW()
          WHERE id = ${existing.id}
        `;
      } else {
        await sql`
          INSERT INTO public.reglas_revendedor_escalafon (
            rango,
            deposito_minimo_usdt,
            nombre_nivel,
            beneficio_resumen,
            activo
          ) VALUES (
            ${rango},
            ${numMonto},
            ${safeNombre},
            ${safeBeneficio},
            ${Boolean(activo)}
          )
        `;
      }
      actualizadas++;
    }

    const updatedRules = await sql`
      SELECT id, rango, deposito_minimo_usdt, nombre_nivel, beneficio_resumen, activo, actualizado_en
      FROM public.reglas_revendedor_escalafon
      ORDER BY deposito_minimo_usdt ASC
    `;

    return NextResponse.json({
      success: true,
      message: `¡Se actualizaron exitosamente ${actualizadas} reglas de depósito!`,
      rules: updatedRules,
    });
  } catch (error: any) {
    console.error("Error al guardar reglas de depósito:", error);
    return NextResponse.json(
      { error: "Error al guardar reglas", details: error.message },
      { status: 500 }
    );
  }
}
