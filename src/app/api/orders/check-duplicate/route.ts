import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

// Comprobar si existe una recarga reciente (<15 min) para el mismo Player ID y producto
export async function POST(request: Request) {
  try {
    const { player_id, producto_id } = await request.json();

    if (!player_id || !producto_id) {
      return NextResponse.json({ isDuplicate: false });
    }

    const duplicates = await sql`
      SELECT pi.id, pi.creado_en, pi.player_id, p.nombre as producto_nombre
      FROM public.pedidos_items pi
      JOIN public.pedidos ped ON pi.pedido_id = ped.id
      JOIN public.productos p ON pi.producto_id = p.id
      WHERE pi.player_id = ${player_id.trim()}
        AND pi.producto_id = ${producto_id}
        AND ped.estado != 'CANCELADO'
        AND pi.creado_en >= NOW() - INTERVAL '15 minutes'
      ORDER BY pi.creado_en DESC
      LIMIT 1
    `;

    if (duplicates.length > 0) {
      const dup = duplicates[0];
      return NextResponse.json({
        isDuplicate: true,
        lastOrderTime: dup.creado_en,
        productName: dup.producto_nombre,
        message: "Se detectó una compra reciente (<15 min) hacia este mismo Player ID.",
      });
    }

    return NextResponse.json({ isDuplicate: false });
  } catch (error: any) {
    console.error("Error checking duplicate order:", error);
    return NextResponse.json({ isDuplicate: false, error: error.message });
  }
}
