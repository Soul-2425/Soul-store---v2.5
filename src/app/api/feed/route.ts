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
        fe.imagen_url,
        fe.avatar_url,
        COALESCE(fe.categoria, 'General') as categoria,
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
      LIMIT 200
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

// POST: Publicar una nueva referencia o experiencia en el Feed
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      nickname_anonimo,
      descripcion_entrega,
      comentario_cliente,
      imagen_url,
      avatar_url,
      categoria,
      es_admin = false,
    } = body;

    const safeNickname = (nickname_anonimo || "Cliente Verificado").trim().slice(0, 50);
    const safeDescripcion = (descripcion_entrega || "Recarga Despachada").trim().slice(0, 255);
    const safeComentario = comentario_cliente ? String(comentario_cliente).trim().slice(0, 500) : null;
    const safeImagenUrl = imagen_url ? String(imagen_url).trim() : null;
    const safeAvatarUrl = avatar_url ? String(avatar_url).trim() : null;
    const safeCategoria = (categoria || "General").trim().slice(0, 50);

    // Las referencias creadas por el admin o verificadas se aprueban automáticamente
    const [nuevaEntrega] = await sql`
      INSERT INTO public.feed_entregas (
        nickname_anonimo,
        descripcion_entrega,
        comentario_cliente,
        imagen_url,
        avatar_url,
        categoria,
        aprobado_admin,
        likes_count
      )
      VALUES (
        ${safeNickname},
        ${safeDescripcion},
        ${safeComentario},
        ${safeImagenUrl},
        ${safeAvatarUrl},
        ${safeCategoria},
        TRUE,
        0
      )
      RETURNING 
        id, 
        nickname_anonimo, 
        descripcion_entrega, 
        comentario_cliente,
        imagen_url,
        avatar_url,
        categoria,
        aprobado_admin,
        likes_count,
        creado_en
    `;

    return NextResponse.json({
      success: true,
      item: {
        ...nuevaEntrega,
        comentarios: [],
      },
      message: "Publicación agregada con éxito al Feed",
    });
  } catch (error: any) {
    console.error("Error al crear publicación en feed:", error);
    return NextResponse.json(
      { error: "Error al publicar en el feed", details: error.message },
      { status: 500 }
    );
  }
}
