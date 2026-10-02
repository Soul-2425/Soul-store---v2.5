import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET: Retornar las entregas aprobadas más recientes para la marquesina pública de la tienda
export async function GET() {
  try {
    const items = await sql`
      SELECT 
        id, 
        nickname_anonimo, 
        descripcion_entrega, 
        creado_en
      FROM public.feed_entregas
      WHERE aprobado_admin = TRUE
      ORDER BY creado_en DESC
      LIMIT 15
    `;

    return NextResponse.json({ feed: items });
  } catch (error: any) {
    console.error("Error al obtener feed de entregas:", error);
    return NextResponse.json(
      { error: "Error al consultar feed de entregas", details: error.message },
      { status: 500 }
    );
  }
}
