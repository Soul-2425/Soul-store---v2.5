import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

// Actualizar rango de usuario
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { rango } = body;

    if (!rango) {
      return NextResponse.json({ error: "El rango es obligatorio" }, { status: 400 });
    }

    const [updated] = await sql`
      UPDATE public.usuarios
      SET rango = ${rango}, actualizado_en = NOW()
      WHERE id = ${id}
      RETURNING id, nombre, nickname, email, rango
    `;

    // Sincronizar también con raw_user_meta_data en auth.users
    await sql`
      UPDATE auth.users
      SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('rango', ${rango}::text)
      WHERE id = ${id}
    `;

    return NextResponse.json({ user: updated });
  } catch (error: any) {
    console.error("Error updating user role:", error);
    return NextResponse.json(
      { error: "Error al actualizar rango", details: error.message },
      { status: 500 }
    );
  }
}
