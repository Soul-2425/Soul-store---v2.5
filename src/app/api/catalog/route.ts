import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

// API pública del catálogo (Solo devuelve elementos con activo = true)
export async function GET() {
  try {
    const categories = await sql`
      SELECT id, nombre, slug, imagen_url, activo, orden, creado_en
      FROM public.categorias
      WHERE activo = TRUE
      ORDER BY orden ASC, creado_en DESC
    `;

    const subcategories = await sql`
      SELECT id, categoria_id, nombre, slug, imagen_url, activo, orden
      FROM public.subcategorias
      WHERE activo = TRUE
      ORDER BY orden ASC, creado_en DESC
    `;

    const products = await sql`
      SELECT p.id, p.nombre, p.slug, p.descripcion, p.imagen_url, p.imagen_oferta_url,
             p.precio_base, p.costo_proveedor, p.activo, p.oferta_especial, p.subcategoria_id,
             p.precio_ref_ves, p.precio_fijo_ves, p.precio_ref_mxn, p.precio_fijo_mxn,
             COALESCE(c.id, s.categoria_id) as categoria_id, 
             COALESCE(c.nombre, 'General') as categoria_nombre,
             COALESCE(s.nombre, 'General') as subcategoria_nombre
      FROM public.productos p
      LEFT JOIN public.subcategorias s ON p.subcategoria_id = s.id
      LEFT JOIN public.categorias c ON s.categoria_id = c.id
      WHERE p.activo = TRUE AND (c.activo = TRUE OR c.activo IS NULL OR p.oferta_especial = TRUE)
      ORDER BY p.orden ASC, p.creado_en DESC
    `;

    const variants = await sql`
      SELECT id, producto_id, nombre, sku, costo_proveedor, precio_base, activo, imagen_url, orden,
             precio_ref_ves, precio_fijo_ves, precio_ref_mxn, precio_fijo_mxn
      FROM public.variantes_producto
      WHERE activo = TRUE
      ORDER BY orden ASC, creado_en ASC
    `;

    return NextResponse.json({ categories, subcategories, products, variants });
  } catch (error: any) {
    console.error("Error fetching catalog:", error);
    return NextResponse.json(
      { error: "Error al cargar catálogo", details: error.message },
      { status: 500 }
    );
  }
}
