import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

// Crear subproducto / variante de producto
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      producto_id,
      nombre,
      sku,
      precio_base,
      costo_proveedor,
      imagen_url,
      activo,
      precio_ref_ves,
      precio_fijo_ves,
      precio_ref_mxn,
      precio_fijo_mxn,
      requisitos_dinamicos,
      overrides,
    } = body;

    if (!producto_id || !nombre) {
      return NextResponse.json(
        { error: "El producto_id y el nombre son obligatorios" },
        { status: 400 }
      );
    }

    const [newVariant] = await sql`
      INSERT INTO public.variantes_producto (
        producto_id,
        nombre,
        sku,
        precio_base,
        costo_proveedor,
        precio_ref_ves,
        precio_fijo_ves,
        precio_ref_mxn,
        precio_fijo_mxn,
        imagen_url,
        activo,
        requisitos_dinamicos
      )
      VALUES (
        ${producto_id},
        ${nombre},
        ${sku || null},
        ${parseFloat(precio_base) || 0},
        ${parseFloat(costo_proveedor) || 0},
        ${parseFloat(precio_ref_ves) || null},
        ${parseFloat(precio_fijo_ves) || null},
        ${parseFloat(precio_ref_mxn) || null},
        ${parseFloat(precio_fijo_mxn) || null},
        ${imagen_url || null},
        ${activo === false ? false : true},
        ${requisitos_dinamicos ? sql.json(requisitos_dinamicos) : sql.json([])}
      )
      RETURNING *
    `;

    if (Array.isArray(overrides) && overrides.length > 0) {
      for (const ov of overrides) {
        if (ov && ov.rango && ov.precio_fijo !== undefined && ov.precio_fijo !== null && ov.precio_fijo !== "") {
          const pVal = parseFloat(ov.precio_fijo);
          if (!isNaN(pVal) && pVal >= 0) {
            await sql`
              INSERT INTO public.precios_override (variante_id, rango, precio_fijo, actualizado_en)
              VALUES (${newVariant.id}, ${ov.rango}, ${pVal}, NOW())
              ON CONFLICT (variante_id, rango) WHERE variante_id IS NOT NULL
              DO UPDATE SET precio_fijo = EXCLUDED.precio_fijo, actualizado_en = NOW()
            `;
          }
        }
      }
    }

    return NextResponse.json({ variant: newVariant }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating product variant:", error);
    return NextResponse.json(
      { error: "Error al crear subproducto", details: error.message },
      { status: 500 }
    );
  }
}
