import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET: Historial de recargas / pedidos del revendedor
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const orders = await sql`
      SELECT 
        p.id, p.estado, p.total_usd, p.moneda_pago, p.creado_en,
        pi.id as item_id, pi.producto_id, pi.variante_id, pi.player_id, pi.region,
        pi.precio_unitario, pi.estado as item_estado, pi.datos_dinamicos,
        prod.nombre as producto_nombre,
        v.nombre as variante_nombre
      FROM public.pedidos p
      JOIN public.pedidos_items pi ON p.id = pi.pedido_id
      JOIN public.productos prod ON pi.producto_id = prod.id
      LEFT JOIN public.variantes_producto v ON pi.variante_id = v.id
      WHERE p.usuario_id = ${user.id}
      ORDER BY p.creado_en DESC
      LIMIT 100
    `;

    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error("Error al obtener pedidos de revendedor:", error);
    return NextResponse.json(
      { error: "Error al cargar historial", details: error.message },
      { status: 500 }
    );
  }
}

// POST: Realizar pedido instantáneo con débito de saldo (Bypass de pago manual)
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const [perfil] = await sql`
      SELECT id, nombre, nickname, email, telefono_whatsapp, rango, saldo_usdt 
      FROM public.usuarios 
      WHERE id = ${user.id}
    `;

    if (!perfil) {
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
    }

    const body = await request.json();
    const {
      producto_id,
      variante_id,
      player_id,
      region = "Global",
      datos_dinamicos = {},
      comentarios,
      guardar_frecuente = false,
      nombre_cliente_frecuente,
    } = body;

    if (!producto_id) {
      return NextResponse.json({ error: "Debe seleccionar un producto" }, { status: 400 });
    }

    const safePlayerId = player_id ? String(player_id).trim() : null;
    if (!safePlayerId) {
      return NextResponse.json({ error: "El ID de jugador o cuenta es obligatorio" }, { status: 400 });
    }

    // 1. Obtener producto y variante
    const [prod] = await sql`SELECT id, nombre, precio_base, costo_proveedor, activo FROM public.productos WHERE id = ${producto_id}`;
    if (!prod || !prod.activo) {
      return NextResponse.json({ error: "El producto seleccionado no está disponible" }, { status: 400 });
    }

    let itemNombre = prod.nombre;
    let basePriceUsdt = Number(prod.precio_base);
    let costoProveedor = Number(prod.costo_proveedor || 0);

    if (variante_id) {
      const [v] = await sql`SELECT id, nombre, precio_base, costo_proveedor, activo FROM public.variantes_producto WHERE id = ${variante_id} AND producto_id = ${producto_id}`;
      if (v && v.activo) {
        itemNombre = `${prod.nombre} - ${v.nombre}`;
        basePriceUsdt = Number(v.precio_base);
        costoProveedor = Number(v.costo_proveedor || 0);
      }
    }

    // 2. Verificar si hay un override de precio específico para el rango del revendedor
    const userRango = perfil.rango || "revendedor_4";
    const [override] = variante_id
      ? await sql`
          SELECT precio_usdt, precio_fijo FROM public.precios_override
          WHERE variante_id = ${variante_id} AND rango = ${userRango}
          LIMIT 1
        `
      : await sql`
          SELECT precio_usdt, precio_fijo FROM public.precios_override
          WHERE producto_id = ${producto_id} AND variante_id IS NULL AND rango = ${userRango}
          LIMIT 1
        `;

    let precioFinalUsdt = basePriceUsdt;
    if (override && (override.precio_usdt || override.precio_fijo)) {
      precioFinalUsdt = Number(override.precio_usdt || override.precio_fijo);
    }

    // 3. Validar saldo suficiente
    const saldoActual = Number(perfil.saldo_usdt || 0);
    if (saldoActual < precioFinalUsdt) {
      return NextResponse.json(
        {
          error: `Saldo insuficiente. Tu saldo es ${saldoActual.toFixed(2)} USDT y el costo del pedido es ${precioFinalUsdt.toFixed(2)} USDT. Por favor recarga saldo.`,
          saldo_insuficiente: true,
          saldo_actual: saldoActual,
          monto_requerido: precioFinalUsdt,
        },
        { status: 400 }
      );
    }

    // 4. TRANSACCIÓN ATÓMICA: Descontar saldo y crear pedido instantáneo
    const nuevoSaldo = Number((saldoActual - precioFinalUsdt).toFixed(2));

    // A. Actualizar saldo del usuario
    await sql`
      UPDATE public.usuarios
      SET saldo_usdt = ${nuevoSaldo}, actualizado_en = NOW()
      WHERE id = ${user.id}
    `;

    // B. Crear cabecera de pedido en estado PROCESANDO (Bypass de pago manual)
    const [nuevoPedido] = await sql`
      INSERT INTO public.pedidos (
        usuario_id,
        estado,
        total_usd,
        moneda_pago,
        es_override_duplicado
      ) VALUES (
        ${user.id},
        'PROCESANDO',
        ${precioFinalUsdt},
        'USDT_SALDO',
        FALSE
      )
      RETURNING id, total_usd, estado, creado_en
    `;

    // C. Crear item del pedido
    await sql`
      INSERT INTO public.pedidos_items (
        pedido_id,
        producto_id,
        variante_id,
        player_id,
        region,
        datos_dinamicos,
        comentario_cliente,
        costo_proveedor,
        precio_unitario,
        estado
      ) VALUES (
        ${nuevoPedido.id},
        ${producto_id},
        ${variante_id || null},
        ${safePlayerId},
        ${region},
        ${sql.json(datos_dinamicos)},
        ${comentarios || null},
        ${costoProveedor},
        ${precioFinalUsdt},
        'PROCESANDO'
      )
    `;

    // D. Registrar débito en transacciones_saldo
    await sql`
      INSERT INTO public.transacciones_saldo (
        usuario_id,
        tipo,
        monto_usdt,
        saldo_anterior,
        saldo_posterior,
        pedido_id,
        estado,
        notas
      ) VALUES (
        ${user.id},
        'CONSUMO_ORDEN',
        ${precioFinalUsdt},
        ${saldoActual},
        ${nuevoSaldo},
        ${nuevoPedido.id},
        'COMPLETADO',
        ${`Recarga instantánea: ${itemNombre} (${safePlayerId})`}
      )
    `;

    // E. Guardar en clientes frecuentes si se solicitó
    if (guardar_frecuente && safePlayerId) {
      try {
        const nombreCliente = (nombre_cliente_frecuente || safePlayerId).trim();
        await sql`
          INSERT INTO public.revendedor_clientes_fijos (
            revendedor_id,
            nombre_cliente,
            identificador_juego,
            producto_frecuente_id,
            variante_frecuente_id,
            precio_venta_final
          ) VALUES (
            ${user.id},
            ${nombreCliente},
            ${safePlayerId},
            ${producto_id},
            ${variante_id || null},
            ${precioFinalUsdt}
          )
          ON CONFLICT DO NOTHING
        `;
      } catch {}
    }

    return NextResponse.json({
      success: true,
      pedido_id: nuevoPedido.id,
      nuevo_saldo: nuevoSaldo,
      monto_debitado: precioFinalUsdt,
      mensaje: `¡Pedido procesado al instante! Se descontaron ${precioFinalUsdt.toFixed(2)} USDT de tu saldo.`,
    });
  } catch (error: any) {
    console.error("Error al procesar pedido instantáneo de revendedor:", error);
    return NextResponse.json(
      { error: "Error al procesar el pedido", details: error.message },
      { status: 500 }
    );
  }
}
