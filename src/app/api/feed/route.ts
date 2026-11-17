import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET: Retornar las entregas aprobadas con sus likes y comentarios para el Feed público, y lista de administradores
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
        COALESCE(fe.etiqueta, 'Completado') as etiqueta,
        COALESCE(fe.pais, 'General') as pais,
        fe.pedido_id,
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

    // Obtener los administradores oficiales para las historias superiores
    const admins = await sql`
      SELECT id, nombre, nickname, avatar_url, rango, telefono_whatsapp
      FROM public.usuarios
      WHERE rango = 'admin'
      ORDER BY fecha_registro ASC
      LIMIT 10
    `;

    return NextResponse.json({ 
      feed: items,
      admins: admins || []
    });
  } catch (error: any) {
    console.error("Error al obtener feed de entregas:", error);
    return NextResponse.json(
      { error: "Error al cargar feed", details: error.message },
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
      etiqueta = "Completado",
      pais = "General",
      pedido_id,
      es_admin = false,
    } = body;

    // Verificar usuario autenticado
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Debes iniciar sesión para publicar en el feed." },
        { status: 401 }
      );
    }

    const [u] = await sql`SELECT id, rango, nickname, avatar_url FROM public.usuarios WHERE id = ${user.id}`;
    const esUsuarioAdmin = u && u.rango === "admin";

    // REGLA OBLIGATORIA: Si NO es admin, debe haber realizado al menos un pedido COMPLETADO
    if (!esUsuarioAdmin) {
      const completedOrders = await sql`
        SELECT id, creado_en 
        FROM public.pedidos 
        WHERE usuario_id = ${user.id} AND estado = 'COMPLETADO'
        LIMIT 1
      `;

      if (completedOrders.length === 0) {
        return NextResponse.json(
          { 
            error: "Para publicar en el feed y compartir tu experiencia, debes tener al menos una recarga o pedido completado en tu cuenta.",
            requiere_pedido_previo: true
          },
          { status: 403 }
        );
      }
    }

    // Regla de aprobación:
    // Si la publica un cliente -> requiere aprobación en panel admin (aprobado_admin = false)
    // Si la publica un administrador -> aprobado_admin = true
    const autoAprobado = esUsuarioAdmin || Boolean(es_admin);

    const safeNickname = (nickname_anonimo || u?.nickname || "Cliente Verificado").trim().slice(0, 50);
    const safeDescripcion = (descripcion_entrega || "Recarga Despachada").trim().slice(0, 255);
    const safeComentario = comentario_cliente ? String(comentario_cliente).trim().slice(0, 500) : null;
    const safeImagenUrl = imagen_url ? String(imagen_url).trim() : null;
    const safeAvatarUrl = avatar_url || u?.avatar_url || null;
    const safeCategoria = (categoria || "General").trim().slice(0, 50);
    const safeEtiqueta = (etiqueta || "Completado").trim().slice(0, 50);
    const safePais = (pais || "General").trim().slice(0, 20);
    const safePedidoId = pedido_id ? String(pedido_id).trim() : null;

    const [nuevaEntrega] = await sql`
      INSERT INTO public.feed_entregas (
        nickname_anonimo,
        descripcion_entrega,
        comentario_cliente,
        imagen_url,
        avatar_url,
        categoria,
        etiqueta,
        pais,
        pedido_id,
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
        ${safeEtiqueta},
        ${safePais},
        ${safePedidoId ? sql`${safePedidoId}::uuid` : null},
        ${autoAprobado},
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
        etiqueta,
        pais,
        pedido_id,
        aprobado_admin,
        likes_count,
        creado_en
    `;

    return NextResponse.json({
      success: true,
      aprobado_admin: autoAprobado,
      item: autoAprobado ? { ...nuevaEntrega, comentarios: [] } : null,
      message: autoAprobado
        ? "Publicación agregada con éxito al Feed."
        : "¡Tu experiencia ha sido enviada con éxito! Está en revisión por un administrador y aparecerá en el feed en cuanto sea aprobada.",
    });
  } catch (error: any) {
    console.error("Error al crear publicación en feed:", error);
    return NextResponse.json(
      { error: "Error al publicar", details: error.message },
      { status: 500 }
    );
  }
}
