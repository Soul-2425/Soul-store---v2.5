import { NextResponse } from "next/server";
import { notifyAdmins } from "@/utils/web-push";
import { sql } from "@/lib/db";
import { interpolateTemplate, DEFAULT_NOTIFICATION_TEMPLATES } from "@/utils/notifications-template";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const sampleType = body.sampleType || "admin";

    // Contar administradores suscritos
    const subs = await sql`
      SELECT ps.id, ps.endpoint, ps.is_admin, u.email
      FROM public.push_subscriptions ps
      LEFT JOIN public.usuarios u ON ps.user_id = u.id
      WHERE lower(COALESCE(u.rango, '')) = 'admin' OR ps.is_admin = TRUE
    `;

    if (subs.length === 0) {
      return NextResponse.json({
        success: false,
        delivered: false,
        adminSubscribersCount: 0,
        message: "No hay teléfonos de administrador suscritos actualmente. Haz clic en 'Activar Alertas en este Teléfono' primero.",
      });
    }

    const [cfg] = await sql`
      SELECT 
        admin_titulo_template, 
        admin_cuerpo_template, 
        admin_url_template,
        cliente_titulo_template,
        cliente_cuerpo_template
      FROM public.notificaciones_config
      WHERE id = 1
    `;

    const sampleVars = {
      producto: "Free Fire",
      variante: "310+31 Diamantes",
      cliente: "Carlos La Rosa",
      pedido_id: "SOUL-31031",
      monto: "0.95",
      moneda: "USD",
      metodo_pago: "Pago Móvil (Bancamiga)",
      whatsapp: "+58 424 8901572",
      jugador_id: "2579249340",
    };

    let testTitle: string;
    let testBody: string;
    let testUrl: string = "/admin?tab=pedidos&order_id=SOUL-31031";

    if (sampleType === "cliente") {
      const tTemplate = body.title || cfg?.cliente_titulo_template || DEFAULT_NOTIFICATION_TEMPLATES.cliente_titulo_template;
      const bTemplate = body.body || cfg?.cliente_cuerpo_template || DEFAULT_NOTIFICATION_TEMPLATES.cliente_cuerpo_template;
      testTitle = interpolateTemplate(tTemplate, sampleVars);
      testBody = interpolateTemplate(bTemplate, sampleVars);
      testUrl = "/";
    } else {
      const tTemplate = body.title || cfg?.admin_titulo_template || DEFAULT_NOTIFICATION_TEMPLATES.admin_titulo_template;
      const bTemplate = body.body || cfg?.admin_cuerpo_template || DEFAULT_NOTIFICATION_TEMPLATES.admin_cuerpo_template;
      const uTemplate = body.url || cfg?.admin_url_template || DEFAULT_NOTIFICATION_TEMPLATES.admin_url_template;
      testTitle = interpolateTemplate(tTemplate, sampleVars);
      testBody = interpolateTemplate(bTemplate, sampleVars);
      testUrl = interpolateTemplate(uTemplate, sampleVars);
    }

    const sent = await notifyAdmins({
      title: testTitle,
      body: testBody,
      url: testUrl,
      icon: "/icon.png",
      badge: "/badge.png",
      tag: `test-push-${Date.now()}`,
    });

    return NextResponse.json({
      success: true,
      delivered: sent,
      adminSubscribersCount: subs.length,
      titleSent: testTitle,
      bodySent: testBody,
      urlSent: testUrl,
      message: sent
        ? `¡Notificación enviada con éxito a ${subs.length} dispositivo(s)! Revisa la barra de tu teléfono.`
        : "No se pudo entregar la alerta de prueba. Verifica tu conexión.",
    });
  } catch (error: any) {
    console.error("Error in test notification route:", error);
    return NextResponse.json(
      { error: "Error al enviar notificación de prueba", details: error.message },
      { status: 500 }
    );
  }
}
