import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

// Listar subcategorías
export async function GET() {
  try {
    const subcategories = await sql`
      SELECT s.id, s.categoria_id, s.nombre, s.slug, s.imagen_url, s.activo, s.orden, s.creado_en,
             c.nombre as categoria_nombre
      FROM public.subcategorias s
      LEFT JOIN public.categorias c ON s.categoria_id = c.id
      ORDER BY s.creado_en DESC
    `;
    return NextResponse.json({ subcategories });
  } catch (error: any) {
    console.error("Error fetching subcategories:", error);
    return NextResponse.json(
      { error: "Error al listar subcategorías", details: error.message },
      { status: 500 }
    );
  }
}

// Crear subcategoría
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { categoria_id, nombre, slug, imagen_url, activo, requisitos_dinamicos } = body;

    if (!categoria_id || !nombre) {
      return NextResponse.json(
        { error: "La categoría y el nombre son obligatorios" },
        { status: 400 }
      );
    }

    const finalSlug =
      slug ||
      `${nombre
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")}-${Date.now().toString().slice(-4)}`;

    const [newSubcat] = await sql`
      INSERT INTO public.subcategorias (categoria_id, nombre, slug, imagen_url, activo, requisitos_dinamicos)
      VALUES (
        ${categoria_id},
        ${nombre},
        ${finalSlug},
        ${imagen_url || null},
        ${activo === false ? false : true},
        ${requisitos_dinamicos ? sql.json(requisitos_dinamicos) : sql.json([])}
      )
      RETURNING *
    `;

    return NextResponse.json({ subcategory: newSubcat }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating subcategory:", error);
    return NextResponse.json(
      { error: "Error al crear la subcategoría", details: error.message },
      { status: 500 }
    );
  }
}
