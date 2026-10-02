import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// GET: Listar tickets de soporte
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    let tickets;
    if (userId) {
      tickets = await sql`
        SELECT 
          t.id,
          t.codigo_ticket,
          t.usuario_id,
          u.nickname as usuario_nombre,
          u.email as usuario_email,
          t.pedido_id,
          t.asunto_motivo,
          t.descripcion,
          t.estado,
          t.prioridad,
          t.creado_en,
          t.actualizado_en,
          (
            SELECT count(*)::int 
            FROM public.mensajes_soporte m 
            WHERE m.ticket_id = t.id AND m.leido = FALSE AND m.es_admin = TRUE
          ) as mensajes_no_leidos
        FROM public.tickets_soporte t
        JOIN public.usuarios u ON t.usuario_id = u.id
        WHERE t.usuario_id = ${userId}::uuid
        ORDER BY t.actualizado_en DESC
      `;
    } else {
      // Si no se pasa userId (o es admin), listar los tickets generales
      tickets = await sql`
        SELECT 
          t.id,
          t.codigo_ticket,
          t.usuario_id,
          u.nickname as usuario_nombre,
          u.email as usuario_email,
          t.pedido_id,
          t.asunto_motivo,
          t.descripcion,
          t.estado,
          t.prioridad,
          t.creado_en,
          t.actualizado_en,
          (
            SELECT count(*)::int 
            FROM public.mensajes_soporte m 
            WHERE m.ticket_id = t.id AND m.leido = FALSE
          ) as mensajes_no_leidos
        FROM public.tickets_soporte t
        JOIN public.usuarios u ON t.usuario_id = u.id
        ORDER BY t.actualizado_en DESC
        LIMIT 50
      `;
    }

    return NextResponse.json({ tickets });
  } catch (error: any) {
    console.error("Error al obtener tickets:", error);
    return NextResponse.json(
      { error: "Error al consultar tickets de soporte", details: error.message },
      { status: 500 }
    );
  }
}

// POST: Crear un nuevo ticket de soporte
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { usuario_id, asunto_motivo, descripcion, pedido_id, prioridad = "MEDIA" } = body;

    if (!asunto_motivo?.trim() || !descripcion?.trim()) {
      return NextResponse.json(
        { error: "El asunto y la descripción son obligatorios." },
        { status: 400 }
      );
    }

    // Si no se provee usuario_id, buscar un usuario admin o default
    let finalUserId = usuario_id;
    if (!finalUserId) {
      const [user] = await sql`SELECT id FROM public.usuarios ORDER BY fecha_registro ASC LIMIT 1`;
      finalUserId = user?.id;
    }

    if (!finalUserId) {
      return NextResponse.json(
        { error: "No se encontró un usuario para asignar el ticket." },
        { status: 400 }
      );
    }

    const safePedidoId = pedido_id || null;
    const codigoTicket = `TK-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

    const [newTicket] = await sql`
      INSERT INTO public.tickets_soporte (
        codigo_ticket,
        usuario_id,
        pedido_id,
        asunto_motivo,
        descripcion,
        prioridad,
        estado
      ) VALUES (
        ${codigoTicket},
        ${finalUserId}::uuid,
        ${safePedidoId}::uuid,
        ${asunto_motivo.trim()},
        ${descripcion.trim()},
        ${prioridad},
        'ABIERTO'
      )
      RETURNING id, codigo_ticket, usuario_id, asunto_motivo, estado, prioridad, creado_en
    `;

    // Insertar el primer mensaje en el hilo del chat
    await sql`
      INSERT INTO public.mensajes_soporte (
        ticket_id,
        remitente_id,
        es_admin,
        mensaje,
        leido
      ) VALUES (
        ${newTicket.id}::uuid,
        ${finalUserId}::uuid,
        FALSE,
        ${descripcion.trim()},
        TRUE
      )
    `;

    return NextResponse.json({
      success: true,
      message: `Ticket ${codigoTicket} creado exitosamente.`,
      ticket: newTicket,
    });
  } catch (error: any) {
    console.error("Error al crear ticket:", error);
    return NextResponse.json(
      { error: "Error al crear ticket", details: error.message },
      { status: 500 }
    );
  }
}
