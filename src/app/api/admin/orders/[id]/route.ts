import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { sendPushNotification } from "@/utils/web-push";
import { interpolateTemplate, DEFAULT_NOTIFICATION_TEMPLATES } from "@/utils/notifications-template";

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
          SELECT 
            pi.id as item_id, 
            pi.pedido_id, 
            p.usuario_id, 
            pi.producto_id, 
            u.nickname, 
            u.nombre as usuario_nombre,
            prod.nombre as producto_nombre,
            v.nombre as variante_nombre
          FROM public.pedidos_items pi
          JOIN public.pedidos p ON pi.pedido_id = p.id
          LEFT JOIN public.usuarios u ON p.usuario_id = u.id
          JOIN public.productos prod ON pi.producto_id = prod.id
          LEFT JOIN public.variantes_producto v ON pi.variante_id = v.id
          WHERE pi.id = ${safeItemId}::uuid
          LIMIT 1
        `;
        orderInfo = row;
      }

      if (!orderInfo) {
        const [row] = await sql`
          SELECT 
            pi.id as item_id, 
            pi.pedido_id, 
            p.usuario_id, 
            pi.producto_id, 
            u.nickname, 
            u.nombre as usuario_nombre,
            prod.nombre as producto_nombre,
            v.nombre as variante_nombre
          FROM public.pedidos_items pi
          JOIN public.pedidos p ON pi.pedido_id = p.id
          LEFT JOIN public.usuarios u ON p.usuario_id = u.id
          JOIN public.productos prod ON pi.producto_id = prod.id
          LEFT JOIN public.variantes_producto v ON pi.variante_id = v.id
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
          // Notificar al cliente con plantilla personalizable (await obligatorio en Serverless)
          try {
            const [cfg] = await sql`
              SELECT cliente_titulo_template, cliente_cuerpo_template
              FROM public.notificaciones_config
              WHERE id = 1
            `;
            const tituloTemplate = cfg?.cliente_titulo_template || DEFAULT_NOTIFICATION_TEMPLATES.cliente_titulo_template;
            const cuerpoTemplate = cfg?.cliente_cuerpo_template || DEFAULT_NOTIFICATION_TEMPLATES.cliente_cuerpo_template;

            const vars = {
              producto: orderInfo.producto_nombre,
              variante: orderInfo.variante_nombre || "",
              cliente: orderInfo.usuario_nombre || orderInfo.nickname || "Cliente",
              pedido_id: `SOUL-${orderInfo.pedido_id.slice(0, 8).toUpperCase()}`,
            };

            const finalTitle = interpolateTemplate(tituloTemplate, vars);
            const finalBody = interpolateTemplate(cuerpoTemplate, vars);

            const sent = await sendPushNotification(orderInfo.usuario_id, {
              title: finalTitle,
              body: finalBody,
              url: "/",
              icon: "/icon.png",
              badge: "/badge.png",
              tag: `order-delivered-${orderInfo.pedido_id}`,
            });
            console.log(`[Order Completion] Push personalizado enviado al cliente ${orderInfo.usuario_id}: ${sent}`);
          } catch (pushErr) {
            console.error("[Order Completion] Error enviando push al cliente:", pushErr);
          }
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
