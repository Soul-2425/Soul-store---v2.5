import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      producto_id,
      variante_id,
      player_id,
      region,
      comentarios,
      comentarios_adicionales,
      moneda_pago,
      moneda,
      cliente_nombre,
      nombre_cliente,
      cliente_whatsapp,
      whatsapp_cliente,
      cliente_email,
      email_cliente,
      es_override_duplicado,
      override_duplicado,
      metodo_pago_id,
      metodo_pago_nombre,
      comprobante_url,
      referencia_pago,
    } = body;

    const safeMoneda = moneda_pago || moneda || "USD";
    const safeNombre = (cliente_nombre || nombre_cliente || "").trim();
    const safeWhatsapp = (cliente_whatsapp || whatsapp_cliente || "").trim();
    const safeEmail = (cliente_email || email_cliente ? (cliente_email || email_cliente).trim() : null);
    const safePlayerId = player_id ? player_id.trim() : null;
    const safeRegion = region ? region.trim() : "Global";
    const safeComentarios = (comentarios || comentarios_adicionales ? (comentarios || comentarios_adicionales).trim() : null);
    const safeOverride = Boolean(es_override_duplicado || override_duplicado || false);
    const safeVarianteId = variante_id ? String(variante_id).trim() : null;
    const safeMetodoPagoId = metodo_pago_id ? String(metodo_pago_id).trim() : null;
    const safeMetodoPagoNombre = metodo_pago_nombre ? String(metodo_pago_nombre).trim() : null;
    const safeComprobanteUrl = comprobante_url ? String(comprobante_url).trim() : null;
    const safeReferenciaPago = referencia_pago ? String(referencia_pago).trim() : null;

    if (!producto_id) {
      return NextResponse.json({ error: "El producto es obligatorio." }, { status: 400 });
    }

    if (!safeNombre || !safeWhatsapp) {
      return NextResponse.json(
        { error: "Nombre y WhatsApp son obligatorios para el despacho." },
        { status: 400 }
      );
    }

    // 1. Obtener producto y validar existencia
    const [producto] = await sql`
      SELECT id, nombre, precio_base, costo_proveedor, activo, oferta_especial,
             precio_ref_ves, precio_fijo_ves, precio_ref_mxn, precio_fijo_mxn
      FROM public.productos
      WHERE id = ${producto_id}
    `;

    if (!producto || !producto.activo) {
      return NextResponse.json(
        { error: "El producto seleccionado no está disponible." },
        { status: 404 }
      );
    }

    // 1.1 Si viene variante_id, validar variante y usar sus precios
    let finalPrecioBase = Number(producto.precio_base);
    let finalCostoProveedor = Number(producto.costo_proveedor);
    let finalPrecioRefVes = producto.precio_ref_ves ? Number(producto.precio_ref_ves) : null;
    let finalPrecioFijoVes = producto.precio_fijo_ves ? Number(producto.precio_fijo_ves) : null;
    let finalPrecioRefMxn = producto.precio_ref_mxn ? Number(producto.precio_ref_mxn) : null;
    let finalPrecioFijoMxn = producto.precio_fijo_mxn ? Number(producto.precio_fijo_mxn) : null;
    let safeSku: string | null = null;
    let variantName: string | null = null;

    if (safeVarianteId) {
      const [variante] = await sql`
        SELECT id, nombre, sku, costo_proveedor, precio_base, activo,
               precio_ref_ves, precio_fijo_ves, precio_ref_mxn, precio_fijo_mxn
        FROM public.variantes_producto
        WHERE id = ${safeVarianteId} AND producto_id = ${producto_id}
      `;
      if (variante && variante.activo) {
        finalPrecioBase = Number(variante.precio_base);
        finalCostoProveedor = Number(variante.costo_proveedor || 0);
        if (variante.precio_ref_ves) finalPrecioRefVes = Number(variante.precio_ref_ves);
        if (variante.precio_fijo_ves) finalPrecioFijoVes = Number(variante.precio_fijo_ves);
        if (variante.precio_ref_mxn) finalPrecioRefMxn = Number(variante.precio_ref_mxn);
        if (variante.precio_fijo_mxn) finalPrecioFijoMxn = Number(variante.precio_fijo_mxn);
        safeSku = variante.sku || null;
        variantName = variante.nombre || null;
      }
    }

    // 2. Prevención de Duplicados (<15 min)
    if (safePlayerId && !safeOverride) {
      const recentDuplicates = await sql`
        SELECT pi.id, pi.creado_en
        FROM public.pedidos_items pi
        JOIN public.pedidos ped ON pi.pedido_id = ped.id
        WHERE pi.player_id = ${safePlayerId}
          AND pi.producto_id = ${producto_id}
          AND ped.estado != 'CANCELADO'
          AND pi.creado_en >= NOW() - INTERVAL '15 minutes'
        LIMIT 1
      `;

      if (recentDuplicates.length > 0) {
        return NextResponse.json(
          {
            error: "DUPLICATE_DETECTED",
            message:
              "Se detectó un pedido reciente (<15 min) para este mismo ID. Debes marcar la confirmación de Override para continuar.",
          },
          { status: 409 }
        );
      }
    }

    // 3. Determinar usuario asociado al pedido
    let finalUserId: string | null = null;
    let userRank = "cliente_4";

    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        finalUserId = user.id;
        const [u] = await sql`SELECT rango FROM public.usuarios WHERE id = ${user.id}`;
        if (u?.rango) userRank = u.rango;
      }
    } catch {
      // Sin sesión activa
    }

    if (!finalUserId) {
      // Buscar usuario existente por email o whatsapp
      const [existingUser] = await sql`
        SELECT id, rango FROM public.usuarios 
        WHERE (${safeEmail}::varchar IS NOT NULL AND email = ${safeEmail})
           OR (telefono_whatsapp = ${safeWhatsapp})
        LIMIT 1
      `;

      if (existingUser) {
        finalUserId = existingUser.id;
        if (existingUser.rango) userRank = existingUser.rango;
      } else {
        const guestEmail = safeEmail || `guest_${Date.now()}@soulstore.internal`;
        const guestId = (await sql`SELECT gen_random_uuid() as id`)[0].id;
        const guestNick = `guest_${safeNombre.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8)}_${guestId.slice(0, 4)}`;

        const userMeta = {
          nombre: safeNombre,
          telefono_whatsapp: safeWhatsapp,
          nickname: guestNick,
          rango: "cliente_4"
        };

        await sql`
          INSERT INTO auth.users (id, email, raw_user_meta_data)
          VALUES (
            ${guestId}::uuid,
            ${guestEmail}::varchar,
            ${sql.json(userMeta)}
          )
        `;

        const [createdGuest] = await sql`
          INSERT INTO public.usuarios (id, nombre, nickname, email, telefono_whatsapp, rango, auth_provider)
          VALUES (
            ${guestId}::uuid, 
            ${safeNombre}, 
            ${guestNick}, 
            ${guestEmail}, 
            ${safeWhatsapp}, 
            'cliente_4', 
            'guest'
          )
          ON CONFLICT (id) DO UPDATE SET telefono_whatsapp = EXCLUDED.telefono_whatsapp
          RETURNING id, rango
        `;
        finalUserId = createdGuest.id;
        userRank = createdGuest.rango || "cliente_4";
      }
    }

    // 3.1 Verificar Override de Precio por Rango (si existe)
    if (safeVarianteId) {
      const [vOverride] = await sql`
        SELECT precio_fijo FROM public.precios_override
        WHERE variante_id = ${safeVarianteId} AND rango = ${userRank}
        LIMIT 1
      `;
      if (vOverride && Number(vOverride.precio_fijo) > 0) {
        finalPrecioBase = Number(vOverride.precio_fijo);
      }
    } else {
      const [pOverride] = await sql`
        SELECT precio_fijo FROM public.precios_override
        WHERE producto_id = ${producto_id} AND rango = ${userRank}
        LIMIT 1
      `;
      if (pOverride && Number(pOverride.precio_fijo) > 0) {
        finalPrecioBase = Number(pOverride.precio_fijo);
      }
    }

    // 4. Calcular precio según tasas y moneda seleccionada
    const [tasas] = await sql`SELECT tasa_ves, tasa_mxn FROM public.tasas_cambio WHERE id = 1`;
    const precioUsd = finalPrecioBase;

    let totalVes: number | null = null;
    let totalMxn: number | null = null;
    let tasaAplicada: number | null = null;

    if (safeMoneda === "VES") {
      const rate = Number(tasas?.tasa_ves || 0);
      tasaAplicada = rate;
      if (finalPrecioFijoVes && finalPrecioFijoVes > 0) {
        totalVes = Number(finalPrecioFijoVes.toFixed(2));
      } else if (finalPrecioRefVes && finalPrecioRefVes > 0) {
        totalVes = Number((finalPrecioRefVes * rate).toFixed(2));
      } else {
        totalVes = Number((precioUsd * rate).toFixed(2));
      }
    } else if (safeMoneda === "MXN") {
      const rate = Number(tasas?.tasa_mxn || 0);
      tasaAplicada = rate;
      if (finalPrecioFijoMxn && finalPrecioFijoMxn > 0) {
        totalMxn = Number(finalPrecioFijoMxn.toFixed(2));
      } else if (finalPrecioRefMxn && finalPrecioRefMxn > 0) {
        totalMxn = Number((finalPrecioRefMxn * rate).toFixed(2));
      } else {
        totalMxn = Number((precioUsd * rate).toFixed(2));
      }
    }

    // 5. Insertar Pedido Maestro
    const [pedido] = await sql`
      INSERT INTO public.pedidos (
        usuario_id,
        estado,
        total_usd,
        total_ves,
        total_mxn,
        moneda_pago,
        tasa_cambio,
        es_override_duplicado,
        metodo_pago_id,
        metodo_pago_nombre,
        comprobante_url,
        referencia_pago
      )
      VALUES (
        ${finalUserId}::uuid,
        'PENDIENTE',
        ${precioUsd}::numeric,
        ${totalVes}::numeric,
        ${totalMxn}::numeric,
        ${safeMoneda}::varchar,
        ${tasaAplicada}::numeric,
        ${safeOverride}::boolean,
        ${safeMetodoPagoId ? safeMetodoPagoId : null}::uuid,
        ${safeMetodoPagoNombre}::varchar,
        ${safeComprobanteUrl}::text,
        ${safeReferenciaPago}::varchar
      )
      RETURNING *
    `;

    // 6. Insertar Detalle / Sub-orden en pedidos_items
    const datosDinamicos = {
      region: safeRegion,
      cliente_nombre: safeNombre,
      cliente_whatsapp: safeWhatsapp,
      cliente_email: safeEmail,
      variante_nombre: variantName,
    };

    const [item] = await sql`
      INSERT INTO public.pedidos_items (
        pedido_id,
        producto_id,
        variante_id,
        sku,
        player_id,
        region,
        datos_dinamicos,
        comentario_cliente,
        costo_proveedor,
        precio_unitario,
        estado
      )
      VALUES (
        ${pedido.id}::uuid,
        ${producto_id}::uuid,
        ${safeVarianteId ? safeVarianteId : null}::uuid,
        ${safeSku}::varchar,
        ${safePlayerId}::varchar,
        ${safeRegion}::varchar,
        ${sql.json(datosDinamicos)},
        ${safeComentarios}::text,
        ${finalCostoProveedor}::numeric,
        ${precioUsd}::numeric,
        'EN_COLA'
      )
      RETURNING *
    `;

    return NextResponse.json(
      {
        success: true,
        orderId: pedido.id,
        orderNumber: `SOUL-${pedido.id.slice(0, 8).toUpperCase()}`,
        status: pedido.estado,
        totalUsd: precioUsd,
        totalLocal: moneda_pago === "VES" ? totalVes : moneda_pago === "MXN" ? totalMxn : precioUsd,
        moneda: moneda_pago,
        message: "¡Pedido registrado con éxito! Tu recarga ha entrado a la cola de despacho.",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Error al procesar el pedido", details: error.message },
      { status: 500 }
    );
  }
}
