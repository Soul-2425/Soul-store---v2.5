import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const [profile] = await sql`
      SELECT id, nombre, apellido, nickname, email, telefono_whatsapp, rango, saldo_usdt, total_depositado_usdt
      FROM public.usuarios
      WHERE id = ${user.id}
    `;

    if (!profile) {
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
    }

    // Tasas de cambio actuales para conversiones informativas
    const [rates] = await sql`SELECT tasa_ves, tasa_mxn FROM public.tasas_cambio WHERE id = 1`;

    const saldoUsdt = Number(profile.saldo_usdt || 0);
    const tasaVes = Number(rates?.tasa_ves || 0);
    const tasaMxn = Number(rates?.tasa_mxn || 0);

    const saldoVes = tasaVes > 0 ? (saldoUsdt * tasaVes).toFixed(2) : "0.00";
    const saldoMxn = tasaMxn > 0 ? (saldoUsdt * tasaMxn).toFixed(2) : "0.00";

    // Solicitudes de depósito recientes del usuario
    const misSolicitudes = await sql`
      SELECT id, monto_reportado, moneda, monto_estimado_usdt, metodo_pago, referencia_bancaria, comprobante_url, estado, notas_admin, creado_en
      FROM public.solicitudes_deposito_revendedor
      WHERE usuario_id = ${user.id}
      ORDER BY creado_en DESC
      LIMIT 20
    `;

    // Transacciones de saldo
    const transacciones = await sql`
      SELECT id, tipo, monto_usdt, saldo_anterior, saldo_posterior, estado, notas, creado_en
      FROM public.transacciones_saldo
      WHERE usuario_id = ${user.id}
      ORDER BY creado_en DESC
      LIMIT 25
    `;

    // Clientes e IDs frecuentes
    const clientesFrecuentes = await sql`
      SELECT id, nombre_cliente, telefono_whatsapp, identificador_juego, producto_frecuente_id, variante_frecuente_id, precio_venta_final, notas
      FROM public.revendedor_clientes_fijos
      WHERE revendedor_id = ${user.id}
      ORDER BY creado_en DESC
      LIMIT 50
    `;

    // Métodos de pago activos para recargas
    const metodosPago = await sql`
      SELECT id, nombre, tipo, datos_cuenta, instrucciones, moneda, activo
      FROM public.metodos_pago
      WHERE activo = TRUE
      ORDER BY orden ASC
    `;

    return NextResponse.json({
      user: {
        ...profile,
        saldo_usdt: saldoUsdt,
        saldo_ves: saldoVes,
        saldo_mxn: saldoMxn,
      },
      rates: {
        tasa_ves: tasaVes,
        tasa_mxn: tasaMxn,
      },
      solicitudes: misSolicitudes,
      transacciones,
      clientesFrecuentes,
      metodosPago,
    });
  } catch (error: any) {
    console.error("Error al obtener billetera de revendedor:", error);
    return NextResponse.json(
      { error: "Error al cargar billetera", details: error.message },
      { status: 500 }
    );
  }
}

// POST: Reportar nueva recarga de saldo (Binance o Banco)
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      monto_reportado,
      moneda,
      metodo_pago,
      referencia_bancaria,
      comprobante_url,
    } = body;

    if (!monto_reportado || !moneda || !metodo_pago || !comprobante_url) {
      return NextResponse.json({ error: "Faltan datos obligatorios (monto, moneda, método o comprobante)" }, { status: 400 });
    }

    const numMonto = Number(monto_reportado);
    if (isNaN(numMonto) || numMonto <= 0) {
      return NextResponse.json({ error: "Monto inválido" }, { status: 400 });
    }

    // Calcular estimado en USDT
    const [rates] = await sql`SELECT tasa_ves, tasa_mxn FROM public.tasas_cambio WHERE id = 1`;
    let estimadoUsdt = numMonto;

    if (moneda === "VES" && Number(rates?.tasa_ves) > 0) {
      estimadoUsdt = Number((numMonto / Number(rates.tasa_ves)).toFixed(2));
    } else if (moneda === "MXN" && Number(rates?.tasa_mxn) > 0) {
      estimadoUsdt = Number((numMonto / Number(rates.tasa_mxn)).toFixed(2));
    }

    const [nuevaSolicitud] = await sql`
      INSERT INTO public.solicitudes_deposito_revendedor (
        usuario_id,
        monto_reportado,
        moneda,
        monto_estimado_usdt,
        metodo_pago,
        referencia_bancaria,
        comprobante_url,
        estado
      ) VALUES (
        ${user.id},
        ${numMonto},
        ${moneda},
        ${estimadoUsdt},
        ${metodo_pago},
        ${referencia_bancaria || null},
        ${comprobante_url},
        'PENDIENTE'
      )
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      solicitud: nuevaSolicitud,
      message: "Comprobante de depósito enviado exitosamente. En breve un administrador verificará tu recarga.",
    });
  } catch (error: any) {
    console.error("Error al registrar depósito de revendedor:", error);
    return NextResponse.json(
      { error: "Error al enviar solicitud", details: error.message },
      { status: 500 }
    );
  }
}
