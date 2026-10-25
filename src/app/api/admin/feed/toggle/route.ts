import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { feed_id, order_item_id, aprobado_admin } = body;

    let targetFeedId = feed_id;

    if (!targetFeedId && order_item_id) {
      const [f] = await sql`
        SELECT id FROM public.feed_entregas 
        WHERE pedido_item_id = ${order_item_id}::uuid
        LIMIT 1
      `;
      if (f) targetFeedId = f.id;
    }

    if (!targetFeedId) {
      return NextResponse.json({ error: "No se encontró registro de feed para este pedido" }, { status: 404 });
    }

    let nuevoEstado: boolean;
    if (typeof aprobado_admin === "boolean") {
      nuevoEstado = aprobado_admin;
      await sql`
        UPDATE public.feed_entregas
        SET aprobado_admin = ${nuevoEstado}
        WHERE id = ${targetFeedId}::uuid
      `;
    } else {
      const [updated] = await sql`
        UPDATE public.feed_entregas
        SET aprobado_admin = NOT aprobado_admin
        WHERE id = ${targetFeedId}::uuid
        RETURNING aprobado_admin
      `;
      nuevoEstado = Boolean(updated?.aprobado_admin);
    }

    return NextResponse.json({
      success: true,
      feed_id: targetFeedId,
      aprobado_admin: nuevoEstado,
      message: nuevoEstado ? "Entrega publicada en el Feed público" : "Entrega ocultada del Feed público",
    });
  } catch (error: any) {
    console.error("Error toggling feed approval:", error);
    return NextResponse.json(
      { error: "Error al actualizar estado del feed", details: error.message },
      { status: 500 }
    );
  }
}
