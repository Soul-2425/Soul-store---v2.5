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
      SELECT id, nombre, apellido, nickname, email, telefono_whatsapp, rango, auth_provider, avatar_url
      FROM public.usuarios
      WHERE id = ${user.id}
    `;

    return NextResponse.json({
      user: profile || {
        id: user.id,
        email: user.email,
        nickname: user.user_metadata?.nickname || "Usuario",
        rango: user.user_metadata?.rango || "cliente_4",
        avatar_url: null,
      },
    });
  } catch (error: any) {
    console.error("Error in /api/auth/me:", error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { nickname, avatar_url } = body;

    const safeNickname = nickname ? String(nickname).trim().slice(0, 50) : null;
    const safeAvatar = avatar_url !== undefined ? (avatar_url ? String(avatar_url).trim() : null) : undefined;

    if (safeNickname) {
      // Verificar si el nickname ya está tomado por otro usuario
      const existing = await sql`
        SELECT id FROM public.usuarios WHERE LOWER(nickname) = LOWER(${safeNickname}) AND id != ${user.id} LIMIT 1
      `;
      if (existing.length > 0) {
        return NextResponse.json({ error: "Este nickname ya está en uso. Por favor elige otro." }, { status: 400 });
      }
    }

    let updatedProfile;
    if (safeAvatar !== undefined && safeNickname) {
      [updatedProfile] = await sql`
        UPDATE public.usuarios
        SET nickname = ${safeNickname},
            avatar_url = ${safeAvatar},
            actualizado_en = NOW()
        WHERE id = ${user.id}
        RETURNING id, nombre, apellido, nickname, email, telefono_whatsapp, rango, auth_provider, avatar_url
      `;
    } else if (safeNickname) {
      [updatedProfile] = await sql`
        UPDATE public.usuarios
        SET nickname = ${safeNickname},
            actualizado_en = NOW()
        WHERE id = ${user.id}
        RETURNING id, nombre, apellido, nickname, email, telefono_whatsapp, rango, auth_provider, avatar_url
      `;
    } else if (safeAvatar !== undefined) {
      [updatedProfile] = await sql`
        UPDATE public.usuarios
        SET avatar_url = ${safeAvatar},
            actualizado_en = NOW()
        WHERE id = ${user.id}
        RETURNING id, nombre, apellido, nickname, email, telefono_whatsapp, rango, auth_provider, avatar_url
      `;
    }

    return NextResponse.json({
      success: true,
      user: updatedProfile,
      message: "Perfil actualizado correctamente",
    });
  } catch (error: any) {
    console.error("Error in PATCH /api/auth/me:", error);
    return NextResponse.json(
      { error: "Error al actualizar perfil", details: error.message },
      { status: 500 }
    );
  }
}
