import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nombre, imagen_url, activo } = body;

    const [existing] = await sql`SELECT * FROM public.subcategorias WHERE id = ${id}`;
    if (!existing) {
      return NextResponse.json({ error: "Subcategoría no encontrada" }, { status: 404 });
    }

    const updatedNombre = nombre !== undefined ? nombre : existing.nombre;
    const updatedImagen = imagen_url !== undefined ? imagen_url : existing.imagen_url;
    const updatedActivo = activo !== undefined ? activo : existing.activo;

    const [updated] = await sql`
      UPDATE public.subcategorias
      SET 
        nombre = ${updatedNombre},
        imagen_url = ${updatedImagen},
        activo = ${updatedActivo}
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json({ subcategory: updated });
  } catch (error: any) {
    console.error("Error updating subcategory:", error);
    return NextResponse.json(
      { error: "Error al actualizar subcategoría", details: error.message },
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
      DELETE FROM public.subcategorias
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true, message: "Subcategoría eliminada con éxito" });
  } catch (error: any) {
    console.error("Error deleting subcategory:", error);
    return NextResponse.json(
      { error: "Error al eliminar la subcategoría", details: error.message },
      { status: 500 }
    );
  }
}
