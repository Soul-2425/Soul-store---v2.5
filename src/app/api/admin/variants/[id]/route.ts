import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      nombre,
      precio_base,
      costo_proveedor,
      imagen_url,
      activo,
      precio_ref_ves,
      precio_fijo_ves,
      precio_ref_mxn,
      precio_fijo_mxn,
      overrides,
    } = body;

    const [existing] = await sql`SELECT * FROM public.variantes_producto WHERE id = ${id}`;
    if (!existing) {
      return NextResponse.json({ error: "Subproducto no encontrado" }, { status: 404 });
    }

    const updatedNombre = nombre !== undefined ? nombre : existing.nombre;
    const updatedPrecio = precio_base !== undefined ? parseFloat(precio_base) || 0 : existing.precio_base;
    const updatedCosto = costo_proveedor !== undefined ? parseFloat(costo_proveedor) || 0 : existing.costo_proveedor;
    const updatedImagen = imagen_url !== undefined ? imagen_url : existing.imagen_url;
    const updatedActivo = activo !== undefined ? activo : existing.activo;
    const updatedRefVes = precio_ref_ves !== undefined ? (parseFloat(precio_ref_ves) || null) : existing.precio_ref_ves;
    const updatedFijoVes = precio_fijo_ves !== undefined ? (parseFloat(precio_fijo_ves) || null) : existing.precio_fijo_ves;
    const updatedRefMxn = precio_ref_mxn !== undefined ? (parseFloat(precio_ref_mxn) || null) : existing.precio_ref_mxn;
    const updatedFijoMxn = precio_fijo_mxn !== undefined ? (parseFloat(precio_fijo_mxn) || null) : existing.precio_fijo_mxn;

    const [updated] = await sql`
      UPDATE public.variantes_producto
      SET 
        nombre = ${updatedNombre},
        precio_base = ${updatedPrecio},
        costo_proveedor = ${updatedCosto},
        imagen_url = ${updatedImagen},
        activo = ${updatedActivo},
        precio_ref_ves = ${updatedRefVes},
        precio_fijo_ves = ${updatedFijoVes},
        precio_ref_mxn = ${updatedRefMxn},
        precio_fijo_mxn = ${updatedFijoMxn},
        requisitos_dinamicos = COALESCE(${body.requisitos_dinamicos !== undefined ? sql.json(body.requisitos_dinamicos) : null}, requisitos_dinamicos)
      WHERE id = ${id}
      RETURNING *
    `;

    // Overrides de variante
    if (Array.isArray(overrides)) {
      await sql`DELETE FROM public.precios_override WHERE variante_id = ${id}`;
      for (const ov of overrides) {
        if (ov && ov.rango && ov.precio_fijo !== undefined && ov.precio_fijo !== null && ov.precio_fijo !== "") {
          const pVal = parseFloat(ov.precio_fijo);
          if (!isNaN(pVal) && pVal >= 0) {
            await sql`
              INSERT INTO public.precios_override (variante_id, rango, precio_fijo, actualizado_en)
              VALUES (${id}, ${ov.rango}, ${pVal}, NOW())
              ON CONFLICT (variante_id, rango) WHERE variante_id IS NOT NULL
              DO UPDATE SET precio_fijo = EXCLUDED.precio_fijo, actualizado_en = NOW()
            `;
          }
        }
      }
    }

    return NextResponse.json({ variant: updated });
  } catch (error: any) {
    console.error("Error updating variant:", error);
    return NextResponse.json(
      { error: "Error al actualizar subproducto", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await sql`
      DELETE FROM public.variantes_producto
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true, message: "Subproducto eliminado correctamente" });
  } catch (error: any) {
    console.error("Error deleting variant:", error);
    return NextResponse.json(
      { error: "Error al eliminar subproducto", details: error.message },
      { status: 500 }
    );
  }
}
