import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Verificar si el usuario es admin
async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { isAdmin: false, adminId: null };
  const [u] = await sql`SELECT rango FROM public.usuarios WHERE id = ${user.id}`;
  return { isAdmin: u && u.rango === "admin", adminId: user.id };
}

// GET: Obtener todos los códigos de referido de rango
export async function GET() {
  try {
    const { isAdmin } = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const codigos = await sql`
      SELECT 
        c.id,
        c.codigo,
        c.rango_asignado,
        c.creado_por_admin_id,
        c.expira_en,
        c.duracion_horas,
        c.usado,
        c.usado_por_usuario_id,
        c.usado_en,
        c.nota,
        c.creado_en,
        u.nickname AS usado_por_nickname,
        u.email AS usado_por_email,
        u.nombre AS usado_por_nombre,
        CASE
          WHEN c.usado = TRUE THEN 'USADO'
          WHEN NOW() > c.expira_en THEN 'EXPIRADO'
          ELSE 'ACTIVO'
        END AS estado_calculado
      FROM public.codigos_referido_rango c
      LEFT JOIN public.usuarios u ON c.usado_por_usuario_id = u.id
      ORDER BY c.creado_en DESC
    `;

    return NextResponse.json({ codigos });
  } catch (error: any) {
    console.error("Error al obtener códigos de referido:", error);
    return NextResponse.json(
      { error: "Error al cargar códigos de referido", details: error.message },
      { status: 500 }
    );
  }
}

// POST: Crear nuevo código de referido para asignación de rango
export async function POST(request: Request) {
  try {
    const { isAdmin, adminId } = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const {
      codigo, // Código completo o sufijo
      rango_asignado,
      duracion_horas = 24,
      nota = "",
    } = body;

    if (!codigo || typeof codigo !== "string" || !codigo.trim()) {
      return NextResponse.json({ error: "El código no puede estar vacío" }, { status: 400 });
    }

    if (!rango_asignado || typeof rango_asignado !== "string") {
      return NextResponse.json({ error: "Debes seleccionar un rango válido para el código" }, { status: 400 });
    }

    // Normalizar código: aseguramos mayúsculas, sin espacios
    let codigoLimpio = codigo.trim().toUpperCase().replace(/\s+/g, "-");
    if (!codigoLimpio.startsWith("SOUL-")) {
      codigoLimpio = `SOUL-${codigoLimpio}`;
    }

    // Validar formato
    if (codigoLimpio.length < 6 || codigoLimpio.length > 50) {
      return NextResponse.json({ error: "El código debe tener entre 6 y 50 caracteres" }, { status: 400 });
    }

    const numHoras = parseInt(String(duracion_horas), 10);
    if (isNaN(numHoras) || numHoras <= 0 || numHoras > 8760) {
      return NextResponse.json({ error: "La duración en horas debe ser un número entre 1 y 8760 (1 año)" }, { status: 400 });
    }

    // Verificar si ya existe un código igual
    const [existente] = await sql`
      SELECT id FROM public.codigos_referido_rango WHERE UPPER(codigo) = ${codigoLimpio} LIMIT 1
    `;
    if (existente) {
      return NextResponse.json({ error: `El código "${codigoLimpio}" ya existe. Elige otro sufijo o código.` }, { status: 409 });
    }

    // Insertar código con fecha de expiración calculada
    const [nuevo] = await sql`
      INSERT INTO public.codigos_referido_rango (
        codigo,
        rango_asignado,
        creado_por_admin_id,
        expira_en,
        duracion_horas,
        usado,
        nota
      ) VALUES (
        ${codigoLimpio},
        ${rango_asignado},
        ${adminId},
        NOW() + (${numHoras} || ' hours')::interval,
        ${numHoras},
        FALSE,
        ${nota ? String(nota).trim() : null}
      )
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      message: `Código ${codigoLimpio} creado con éxito para el rango ${rango_asignado}`,
      codigo: nuevo,
    });
  } catch (error: any) {
    console.error("Error al crear código de referido:", error);
    return NextResponse.json(
      { error: "Error al crear código de referido", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar o revocar código de referido
export async function DELETE(request: Request) {
  try {
    const { isAdmin } = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID de código no proporcionado" }, { status: 400 });
    }

    await sql`
      DELETE FROM public.codigos_referido_rango WHERE id = ${id}
    `;

    return NextResponse.json({ success: true, message: "Código eliminado correctamente" });
  } catch (error: any) {
    console.error("Error al eliminar código de referido:", error);
    return NextResponse.json(
      { error: "Error al eliminar código", details: error.message },
      { status: 500 }
    );
  }
}
