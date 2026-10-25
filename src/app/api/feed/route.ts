import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET: Retornar las entregas aprobadas con sus likes y comentarios para el Feed público
export async function GET() {
  try {
    const items = await sql`
      SELECT 
        fe.id, 
        fe.nickname_anonimo, 
        fe.descripcion_entrega, 
        fe.comentario_cliente,
        COALESCE(fe.likes_count, 0)::int as likes_count,
        fe.creado_en,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', fc.id,
                'autor_nombre', fc.autor_nombre,
                'comentario', fc.comentario,
                'creado_en', fc.creado_en
              ) ORDER BY fc.creado_en ASC
            )
            FROM public.feed_comentarios fc
            WHERE fc.feed_id = fe.id
          ),
          '[]'::json
        ) as comentarios
      FROM public.feed_entregas fe
      WHERE fe.aprobado_admin = TRUE
      ORDER BY fe.creado_en DESC
      LIMIT 20
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
