import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

const VAULT_SECRET = process.env.VAULT_SECRET || "soul_store_master_vault_key_2026";

// GET: Desencriptar y revelar credenciales sensibles para el Administrador
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [item] = await sql`
      SELECT 
        v.id,
        v.producto_id,
        p.nombre as producto_nombre,
        v.identificador_publico,
        v.instruccion_entrega,
        v.tipo_entrega,
        v.estado,
        pgp_sym_decrypt(v.datos_sensibles_encriptados, ${VAULT_SECRET}) as credenciales_desencriptadas,
        v.fecha_reserva,
        v.fecha_vencimiento,
        v.creado_en
      FROM public.inventario_boveda v
      JOIN public.productos p ON v.producto_id = p.id
      WHERE v.id = ${id}
    `;

    if (!item) {
      return NextResponse.json({ error: "Ítem de bóveda no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error: any) {
    console.error("Error al desencriptar credenciales de bóveda:", error);
    return NextResponse.json(
      { error: "Error al desencriptar credenciales", details: error.message },
      { status: 500 }
    );
  }
}

// PATCH: Actualizar estado o datos de un ítem de la bóveda
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { estado, identificador_publico, instruccion_entrega, fecha_vencimiento, tipo_entrega } = body;

    const [current] = await sql`
      SELECT id, estado, identificador_publico, instruccion_entrega, fecha_vencimiento, tipo_entrega
      FROM public.inventario_boveda
      WHERE id = ${id}
    `;

    if (!current) {
      return NextResponse.json({ error: "Ítem de bóveda no encontrado" }, { status: 404 });
    }

    const nextEstado = estado || current.estado;
    const nextIdentificador = identificador_publico || current.identificador_publico;
    const nextInstruccion = instruccion_entrega || current.instruccion_entrega;
    const nextVencimiento = fecha_vencimiento !== undefined ? fecha_vencimiento : current.fecha_vencimiento;
    const nextTipoEntrega = tipo_entrega || current.tipo_entrega;

    const [updated] = await sql`
      UPDATE public.inventario_boveda
      SET 
        estado = ${nextEstado},
        identificador_publico = ${nextIdentificador},
        instruccion_entrega = ${nextInstruccion},
        fecha_vencimiento = ${nextVencimiento}::timestamptz,
        tipo_entrega = ${nextTipoEntrega},
        actualizado_en = NOW()
      WHERE id = ${id}
      RETURNING id, identificador_publico, estado, tipo_entrega, actualizado_en
    `;

    return NextResponse.json({
      success: true,
      message: "Ítem de bóveda actualizado con éxito.",
      item: updated,
    });
  } catch (error: any) {
    console.error("Error al actualizar ítem de bóveda:", error);
    return NextResponse.json(
      { error: "Error al actualizar ítem", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar ítem de la bóveda
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [deleted] = await sql`
      DELETE FROM public.inventario_boveda
      WHERE id = ${id}
      RETURNING id, identificador_publico
    `;

    if (!deleted) {
      return NextResponse.json({ error: "Ítem no encontrado para eliminar" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Ítem "${deleted.identificador_publico}" eliminado de la bóveda.`,
    });
  } catch (error: any) {
    console.error("Error al eliminar de bóveda:", error);
    return NextResponse.json(
      { error: "Error al eliminar ítem de bóveda", details: error.message },
      { status: 500 }
    );
  }
}
