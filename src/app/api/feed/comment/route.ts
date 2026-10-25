import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { feed_id, autor_nombre, comentario, usuario_id } = body;

    const safeFeedId = feed_id ? String(feed_id).trim() : null;
    const safeNombre = autor_nombre ? String(autor_nombre).trim().slice(0, 50) : "Cliente";
    const safeComentario = comentario ? String(comentario).trim().slice(0, 500) : "";
    const safeUserId = usuario_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(usuario_id)
      ? usuario_id
      : null;

    if (!safeFeedId) {
      return NextResponse.json({ error: "El ID de la entrega es obligatorio" }, { status: 400 });
    }

    if (!safeComentario) {
      return NextResponse.json({ error: "El comentario no puede estar vacío" }, { status: 400 });
    }

    const [nuevoComentario] = await sql`
      INSERT INTO public.feed_comentarios (
        feed_id,
        usuario_id,
        autor_nombre,
        comentario
      )
      VALUES (
        ${safeFeedId}::uuid,
        ${safeUserId ? safeUserId : null}::uuid,
        ${safeNombre},
        ${safeComentario}
      )
      RETURNING id, feed_id, autor_nombre, comentario, creado_en
    `;

    return NextResponse.json({
      success: true,
      comment: nuevoComentario,
    });
  } catch (error: any) {
    console.error("Error creating feed comment:", error);
    return NextResponse.json(
      { error: "Error al publicar comentario", details: error.message },
      { status: 500 }
    );
  }
}
