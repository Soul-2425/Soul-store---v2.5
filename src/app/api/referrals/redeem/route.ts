import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const NOMBRES_RANGOS: Record<string, string> = {
  revendedor_4: "Revendedor Grado 4",
  revendedor_3: "Revendedor Grado 3",
  revendedor_2: "Revendedor Grado 2",
  revendedor_1: "Revendedor Grado 1 (Mayorista)",
  revendedor_especial: "Revendedor Especial VIP",
  cliente_especial: "Cliente Especial VIP",
  cliente_1: "Cliente Nivel 1",
  cliente_2: "Cliente Nivel 2",
  cliente_3: "Cliente Nivel 3",
  cliente_4: "Cliente Nivel 4",
};

// POST: Canjear un código promocional de rango (1 solo uso, no expirado)
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    const body = await request.json();
    const { codigo, user_id } = body;

    const targetUserId = user?.id || user_id;

    if (!targetUserId) {
      return NextResponse.json({ error: "Debes iniciar sesión para canjear este código promocional" }, { status: 401 });
    }

    if (!codigo || typeof codigo !== "string" || !codigo.trim()) {
      return NextResponse.json({ error: "Por favor ingresa un código promocional" }, { status: 400 });
    }

    const codigoLimpio = codigo.trim().toUpperCase();

    // 1. Buscar código y verificar estado
    const [record] = await sql`
      SELECT 
        id,
        codigo,
        rango_asignado,
        expira_en,
        usado,
        NOW() > expira_en AS expirado
      FROM public.codigos_referido_rango
      WHERE UPPER(codigo) = ${codigoLimpio}
      LIMIT 1
    `;

    if (!record) {
      return NextResponse.json({
        error: "El código promocional ingresado no existe o no es válido.",
      }, { status: 404 });
    }

    if (record.usado) {
      return NextResponse.json({
        error: "Este código ya ha sido utilizado. Recuerda que cada código es de 1 solo uso.",
      }, { status: 400 });
    }

    if (record.expirado) {
      return NextResponse.json({
        error: "Este código promocional ha caducado. Solicita uno nuevo a un administrador.",
      }, { status: 400 });
    }

    // 2. Marcar atómicamente el código como usado (previniendo condiciones de carrera)
    const [updatedCode] = await sql`
      UPDATE public.codigos_referido_rango
      SET 
        usado = TRUE,
        usado_por_usuario_id = ${targetUserId},
        usado_en = NOW()
      WHERE id = ${record.id} AND usado = FALSE
      RETURNING id, codigo, rango_asignado
    `;

    if (!updatedCode) {
      return NextResponse.json({
        error: "Este código acaba de ser utilizado por otro usuario.",
      }, { status: 400 });
    }

    // 3. Actualizar el rango del usuario en la tabla public.usuarios
    await sql`
      UPDATE public.usuarios
      SET 
        rango = ${record.rango_asignado},
        actualizado_en = NOW()
      WHERE id = ${targetUserId}
    `;

    // 4. Intentar actualizar metadata de Supabase Auth
    try {
      await supabase.auth.updateUser({
        data: { rango: record.rango_asignado }
      });
    } catch (e) {
      console.warn("No se pudo actualizar auth user_metadata:", e);
    }

    const nombreRango = NOMBRES_RANGOS[record.rango_asignado] || record.rango_asignado;

    return NextResponse.json({
      success: true,
      message: `¡Código canjeado con éxito! Ahora tienes el rango ${nombreRango}.`,
      codigo: record.codigo,
      nuevo_rango: record.rango_asignado,
      nombre_rango: nombreRango,
    });
  } catch (error: any) {
    console.error("Error al canjear código promocional:", error);
    return NextResponse.json(
      { error: "Error al procesar el canje", details: error.message },
      { status: 500 }
    );
  }
}
