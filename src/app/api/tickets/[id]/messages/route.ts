import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET: Obtener mensajes de un ticket
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const messages = await sql`
      SELECT 
        m.id,
        m.ticket_id,
        m.remitente_id,
        u.nickname as remitente_nombre,
        m.es_admin,
        m.mensaje,
        m.leido,
        m.adjunto_url,
        m.creado_en
      FROM public.mensajes_soporte m
      LEFT JOIN public.usuarios u ON m.remitente_id = u.id
      WHERE m.ticket_id = ${id}::uuid
      ORDER BY m.creado_en ASC
    `;

    return NextResponse.json({ messages });
  } catch (error: any) {
    console.error("Error al obtener mensajes de ticket:", error);
    return NextResponse.json(
      { error: "Error al obtener mensajes", details: error.message },
      { status: 500 }
    );
  }
}

// POST: Enviar un nuevo mensaje en el ticket
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { remitente_id, mensaje, es_admin = false, adjunto_url = null } = body;

    if (!mensaje?.trim()) {
      return NextResponse.json({ error: "El mensaje no puede estar vacío" }, { status: 400 });
    }

    let finalSenderId = remitente_id || null;
    if (!finalSenderId && es_admin) {
      const [adminUser] = await sql`SELECT id FROM public.usuarios WHERE rango = 'admin' LIMIT 1`;
      finalSenderId = adminUser?.id || null;
    }

    const [newMessage] = await sql`
      INSERT INTO public.mensajes_soporte (
        ticket_id,
        remitente_id,
        es_admin,
        mensaje,
        adjunto_url,
        leido
      ) VALUES (
        ${id}::uuid,
        ${finalSenderId}::uuid,
        ${Boolean(es_admin)},
        ${mensaje.trim()},
        ${adjunto_url},
        FALSE
      )
      RETURNING id, ticket_id, remitente_id, es_admin, mensaje, adjunto_url, creado_en
    `;

    // Actualizar timestamp y reabrir ticket si estaba resuelto
    await sql`
      UPDATE public.tickets_soporte
      SET actualizado_en = NOW()
      WHERE id = ${id}::uuid
    `;

    import("@/utils/web-push").then(async ({ sendPushNotification, notifyAdmins }) => {
      if (es_admin) {
        const [ticket] = await sql`SELECT usuario_id FROM public.tickets_soporte WHERE id = ${id}::uuid`;
        if (ticket?.usuario_id) {
          sendPushNotification(ticket.usuario_id, {
            title: "Nuevo mensaje de Soporte",
            body: mensaje.trim().substring(0, 100) + (mensaje.length > 100 ? "..." : ""),
            url: "/dashboard",
          }).catch(console.error);
        }
      } else {
        notifyAdmins({
          title: "Nuevo mensaje de Cliente en Soporte",
          body: mensaje.trim().substring(0, 100) + (mensaje.length > 100 ? "..." : ""),
          url: "/admin",
        }).catch(console.error);
      }
    });

    return NextResponse.json({
      success: true,
      message: newMessage,
    });
  } catch (error: any) {
    console.error("Error al enviar mensaje en ticket:", error);
    return NextResponse.json(
      { error: "Error al enviar mensaje", details: error.message },
      { status: 500 }
    );
  }
}
