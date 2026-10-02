import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { estado, prioridad } = body;

    const [current] = await sql`
      SELECT id, estado, prioridad FROM public.tickets_soporte WHERE id = ${id}::uuid
    `;

    if (!current) {
      return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });
    }

    const nextEstado = estado || current.estado;
    const nextPrioridad = prioridad || current.prioridad;

    const [updated] = await sql`
      UPDATE public.tickets_soporte
      SET 
        estado = ${nextEstado},
        prioridad = ${nextPrioridad},
        actualizado_en = NOW()
      WHERE id = ${id}::uuid
      RETURNING id, codigo_ticket, estado, prioridad, actualizado_en
    `;

    return NextResponse.json({
      success: true,
      message: `Ticket actualizado a estado ${nextEstado}`,
      ticket: updated,
    });
  } catch (error: any) {
    console.error("Error al actualizar ticket:", error);
    return NextResponse.json(
      { error: "Error al actualizar ticket", details: error.message },
      { status: 500 }
    );
  }
}
