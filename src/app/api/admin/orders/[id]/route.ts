import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

// Actualizar estado del pedido e items (ej: marcar como ENTREGADO o FALLIDO)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const safeEstadoPedido = body.estado_pedido || null;
    const safeEstadoItem = body.estado_item || null;
    const safeItemId = body.item_id || null;
    const safeRespuesta = body.respuesta_proveedor || null;

    if (safeEstadoPedido) {
      await sql`
        UPDATE public.pedidos
        SET estado = ${safeEstadoPedido}, actualizado_en = NOW()
        WHERE id = ${id}
      `;
    }

    if (safeEstadoItem && safeItemId) {
      await sql`
        UPDATE public.pedidos_items
        SET 
          estado = ${safeEstadoItem}, 
          respuesta_proveedor = COALESCE(${safeRespuesta}, respuesta_proveedor),
          actualizado_en = NOW()
        WHERE id = ${safeItemId}
      `;
    }

    // Si el pedido se marca como COMPLETADO, generar automáticamente registro en el feed de entregas
    if (safeEstadoPedido === "COMPLETADO" || safeEstadoItem === "ENTREGADO") {
      const [orderInfo] = await sql`
        SELECT pi.id as item_id, pi.pedido_id, pi.producto_id, u.nickname, prod.nombre as producto_nombre
        FROM public.pedidos_items pi
        JOIN public.pedidos p ON pi.pedido_id = p.id
        LEFT JOIN public.usuarios u ON p.usuario_id = u.id
        JOIN public.productos prod ON pi.producto_id = prod.id
        WHERE p.id = ${id} OR (${safeItemId}::uuid IS NOT NULL AND pi.id = ${safeItemId}::uuid)
        LIMIT 1
      `;

      if (orderInfo) {
        const rawNick = orderInfo.nickname || "Cliente";
        const anonNick =
          rawNick.length > 2
            ? `${rawNick[0]}...${rawNick.slice(-2)}`
            : `${rawNick[0]}...`;

        await sql`
          INSERT INTO public.feed_entregas (pedido_id, pedido_item_id, nickname_anonimo, descripcion_entrega, aprobado_admin)
          VALUES (${orderInfo.pedido_id}, ${orderInfo.item_id}, ${anonNick}, ${orderInfo.producto_nombre}, TRUE)
        `;
      }
    }

    return NextResponse.json({ success: true, message: "Estado de orden actualizado con éxito." });
  } catch (error: any) {
    console.error("Error updating order status:", error);
    return NextResponse.json(
      { error: "Error al actualizar estado del pedido", details: error.message },
      { status: 500 }
    );
  }
}
