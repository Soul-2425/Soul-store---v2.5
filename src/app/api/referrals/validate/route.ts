import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

// POST: Validar un código promocional o de referido antes de canjearlo
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { codigo } = body;

    if (!codigo || typeof codigo !== "string" || !codigo.trim()) {
      return NextResponse.json({ valid: false, error: "Ingresa un código" }, { status: 400 });
    }

    const codigoLimpio = codigo.trim().toUpperCase();

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
        valid: false,
        error: "El código no existe o es incorrecto.",
      }, { status: 404 });
    }

    if (record.usado) {
      return NextResponse.json({
        valid: false,
        error: "Este código ya ha sido utilizado. Recuerda que es de un solo uso.",
      }, { status: 400 });
    }

    if (record.expirado) {
      return NextResponse.json({
        valid: false,
        error: "Este código ha caducado.",
      }, { status: 400 });
    }

    // Nombres amigables para el rango
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

    return NextResponse.json({
      valid: true,
      codigo: record.codigo,
      rango_asignado: record.rango_asignado,
      nombre_rango: NOMBRES_RANGOS[record.rango_asignado] || record.rango_asignado,
      expira_en: record.expira_en,
    });
  } catch (error: any) {
    console.error("Error al validar código de referido:", error);
    return NextResponse.json(
      { valid: false, error: "Error al validar código", details: error.message },
      { status: 500 }
    );
  }
}
