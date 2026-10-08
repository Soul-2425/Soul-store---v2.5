import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { DEFAULT_NOTIFICATION_TEMPLATES } from "@/utils/notifications-template";

export async function GET() {
  try {
    const [cfg] = await sql`
      SELECT 
        admin_titulo_template, 
        admin_cuerpo_template, 
        admin_url_template, 
        cliente_titulo_template, 
        cliente_cuerpo_template, 
        actualizado_en
      FROM public.notificaciones_config 
      WHERE id = 1
    `;

    if (!cfg) {
      return NextResponse.json({ config: DEFAULT_NOTIFICATION_TEMPLATES });
    }

    return NextResponse.json({ config: cfg });
  } catch (error: any) {
    console.error("Error fetching notification config:", error);
    return NextResponse.json(
      { config: DEFAULT_NOTIFICATION_TEMPLATES, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const adminTitulo = (body.admin_titulo_template || DEFAULT_NOTIFICATION_TEMPLATES.admin_titulo_template).trim();
    const adminCuerpo = (body.admin_cuerpo_template || DEFAULT_NOTIFICATION_TEMPLATES.admin_cuerpo_template).trim();
    const adminUrl = (body.admin_url_template || DEFAULT_NOTIFICATION_TEMPLATES.admin_url_template).trim();
    const clienteTitulo = (body.cliente_titulo_template || DEFAULT_NOTIFICATION_TEMPLATES.cliente_titulo_template).trim();
    const clienteCuerpo = (body.cliente_cuerpo_template || DEFAULT_NOTIFICATION_TEMPLATES.cliente_cuerpo_template).trim();

    const [updated] = await sql`
      INSERT INTO public.notificaciones_config (
        id,
        admin_titulo_template,
        admin_cuerpo_template,
        admin_url_template,
        cliente_titulo_template,
        cliente_cuerpo_template,
        actualizado_en
      )
      VALUES (
        1,
        ${adminTitulo},
        ${adminCuerpo},
        ${adminUrl},
        ${clienteTitulo},
        ${clienteCuerpo},
        NOW()
      )
      ON CONFLICT (id) DO UPDATE
      SET admin_titulo_template = EXCLUDED.admin_titulo_template,
          admin_cuerpo_template = EXCLUDED.admin_cuerpo_template,
          admin_url_template = EXCLUDED.admin_url_template,
          cliente_titulo_template = EXCLUDED.cliente_titulo_template,
          cliente_cuerpo_template = EXCLUDED.cliente_cuerpo_template,
          actualizado_en = NOW()
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      message: "Plantillas de notificación actualizadas exitosamente.",
      config: updated,
    });
  } catch (error: any) {
    console.error("Error updating notification config:", error);
    return NextResponse.json(
      { error: "Error al guardar configuración de notificaciones", details: error.message },
      { status: 500 }
    );
  }
}
