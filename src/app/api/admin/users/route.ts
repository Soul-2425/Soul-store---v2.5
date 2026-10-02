import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

// Obtener todos los usuarios registrados en Supabase
export async function GET() {
  try {
    const users = await sql`
      SELECT id, nombre, apellido, nickname, email, telefono_whatsapp, rango, auth_provider, fecha_registro
      FROM public.usuarios
      ORDER BY fecha_registro DESC
    `;

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Error al obtener usuarios", details: error.message },
      { status: 500 }
    );
  }
}
