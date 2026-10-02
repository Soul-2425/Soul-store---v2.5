import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

// Actualizar un método de pago
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const [existing] = await sql`
      SELECT id FROM public.metodos_pago WHERE id = ${id}
    `;

    if (!existing) {
      return NextResponse.json({ error: "Método de pago no encontrado" }, { status: 404 });
    }

    // Toggle activo directo
    if (Object.keys(body).length === 1 && typeof body.activo === "boolean") {
      const [updated] = await sql`
        UPDATE public.metodos_pago
        SET activo = ${body.activo}, actualizado_en = now()
        WHERE id = ${id}
        RETURNING *
      `;
      return NextResponse.json({ metodo: updated });
    }

    const {
      moneda,
      nombre_metodo,
      banco,
      titular,
      identificacion,
      datos_cuenta,
      tipo_cuenta,
      instrucciones,
      qr_imagen_url,
      campos,
      activo,
      orden
    } = body;

    const safeCampos = campos !== undefined ? (Array.isArray(campos) ? campos : []) : null;
    const generatedDatos = safeCampos ? safeCampos.map((c: any) => `${c.etiqueta}: ${c.valor}`).join(" | ") : null;

    const [updated] = await sql`
      UPDATE public.metodos_pago
      SET 
        moneda = COALESCE(${moneda ? moneda.toUpperCase().trim() : null}, moneda),
        nombre_metodo = COALESCE(${nombre_metodo ? nombre_metodo.trim() : null}, nombre_metodo),
        banco = ${banco !== undefined ? (banco ? banco.trim() : null) : sql`banco`},
        titular = ${titular !== undefined ? (titular ? titular.trim() : null) : sql`titular`},
        identificacion = ${identificacion !== undefined ? (identificacion ? identificacion.trim() : null) : sql`identificacion`},
        datos_cuenta = ${generatedDatos !== null ? generatedDatos : (datos_cuenta ? datos_cuenta.trim() : sql`datos_cuenta`)},
        tipo_cuenta = ${tipo_cuenta !== undefined ? (tipo_cuenta ? tipo_cuenta.trim() : null) : sql`tipo_cuenta`},
        instrucciones = ${instrucciones !== undefined ? (instrucciones ? instrucciones.trim() : null) : sql`instrucciones`},
        qr_imagen_url = ${qr_imagen_url !== undefined ? (qr_imagen_url ? qr_imagen_url.trim() : null) : sql`qr_imagen_url`},
        campos = ${safeCampos !== null ? sql.json(safeCampos) : sql`campos`},
        activo = ${activo !== undefined ? Boolean(activo) : sql`activo`},
        orden = ${orden !== undefined ? Number(orden) : sql`orden`},
        actualizado_en = now()
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json({ metodo: updated });
  } catch (error: any) {
    console.error("Error updating payment method:", error);
    return NextResponse.json(
      { error: "Error al actualizar método de pago", details: error.message },
      { status: 500 }
    );
  }
}

// Eliminar un método de pago
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await sql`DELETE FROM public.metodos_pago WHERE id = ${id}`;
    return NextResponse.json({ success: true, message: "Método de pago eliminado" });
  } catch (error: any) {
    console.error("Error deleting payment method:", error);
    return NextResponse.json(
      { error: "Error al eliminar método de pago", details: error.message },
      { status: 500 }
    );
  }
}
