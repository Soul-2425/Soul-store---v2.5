import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      categoria_id,
      nombre,
      slug,
      descripcion,
      imagen_url,
      precio_base,
      costo_proveedor,
      activo,
      oferta_especial,
      requiere_inventario,
      tiene_caducidad,
    } = body;

    if (!nombre || !categoria_id) {
      return NextResponse.json(
        { error: "Nombre y Categoría son obligatorios" },
        { status: 400 }
      );
    }

    // Buscar o crear la subcategoría por defecto para esta categoría
    let [subcat] = await sql`
      SELECT id FROM public.subcategorias WHERE categoria_id = ${categoria_id} LIMIT 1
    `;

    if (!subcat) {
      const [cat] = await sql`SELECT nombre, slug FROM public.categorias WHERE id = ${categoria_id}`;
      const subSlug = `${cat ? cat.slug : "general"}-${Date.now()}`;
      [subcat] = await sql`
        INSERT INTO public.subcategorias (categoria_id, nombre, slug, activo)
        VALUES (${categoria_id}, ${cat ? cat.nombre : "General"}, ${subSlug}, TRUE)
        RETURNING id
      `;
    }

    const finalSlug =
      slug ||
      `${nombre.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")}-${Date.now().toString().slice(-4)}`;

    const [newProduct] = await sql`
      INSERT INTO public.productos (
        subcategoria_id,
        nombre,
        slug,
        descripcion,
        imagen_url,
        precio_base,
        costo_proveedor,
        activo,
        oferta_especial,
        requiere_inventario,
        tiene_caducidad
      )
      VALUES (
        ${subcat.id},
        ${nombre},
        ${finalSlug},
        ${descripcion || null},
        ${imagen_url || null},
        ${precio_base || 0},
        ${costo_proveedor || 0},
        ${activo !== undefined ? activo : true},
        ${oferta_especial !== undefined ? oferta_especial : false},
        ${requiere_inventario !== undefined ? requiere_inventario : false},
        ${tiene_caducidad !== undefined ? tiene_caducidad : false}
      )
      RETURNING *
    `;

    return NextResponse.json({ product: newProduct }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Error al crear el producto", details: error.message },
      { status: 500 }
    );
  }
}
