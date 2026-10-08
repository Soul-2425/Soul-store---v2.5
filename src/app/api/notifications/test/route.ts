import { NextResponse } from "next/server";
import { notifyAdmins } from "@/utils/web-push";
import { sql } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const testTitle = body.title || "🟢 Soul Store • Alerta de Prueba ✅";
    const testBody = body.body || "¡Las notificaciones Push están activas y funcionando correctamente en tu dispositivo!";

    // Contar administradores suscritos
    const subs = await sql`
      SELECT ps.id, ps.endpoint, ps.is_admin, u.email
      FROM public.push_subscriptions ps
      LEFT JOIN public.usuarios u ON ps.user_id = u.id
      WHERE lower(COALESCE(u.rango, '')) = 'admin' OR ps.is_admin = TRUE
    `;

    const sent = await notifyAdmins({
      title: testTitle,
      body: testBody,
      url: "/admin",
      icon: "/icon.png",
      badge: "/badge.png",
      tag: `test-push-${Date.now()}`,
    });

    return NextResponse.json({
      success: true,
      delivered: sent,
      adminSubscribersCount: subs.length,
      message: sent
        ? `Notificación de prueba enviada con éxito a ${subs.length} dispositivo(s).`
        : "No hay dispositivos de administrador suscritos actualmente. Haz clic en 'Activar Notificaciones' primero.",
    });
  } catch (error: any) {
    console.error("Error in test notification route:", error);
    return NextResponse.json(
      { error: "Error al enviar notificación de prueba", details: error.message },
      { status: 500 }
    );
  }
}
