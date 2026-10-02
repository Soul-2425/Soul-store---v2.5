import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import StorefrontClient from "@/components/StorefrontClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let categories: any[] = [];
  let subcategories: any[] = [];
  let products: any[] = [];
  let variants: any[] = [];
  let tasaVes = 0;
  let tasaMxn = 0;
  let initialUser = null;

  try {
    // 1. Obtener sesión del usuario solo si hay cookies de Supabase
    const cookieStore = await cookies();
    const hasAuthCookie = cookieStore.getAll().some((c) => c.name.startsWith("sb-"));

    if (hasAuthCookie) {
      try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const [profile] = await sql`
            SELECT id, nombre, apellido, nickname, email, rango, auth_provider
            FROM public.usuarios
            WHERE id = ${user.id}
          `;

          if (profile) {
            initialUser = {
              id: String(profile.id),
              nombre: profile.nombre ? String(profile.nombre) : undefined,
              apellido: profile.apellido ? String(profile.apellido) : undefined,
              nickname: String(profile.nickname || "Usuario"),
              email: String(profile.email || ""),
              rango: String(profile.rango || "cliente_4"),
            };
          } else {
            initialUser = {
              id: user.id,
              email: user.email || "",
              nickname: user.user_metadata?.nickname || "Usuario",
              rango: user.user_metadata?.rango || "cliente_4",
            };
          }
        }
      } catch (authErr) {
        console.error("Error al validar sesión Supabase:", authErr);
      }
    }

    // 2. Catálogo público
    categories = await sql`
      SELECT id, nombre, slug, imagen_url 
      FROM public.categorias 
      WHERE activo = TRUE 
      ORDER BY orden ASC, creado_en DESC
    `;

    subcategories = await sql`
      SELECT id, categoria_id, nombre, slug, imagen_url, activo, orden
      FROM public.subcategorias
      WHERE activo = TRUE
      ORDER BY orden ASC, creado_en DESC
    `;

    products = await sql`
      SELECT p.id, p.nombre, p.slug, p.descripcion, p.imagen_url, p.imagen_oferta_url,
             p.precio_base, p.costo_proveedor, p.oferta_especial, 
             p.precio_ref_ves, p.precio_fijo_ves, p.precio_ref_mxn, p.precio_fijo_mxn,
             COALESCE(c.nombre, 'General') as categoria_nombre, 
             COALESCE(c.id, s.categoria_id) as categoria_id,
             COALESCE(s.nombre, 'General') as subcategoria_nombre,
             s.id as subcategoria_id
      FROM public.productos p
      LEFT JOIN public.subcategorias s ON p.subcategoria_id = s.id
      LEFT JOIN public.categorias c ON s.categoria_id = c.id
      WHERE p.activo = TRUE AND (c.activo = TRUE OR c.activo IS NULL OR p.oferta_especial = TRUE)
      ORDER BY p.orden ASC, p.creado_en DESC
    `;

    variants = await sql`
      SELECT id, producto_id, nombre, sku, costo_proveedor, precio_base, activo, imagen_url, orden,
             precio_ref_ves, precio_fijo_ves, precio_ref_mxn, precio_fijo_mxn
      FROM public.variantes_producto
      WHERE activo = TRUE
      ORDER BY orden ASC, creado_en ASC
    `;

    // 3. Tasas de cambio
    const [tasas] = await sql`SELECT tasa_ves, tasa_mxn FROM public.tasas_cambio WHERE id = 1`;
    if (tasas) {
      tasaVes = Number(tasas.tasa_ves || 0);
      tasaMxn = Number(tasas.tasa_mxn || 0);
    }
  } catch (error) {
    console.error("Error al consultar catálogo o usuario público:", error);
  }

  return (
    <StorefrontClient
      categories={categories}
      subcategories={subcategories || []}
      products={products}
      variants={variants || []}
      tasaVes={tasaVes}
      tasaMxn={tasaMxn}
      initialUser={initialUser}
    />
  );
}
