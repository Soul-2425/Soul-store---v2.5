import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

// Obtener todas las órdenes con detalles de items, jugador y cliente para el panel admin
export async function GET() {
  try {
    const orders = await sql`
      SELECT 
        p.id,
        p.estado as pedido_estado,
        p.total_usd,
        p.total_ves,
        p.total_mxn,
        p.moneda_pago,
        p.tasa_cambio,
        p.es_override_duplicado,
        p.metodo_pago_id,
        p.metodo_pago_nombre,
        p.comprobante_url,
        p.referencia_pago,
        p.creado_en,
        u.nombre as usuario_nombre,
        u.email as usuario_email,
        u.telefono_whatsapp as usuario_whatsapp,
        u.nickname as usuario_nickname,
        u.rango as usuario_rango,
        pi.id as item_id,
        pi.player_id,
        pi.region,
        pi.comentario_cliente,
        pi.estado as item_estado,
        pi.precio_unitario,
        pi.costo_proveedor,
        pi.datos_dinamicos,
        prod.nombre as producto_nombre,
        prod.id as producto_id
      FROM public.pedidos p
      JOIN public.usuarios u ON p.usuario_id = u.id
      JOIN public.pedidos_items pi ON pi.pedido_id = p.id
      JOIN public.productos prod ON pi.producto_id = prod.id
      ORDER BY p.creado_en DESC
    `;

    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error("Error fetching admin orders:", error);
    return NextResponse.json(
      { error: "Error al obtener pedidos", details: error.message },
      { status: 500 }
    );
  }
}
