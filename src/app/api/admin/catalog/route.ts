import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

// Endpoint Admin: Devuelve TODAS las categorías y productos (activos e inactivos)
export async function GET() {
  try {
    const categories = await sql`
      SELECT id, nombre, slug, imagen_url, activo, orden, creado_en, COALESCE(requisitos_dinamicos, '[]'::jsonb) as requisitos_dinamicos
      FROM public.categorias
      ORDER BY creado_en DESC
    `;

    const subcategories = await sql`
      SELECT id, categoria_id, nombre, slug, imagen_url, activo, orden, COALESCE(requisitos_dinamicos, '[]'::jsonb) as requisitos_dinamicos
      FROM public.subcategorias
      ORDER BY creado_en DESC
    `;

    const products = await sql`
      SELECT p.id, p.nombre, p.slug, p.descripcion, p.imagen_url, p.imagen_oferta_url,
             p.costo_proveedor, p.precio_base, p.activo, p.oferta_especial,
             p.requiere_inventario, p.tiene_caducidad, p.subcategoria_id,
             p.precio_ref_ves, p.precio_fijo_ves, p.precio_ref_mxn, p.precio_fijo_mxn,
             COALESCE(p.requisitos_dinamicos, '[]'::jsonb) as requisitos_dinamicos,
             s.categoria_id, c.nombre as categoria_nombre, s.nombre as subcategoria_nombre
      FROM public.productos p
      LEFT JOIN public.subcategorias s ON p.subcategoria_id = s.id
      LEFT JOIN public.categorias c ON s.categoria_id = c.id
      ORDER BY p.creado_en DESC
    `;

    const variants = await sql`
      SELECT id, producto_id, nombre, sku, costo_proveedor, precio_base, activo, imagen_url, orden,
             precio_ref_ves, precio_fijo_ves, precio_ref_mxn, precio_fijo_mxn,
             COALESCE(requisitos_dinamicos, '[]'::jsonb) as requisitos_dinamicos
      FROM public.variantes_producto
      ORDER BY orden ASC, creado_en ASC
    `;

    const overrides = await sql`
      SELECT id, producto_id, variante_id, rango, precio_fijo
      FROM public.precios_override
    `;

    // Orden jerárquico estricto:
    // Clientes: Grado 4 -> Grado 3 -> Grado 2 -> Grado 1 -> Grado Especial (más alto)
    // Revendedores: Grado 4 -> Grado 3 -> Grado 2 -> Grado 1 -> Grado Especial (más alto)
    const rankRules = await sql`
      SELECT id, rango, porcentaje_ganancia, descripcion
      FROM public.reglas_margen_rango
      ORDER BY 
        CASE rango
          WHEN 'cliente_4' THEN 1
          WHEN 'cliente_3' THEN 2
          WHEN 'cliente_2' THEN 3
          WHEN 'cliente_1' THEN 4
          WHEN 'cliente_especial' THEN 5
          WHEN 'revendedor_4' THEN 6
          WHEN 'revendedor_3' THEN 7
          WHEN 'revendedor_2' THEN 8
          WHEN 'revendedor_1' THEN 9
          WHEN 'revendedor_especial' THEN 10
          WHEN 'disenador' THEN 11
          WHEN 'admin' THEN 12
          ELSE 13
        END ASC
    `;

    return NextResponse.json({ categories, subcategories, products, variants, overrides, rankRules });
  } catch (error: any) {
    console.error("Error fetching admin catalog:", error);
    return NextResponse.json(
      { error: "Error en admin catalog", details: error.message },
      { status: 500 }
    );
  }
}
