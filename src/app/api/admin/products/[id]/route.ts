import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

// Actualizar producto o cambiar visibilidad
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      nombre,
      descripcion,
      subcategoria_id,
      precio_base,
      costo_proveedor,
      activo,
      oferta_especial,
      imagen_url,
      imagen_oferta_url,
      precio_ref_ves,
      precio_fijo_ves,
      precio_ref_mxn,
      precio_fijo_mxn,
      overrides,
    } = body;

    const [existing] = await sql`SELECT * FROM public.productos WHERE id = ${id}`;
    if (!existing) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    const updatedNombre = nombre !== undefined ? nombre : existing.nombre;
    const updatedDesc = descripcion !== undefined ? (descripcion?.trim() || null) : existing.descripcion;
    const updatedSubcat = subcategoria_id !== undefined ? subcategoria_id : existing.subcategoria_id;
    const updatedPrecio = precio_base !== undefined ? parseFloat(precio_base) || 0 : existing.precio_base;
    const updatedCosto = costo_proveedor !== undefined ? parseFloat(costo_proveedor) || 0 : existing.costo_proveedor;
    const updatedActivo = activo !== undefined ? activo : existing.activo;
    const updatedOferta = oferta_especial !== undefined ? oferta_especial : existing.oferta_especial;
    const updatedImagen = imagen_url !== undefined ? imagen_url : existing.imagen_url;
    const updatedImagenOferta = imagen_oferta_url !== undefined ? imagen_oferta_url : existing.imagen_oferta_url;
    const updatedRefVes = precio_ref_ves !== undefined ? (parseFloat(precio_ref_ves) || null) : existing.precio_ref_ves;
    const updatedFijoVes = precio_fijo_ves !== undefined ? (parseFloat(precio_fijo_ves) || null) : existing.precio_fijo_ves;
    const updatedRefMxn = precio_ref_mxn !== undefined ? (parseFloat(precio_ref_mxn) || null) : existing.precio_ref_mxn;
    const updatedFijoMxn = precio_fijo_mxn !== undefined ? (parseFloat(precio_fijo_mxn) || null) : existing.precio_fijo_mxn;

    const [updated] = await sql`
      UPDATE public.productos
      SET 
        nombre = ${updatedNombre},
        descripcion = ${updatedDesc},
        subcategoria_id = ${updatedSubcat},
        precio_base = ${updatedPrecio},
        costo_proveedor = ${updatedCosto},
        activo = ${updatedActivo},
        oferta_especial = ${updatedOferta},
        imagen_url = ${updatedImagen},
        imagen_oferta_url = ${updatedImagenOferta},
        precio_ref_ves = ${updatedRefVes},
        precio_fijo_ves = ${updatedFijoVes},
        precio_ref_mxn = ${updatedRefMxn},
        precio_fijo_mxn = ${updatedFijoMxn},
        requisitos_dinamicos = COALESCE(${body.requisitos_dinamicos !== undefined ? sql.json(body.requisitos_dinamicos) : null}, requisitos_dinamicos),
        actualizado_en = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    // Actualizar overrides por rango si se enviaron
    if (Array.isArray(overrides)) {
      await sql`DELETE FROM public.precios_override WHERE producto_id = ${id}`;
      for (const ov of overrides) {
        if (ov && ov.rango && ov.precio_fijo !== undefined && ov.precio_fijo !== null && ov.precio_fijo !== "") {
          const pVal = parseFloat(ov.precio_fijo);
          if (!isNaN(pVal) && pVal >= 0) {
            await sql`
              INSERT INTO public.precios_override (producto_id, rango, precio_fijo, actualizado_en)
              VALUES (${id}, ${ov.rango}, ${pVal}, NOW())
              ON CONFLICT (producto_id, rango) WHERE producto_id IS NOT NULL
              DO UPDATE SET precio_fijo = EXCLUDED.precio_fijo, actualizado_en = NOW()
            `;
          }
        }
      }
    }

    return NextResponse.json({ product: updated });
  } catch (error: any) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Error al actualizar el producto", details: error.message },
      { status: 500 }
    );
  }
}

// Eliminar producto de la base de datos
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await sql`
      DELETE FROM public.productos
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true, message: "Producto eliminado correctamente" });
  } catch (error: any) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Error al eliminar el producto", details: error.message },
      { status: 500 }
    );
  }
}
