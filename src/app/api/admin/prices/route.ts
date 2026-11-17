import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Verificar si el usuario es admin
async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return false;
  const [u] = await sql`SELECT rango FROM public.usuarios WHERE id = ${user.id}`;
  return u && u.rango === "admin";
}

// GET: Obtener catálogo completo con sus overrides de precio por rango y moneda
export async function GET() {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // 1. Categorías activas
    const categories = await sql`
      SELECT id, nombre, slug, activo, orden
      FROM public.categorias
      ORDER BY orden ASC, creado_en ASC
    `;

    // 2. Subcategorías
    const subcategories = await sql`
      SELECT id, categoria_id, nombre, slug, activo, orden
      FROM public.subcategorias
      ORDER BY orden ASC, creado_en ASC
    `;

    // 3. Productos
    const products = await sql`
      SELECT id, subcategoria_id, nombre, slug, precio_base, costo_proveedor,
             precio_ref_ves, precio_fijo_ves, precio_ref_mxn, precio_fijo_mxn, activo, orden
      FROM public.productos
      ORDER BY orden ASC, creado_en ASC
    `;

    // 4. Variantes de producto
    const variants = await sql`
      SELECT id, producto_id, nombre, sku, costo_proveedor, precio_base,
             precio_ref_ves, precio_fijo_ves, precio_ref_mxn, precio_fijo_mxn, activo, orden
      FROM public.variantes_producto
      ORDER BY orden ASC, creado_en ASC
    `;

    // 5. Todos los overrides de precios registrados
    const overrides = await sql`
      SELECT id, producto_id, variante_id, rango, precio_fijo, precio_usdt,
             precio_fijo_ves, precio_ref_ves, precio_fijo_mxn, precio_ref_mxn,
             modo_mxn, modo_ves, actualizado_en
      FROM public.precios_override
    `;

    // 6. Tasas de cambio vigentes para referencia
    const [rates] = await sql`
      SELECT tasa_ves, tasa_mxn FROM public.tasas_cambio WHERE id = 1
    `;

    return NextResponse.json({
      categories,
      subcategories,
      products,
      variants,
      overrides,
      rates: rates || { tasa_ves: 0, tasa_mxn: 0 },
    });
  } catch (error: any) {
    console.error("Error al obtener precios admin:", error);
    return NextResponse.json(
      { error: "Error al cargar precios", details: error.message },
      { status: 500 }
    );
  }
}

// POST: Guardar o actualizar en lote (batch) precios por rango y producto/variante
export async function POST(request: Request) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { items } = body; // Array de { producto_id, variante_id, rango, precio_usdt, precio_fijo_ves, precio_ref_ves, precio_fijo_mxn, precio_ref_mxn, modo_ves, modo_mxn }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No se enviaron elementos para guardar" }, { status: 400 });
    }

    let guardados = 0;

    for (const item of items) {
      const {
        producto_id,
        variante_id = null,
        rango,
        precio_usdt = null,
        precio_fijo_ves = null,
        precio_ref_ves = null,
        precio_fijo_mxn = null,
        precio_ref_mxn = null,
        modo_ves = "tasa_usdt",
        modo_mxn = "fijo",
      } = item;

      if (!rango || (!producto_id && !variante_id)) {
        continue;
      }

      // Buscar si ya existe el override para ese producto/variante y rango
      const existing = variante_id
        ? await sql`
            SELECT id FROM public.precios_override
            WHERE variante_id = ${variante_id} AND rango = ${rango}
            LIMIT 1
          `
        : await sql`
            SELECT id FROM public.precios_override
            WHERE producto_id = ${producto_id} AND variante_id IS NULL AND rango = ${rango}
            LIMIT 1
          `;

      if (existing.length > 0) {
        await sql`
          UPDATE public.precios_override
          SET 
            precio_usdt = ${precio_usdt},
            precio_fijo = ${precio_usdt},
            precio_fijo_ves = ${precio_fijo_ves},
            precio_ref_ves = ${precio_ref_ves},
            precio_fijo_mxn = ${precio_fijo_mxn},
            precio_ref_mxn = ${precio_ref_mxn},
            modo_ves = ${modo_ves},
            modo_mxn = ${modo_mxn},
            actualizado_en = NOW()
          WHERE id = ${existing[0].id}
        `;
      } else {
        await sql`
          INSERT INTO public.precios_override (
            producto_id,
            variante_id,
            rango,
            precio_fijo,
            precio_usdt,
            precio_fijo_ves,
            precio_ref_ves,
            precio_fijo_mxn,
            precio_ref_mxn,
            modo_ves,
            modo_mxn
          ) VALUES (
            ${producto_id || null},
            ${variante_id || null},
            ${rango},
            ${precio_usdt},
            ${precio_usdt},
            ${precio_fijo_ves},
            ${precio_ref_ves},
            ${precio_fijo_mxn},
            ${precio_ref_mxn},
            ${modo_ves},
            ${modo_mxn}
          )
        `;
      }
      guardados++;
    }

    return NextResponse.json({
      success: true,
      guardados,
      message: `${guardados} configuraciones de precio actualizadas correctamente.`,
    });
  } catch (error: any) {
    console.error("Error al guardar precios en lote:", error);
    return NextResponse.json(
      { error: "Error al guardar precios", details: error.message },
      { status: 500 }
    );
  }
}
