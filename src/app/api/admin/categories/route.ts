import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, slug, imagen_url, activo } = body;

    if (!nombre) {
      return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
    }

    const finalSlug =
      slug ||
      nombre
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

    const [newCategory] = await sql`
      INSERT INTO public.categorias (nombre, slug, imagen_url, activo)
      VALUES (
        ${nombre}, 
        ${finalSlug}, 
        ${imagen_url || null}, 
        ${activo !== undefined ? activo : true}
      )
      RETURNING *
    `;

    // Por conveniencia para agregar productos de inmediato, crear una subcategoría general por defecto
    await sql`
      INSERT INTO public.subcategorias (categoria_id, nombre, slug, activo)
      VALUES (${newCategory.id}, ${nombre}, ${finalSlug}, TRUE)
      ON CONFLICT (slug) DO NOTHING
    `;

    return NextResponse.json({ category: newCategory }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Error al crear la categoría", details: error.message },
      { status: 500 }
    );
  }
}
