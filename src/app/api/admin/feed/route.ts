import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET: Retorna todas las referencias (aprobadas y no aprobadas) para el panel de administración
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const [usuario] = await sql`
      SELECT rango FROM public.usuarios WHERE id = ${user.id}
    `;

    if (!usuario || (usuario.rango !== "admin" && usuario.rango !== "disenador")) {
      return NextResponse.json({ error: "No tienes permisos de administrador" }, { status: 403 });
    }

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
        fe.aprobado_admin,
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
      ORDER BY fe.creado_en DESC
    `;

    return NextResponse.json({ feed: items });
  } catch (error: any) {
    console.error("Error in GET /api/admin/feed:", error);
    return NextResponse.json(
      { error: "Error al obtener referencias", details: error.message },
      { status: 500 }
    );
  }
}

// POST: Crear una nueva referencia para el Feed desde el Panel Admin
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const [usuario] = await sql`
      SELECT rango FROM public.usuarios WHERE id = ${user.id}
    `;

    if (!usuario || usuario.rango !== "admin") {
      return NextResponse.json({ error: "No tienes permisos de administrador" }, { status: 403 });
    }

    const body = await request.json();
    const {
      nickname_anonimo,
      descripcion_entrega,
      comentario_cliente,
      imagen_url,
      avatar_url,
      categoria = "General",
      aprobado_admin = true,
    } = body;

    const safeNickname = (nickname_anonimo || "Cliente Verificado").trim().slice(0, 50);
    const safeDescripcion = (descripcion_entrega || "Recarga Despachada").trim().slice(0, 255);
    const safeComentario = comentario_cliente ? String(comentario_cliente).trim().slice(0, 500) : null;
    const safeImagen = imagen_url ? String(imagen_url).trim() : null;
    const safeAvatar = avatar_url ? String(avatar_url).trim() : null;
    const safeCategoria = String(categoria).trim().slice(0, 50);

    const [nueva] = await sql`
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
        ${safeImagen},
        ${safeAvatar},
        ${safeCategoria},
        ${Boolean(aprobado_admin)},
        0
      )
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      item: { ...nueva, comentarios: [] },
      message: "Referencia creada exitosamente",
    });
  } catch (error: any) {
    console.error("Error in POST /api/admin/feed:", error);
    return NextResponse.json(
      { error: "Error al crear referencia", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar una referencia del feed
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const [usuario] = await sql`
      SELECT rango FROM public.usuarios WHERE id = ${user.id}
    `;

    if (!usuario || usuario.rango !== "admin") {
      return NextResponse.json({ error: "No tienes permisos de administrador" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "El ID es requerido" }, { status: 400 });
    }

    await sql`
      DELETE FROM public.feed_comentarios WHERE feed_id = ${id}::uuid
    `;
    await sql`
      DELETE FROM public.feed_likes WHERE feed_id = ${id}::uuid
    `;
    await sql`
      DELETE FROM public.feed_entregas WHERE id = ${id}::uuid
    `;

    return NextResponse.json({
      success: true,
      message: "Referencia eliminada correctamente",
    });
  } catch (error: any) {
    console.error("Error in DELETE /api/admin/feed:", error);
    return NextResponse.json(
      { error: "Error al eliminar referencia", details: error.message },
      { status: 500 }
    );
  }
}

