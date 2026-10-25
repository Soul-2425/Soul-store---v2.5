import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { feed_id, identificador } = body;

    if (!feed_id || !identificador) {
      return NextResponse.json(
        { error: "feed_id e identificador son obligatorios" },
        { status: 400 }
      );
    }

    // Verificar si ya dio like
    const existingLike = await sql`
      SELECT id FROM public.feed_likes 
      WHERE feed_id = ${feed_id}::uuid AND identificador = ${identificador}
      LIMIT 1
    `;

    let hasLiked = false;

    if (existingLike.length > 0) {
      // Quitar like (unlike)
      await sql`
        DELETE FROM public.feed_likes 
        WHERE feed_id = ${feed_id}::uuid AND identificador = ${identificador}
      `;
      await sql`
        UPDATE public.feed_entregas 
        SET likes_count = GREATEST(0, COALESCE(likes_count, 0) - 1)
        WHERE id = ${feed_id}::uuid
      `;
      hasLiked = false;
    } else {
      // Dar like
      await sql`
        INSERT INTO public.feed_likes (feed_id, identificador)
        VALUES (${feed_id}::uuid, ${identificador})
        ON CONFLICT (feed_id, identificador) DO NOTHING
      `;
      await sql`
        UPDATE public.feed_entregas 
        SET likes_count = COALESCE(likes_count, 0) + 1
        WHERE id = ${feed_id}::uuid
      `;
      hasLiked = true;
    }

    // Obtener nuevo contador de likes
    const [updated] = await sql`
      SELECT COALESCE(likes_count, 0)::int as likes_count 
      FROM public.feed_entregas 
      WHERE id = ${feed_id}::uuid
    `;

    return NextResponse.json({
      success: true,
      has_liked: hasLiked,
      likes_count: updated?.likes_count || 0,
    });
  } catch (error: any) {
    console.error("Error toggling feed like:", error);
    return NextResponse.json(
      { error: "Error al registrar like", details: error.message },
      { status: 500 }
    );
  }
}
