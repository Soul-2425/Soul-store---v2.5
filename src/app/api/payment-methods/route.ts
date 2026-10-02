import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const moneda = searchParams.get("moneda");

    let metodos;
    if (moneda) {
      metodos = await sql`
        SELECT 
          id, moneda, nombre_metodo, banco, titular, identificacion,
          datos_cuenta, tipo_cuenta, instrucciones, qr_imagen_url, campos, activo, orden
        FROM public.metodos_pago
        WHERE activo = true AND UPPER(moneda) = UPPER(${moneda})
        ORDER BY orden ASC, creado_en ASC
      `;
    } else {
      metodos = await sql`
        SELECT 
          id, moneda, nombre_metodo, banco, titular, identificacion,
          datos_cuenta, tipo_cuenta, instrucciones, qr_imagen_url, campos, activo, orden
        FROM public.metodos_pago
        WHERE activo = true
        ORDER BY orden ASC, creado_en ASC
      `;
    }

    return NextResponse.json({ metodos });
  } catch (error: any) {
    console.error("Error fetching payment methods:", error);
    return NextResponse.json(
      { error: "Error al obtener métodos de pago", details: error.message },
      { status: 500 }
    );
  }
}
