import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ user: null });
    }

    const [profile] = await sql`
      SELECT id, nombre, apellido, nickname, email, telefono_whatsapp, rango, auth_provider
      FROM public.usuarios
      WHERE id = ${user.id}
    `;

    return NextResponse.json({
      user: profile || {
        id: user.id,
        email: user.email,
        nickname: user.user_metadata?.nickname || "Usuario",
        rango: user.user_metadata?.rango || "cliente_4",
      },
    });
  } catch (error: any) {
    console.error("Error in /api/auth/me:", error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
