import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

// Obtener todos los métodos de pago (activos e inactivos)
export async function GET() {
  try {
    const metodos = await sql`
      SELECT 
        id, moneda, nombre_metodo, banco, titular, identificacion,
        datos_cuenta, tipo_cuenta, instrucciones, qr_imagen_url, campos, activo, orden,
        creado_en, actualizado_en
      FROM public.metodos_pago
      ORDER BY moneda ASC, orden ASC, creado_en ASC
    `;
    return NextResponse.json({ metodos });
  } catch (error: any) {
    console.error("Error in admin payment methods GET:", error);
    return NextResponse.json(
      { error: "Error al obtener métodos de pago", details: error.message },
      { status: 500 }
    );
  }
}

// Crear un nuevo método de pago
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      moneda,
      nombre_metodo,
      banco,
      titular,
      identificacion,
      datos_cuenta,
      tipo_cuenta,
      instrucciones,
      qr_imagen_url,
      campos = [],
      activo = true,
      orden = 0
    } = body;

    const safeCampos = Array.isArray(campos) ? campos : [];
    const generatedDatos = datos_cuenta && datos_cuenta.trim() 
      ? datos_cuenta.trim() 
      : safeCampos.map((c: any) => `${c.etiqueta}: ${c.valor}`).join(" | ") || "Sin datos";

    if (!moneda || !nombre_metodo) {
      return NextResponse.json(
        { error: "Moneda y nombre del método son obligatorios." },
        { status: 400 }
      );
    }

    const [nuevo] = await sql`
      INSERT INTO public.metodos_pago (
        moneda, nombre_metodo, banco, titular, identificacion,
        datos_cuenta, tipo_cuenta, instrucciones, qr_imagen_url, campos, activo, orden
      ) VALUES (
        ${moneda.toUpperCase().trim()},
        ${nombre_metodo.trim()},
        ${banco ? banco.trim() : null},
        ${titular ? titular.trim() : null},
        ${identificacion ? identificacion.trim() : null},
        ${generatedDatos},
        ${tipo_cuenta ? tipo_cuenta.trim() : null},
        ${instrucciones ? instrucciones.trim() : null},
        ${qr_imagen_url ? qr_imagen_url.trim() : null},
        ${sql.json(safeCampos)},
        ${Boolean(activo)},
        ${Number(orden) || 0}
      )
      RETURNING *
    `;

    return NextResponse.json({ metodo: nuevo }, { status: 201 });
  } catch (error: any) {
    console.error("Error in admin payment methods POST:", error);
    return NextResponse.json(
      { error: "Error al crear método de pago", details: error.message },
      { status: 500 }
    );
  }
}
