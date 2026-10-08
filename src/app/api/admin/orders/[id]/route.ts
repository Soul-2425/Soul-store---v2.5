import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { sendPushNotification } from "@/utils/web-push";

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

    // Si el pedido se marca como COMPLETADO o el ítem como ENTREGADO
    if (safeEstadoPedido === "COMPLETADO" || safeEstadoItem === "ENTREGADO") {
      let orderInfo: any = null;
      if (safeItemId) {
        const [row] = await sql`
          SELECT pi.id as item_id, pi.pedido_id, p.usuario_id, pi.producto_id, u.nickname, prod.nombre as producto_nombre
          FROM public.pedidos_items pi
          JOIN public.pedidos p ON pi.pedido_id = p.id
          LEFT JOIN public.usuarios u ON p.usuario_id = u.id
          JOIN public.productos prod ON pi.producto_id = prod.id
          WHERE pi.id = ${safeItemId}::uuid
          LIMIT 1
        `;
        orderInfo = row;
      }

      if (!orderInfo) {
        const [row] = await sql`
          SELECT pi.id as item_id, pi.pedido_id, p.usuario_id, pi.producto_id, u.nickname, prod.nombre as producto_nombre
          FROM public.pedidos_items pi
          JOIN public.pedidos p ON pi.pedido_id = p.id
          LEFT JOIN public.usuarios u ON p.usuario_id = u.id
          JOIN public.productos prod ON pi.producto_id = prod.id
          WHERE p.id = ${id}::uuid
          ORDER BY pi.creado_en ASC
          LIMIT 1
        `;
        orderInfo = row;
      }

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

        if (orderInfo.usuario_id) {
          // Notificar al cliente con estilo de mensaje de WhatsApp
          sendPushNotification(orderInfo.usuario_id, {
            title: "🟢 Soul Store • ¡Tu pedido está listo! ✅",
            body: `🎉 ¡Hola! Tu recarga de "${orderInfo.producto_nombre}" ha sido entregada exitosamente. Revisa tu cuenta del juego o servicio.`,
            url: "/",
            icon: "/icon.png",
            badge: "/badge.png",
            tag: `order-delivered-${orderInfo.pedido_id}`,
          }).then((sent) => {
            console.log(`[Order Completion] Push enviado al cliente ${orderInfo.usuario_id}: ${sent}`);
          }).catch(console.error);
        }
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
