import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      categoria,     // { id?: string, nombre?: string, imagen_url?: string }
      subcategoria,  // { id?: string, nombre?: string, imagen_url?: string }
      producto,      // { nombre, descripcion, precio_base, costo_proveedor, imagen_url, activo, oferta_especial }
      subproductos,  // Array of { nombre, precio_base, costo_proveedor, imagen_url }
    } = body;

    if (!producto || !producto.nombre?.trim()) {
      return NextResponse.json({ error: "El nombre del producto es obligatorio" }, { status: 400 });
    }

    // ==========================================
    // 1. RESOLVER O CREAR CATEGORÍA
    // ==========================================
    let categoryId = categoria?.id;
    let categoryName = categoria?.nombre?.trim();

    if (!categoryId) {
      if (!categoryName) {
        return NextResponse.json({ error: "Debes seleccionar o crear una categoría" }, { status: 400 });
      }

      const catSlug = `${categoryName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")}-${Date.now().toString().slice(-4)}`;

      const [newCat] = await sql`
        INSERT INTO public.categorias (nombre, slug, imagen_url, activo)
        VALUES (${categoryName}, ${catSlug}, ${categoria.imagen_url || null}, TRUE)
        RETURNING id, nombre, slug, imagen_url
      `;
      categoryId = newCat.id;
      categoryName = newCat.nombre;
    }

    // ==========================================
    // 2. RESOLVER O CREAR SUBCATEGORÍA
    // ==========================================
    let subcategoryId = subcategoria?.id;
    let subcategoryName = subcategoria?.nombre?.trim();

    if (!subcategoryId) {
      const finalSubName = subcategoryName || categoryName || "General";
      const subSlug = `${finalSubName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")}-${Date.now().toString().slice(-4)}`;

      const [newSub] = await sql`
        INSERT INTO public.subcategorias (categoria_id, nombre, slug, imagen_url, activo)
        VALUES (${categoryId}, ${finalSubName}, ${subSlug}, ${subcategoria?.imagen_url || null}, TRUE)
        RETURNING id, nombre, slug, imagen_url
      `;
      subcategoryId = newSub.id;
      subcategoryName = newSub.nombre;
    }

    // ==========================================
    // 3. CREAR PRODUCTO
    // ==========================================
    const prodSlug = `${producto.nombre
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "")}-${Date.now().toString().slice(-4)}`;

    let finalBasePrice = parseFloat(producto.precio_base) || 0;
    let finalBaseCost = parseFloat(producto.costo_proveedor) || 0;

    if (finalBasePrice === 0 && Array.isArray(subproductos) && subproductos.length > 0) {
      const validSubPrices = subproductos
        .map((sp: any) => parseFloat(sp.precio_base))
        .filter((p: number) => !isNaN(p) && p > 0);
      if (validSubPrices.length > 0) {
        finalBasePrice = Math.min(...validSubPrices);
      }

      const validSubCosts = subproductos
        .map((sp: any) => parseFloat(sp.costo_proveedor))
        .filter((c: number) => !isNaN(c) && c > 0);
      if (validSubCosts.length > 0) {
        finalBaseCost = Math.min(...validSubCosts);
      }
    }

    const [newProduct] = await sql`
      INSERT INTO public.productos (
        subcategoria_id,
        nombre,
        slug,
        descripcion,
        imagen_url,
        imagen_oferta_url,
        precio_base,
        costo_proveedor,
        precio_ref_ves,
        precio_fijo_ves,
        precio_ref_mxn,
        precio_fijo_mxn,
        activo,
        oferta_especial
      )
      VALUES (
        ${subcategoryId},
        ${producto.nombre.trim()},
        ${prodSlug},
        ${producto.descripcion?.trim() || null},
        ${producto.imagen_url || null},
        ${producto.imagen_oferta_url || null},
        ${finalBasePrice},
        ${finalBaseCost},
        ${parseFloat(producto.precio_ref_ves) || null},
        ${parseFloat(producto.precio_fijo_ves) || null},
        ${parseFloat(producto.precio_ref_mxn) || null},
        ${parseFloat(producto.precio_fijo_mxn) || null},
        ${producto.activo !== undefined ? producto.activo : true},
        ${producto.oferta_especial !== undefined ? producto.oferta_especial : false}
      )
      RETURNING *
    `;

    // ==========================================
    // 3.1 GUARDAR OVERRIDES POR RANGO (OPCIONAL)
    // ==========================================
    if (Array.isArray(body.overrides) && body.overrides.length > 0) {
      for (const ov of body.overrides) {
        if (ov && ov.rango && ov.precio_fijo !== undefined && ov.precio_fijo !== null && ov.precio_fijo !== "") {
          const val = parseFloat(ov.precio_fijo);
          if (!isNaN(val) && val >= 0) {
            await sql`
              INSERT INTO public.precios_override (producto_id, rango, precio_fijo, actualizado_en)
              VALUES (${newProduct.id}, ${ov.rango}, ${val}, NOW())
              ON CONFLICT (producto_id, rango) WHERE producto_id IS NOT NULL
              DO UPDATE SET precio_fijo = EXCLUDED.precio_fijo, actualizado_en = NOW()
            `;
          }
        }
      }
    }

    // ==========================================
    // 4. CREAR SUBPRODUCTOS / VARIANTES (OPCIONAL)
    // ==========================================
    const createdVariants = [];
    if (Array.isArray(subproductos) && subproductos.length > 0) {
      for (let i = 0; i < subproductos.length; i++) {
        const item = subproductos[i];
        if (item && item.nombre && item.nombre.trim()) {
          const [variant] = await sql`
            INSERT INTO public.variantes_producto (
              producto_id,
              nombre,
              precio_base,
              costo_proveedor,
              precio_ref_ves,
              precio_fijo_ves,
              precio_ref_mxn,
              precio_fijo_mxn,
              imagen_url,
              activo,
              orden
            )
            VALUES (
              ${newProduct.id},
              ${item.nombre.trim()},
              ${parseFloat(item.precio_base) || parseFloat(producto.precio_base) || 0},
              ${parseFloat(item.costo_proveedor) || parseFloat(producto.costo_proveedor) || 0},
              ${parseFloat(item.precio_ref_ves) || null},
              ${parseFloat(item.precio_fijo_ves) || null},
              ${parseFloat(item.precio_ref_mxn) || null},
              ${parseFloat(item.precio_fijo_mxn) || null},
              ${item.imagen_url || producto.imagen_url || null},
              TRUE,
              ${i}
            )
            RETURNING *
          `;
          createdVariants.push(variant);
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        product: newProduct,
        categoryId,
        subcategoryId,
        variants: createdVariants,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error in unified catalog item creation:", error);
    return NextResponse.json(
      { error: "Error al registrar ítem en catálogo", details: error.message },
      { status: 500 }
    );
  }
}
