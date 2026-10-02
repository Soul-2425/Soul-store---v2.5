import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { fetchBinanceP2PRate } from "@/lib/binance";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return handleSync(request);
}

export async function POST(request: Request) {
  return handleSync(request);
}

function getPayTypes(method?: string | null, fiat?: "VES" | "MXN"): string[] {
  if (!method || method === "ALL") return [];
  if (fiat === "VES") {
    if (method === "Banesco_PagoMovil") return ["BANESCO", "PagoMovil"];
    return [method];
  }
  if (fiat === "MXN") {
    return [method];
  }
  return [method];
}

async function handleSync(request: Request) {
  try {
    const url = new URL(request.url);
    const force = url.searchParams.get("force") === "true";

    // Intentar leer overrides del body si se envió un POST desde el panel admin
    let bodyOverrides: any = null;
    if (request.method === "POST") {
      try {
        bodyOverrides = await request.json();
      } catch {
        // Sin body JSON, usar valores almacenados
      }
    }

    // Obtener configuración actual de la base de datos
    const [current] = await sql`
      SELECT 
        id, 
        tasa_ves, 
        tasa_mxn, 
        modo_automatico, 
        ultima_actualizacion,
        intervalo_minutos,
        -- VES
        filtro_monto_ves,
        metodo_pago_ves,
        cant_ofertas_ves,
        margen_spread_ves,
        tipo_operacion_ves,
        solo_verificados_ves,
        tiempo_pago_ves,
        pais_ves,
        solo_trading_ves,
        solo_pro_ves,
        sin_verif_ves,
        -- MXN
        filtro_monto_mxn,
        metodo_pago_mxn,
        cant_ofertas_mxn,
        margen_spread_mxn,
        tipo_operacion_mxn,
        solo_verificados_mxn,
        tiempo_pago_mxn,
        pais_mxn,
        solo_trading_mxn,
        solo_pro_mxn,
        sin_verif_mxn
      FROM public.tasas_cambio
      WHERE id = 1
    `;

    if (!current) {
      return NextResponse.json(
        { error: "No se encontró registro de tasas de cambio" },
        { status: 404 }
      );
    }

    // 1. Configuración Intervalo
    const intervaloMinutos = bodyOverrides?.intervalo_minutos !== undefined
      ? Number(bodyOverrides.intervalo_minutos)
      : Number(current.intervalo_minutos || 15);

    // 2. Parámetros independientes para VES (Venezuela)
    const filtroVes = bodyOverrides?.filtro_monto_ves !== undefined 
      ? Number(bodyOverrides.filtro_monto_ves) 
      : Number(current.filtro_monto_ves || 1000);

    const metodoVes = bodyOverrides?.metodo_pago_ves !== undefined 
      ? String(bodyOverrides.metodo_pago_ves) 
      : (current.metodo_pago_ves || "ALL");

    const cantVes = bodyOverrides?.cant_ofertas_ves !== undefined 
      ? Number(bodyOverrides.cant_ofertas_ves) 
      : Number(current.cant_ofertas_ves || 10);

    const margenVes = bodyOverrides?.margen_spread_ves !== undefined 
      ? Number(bodyOverrides.margen_spread_ves) 
      : Number(current.margen_spread_ves || 0);

    const tipoVes = bodyOverrides?.tipo_operacion_ves 
      ? String(bodyOverrides.tipo_operacion_ves).toUpperCase() 
      : (current.tipo_operacion_ves || "BUY");

    const soloVerifVes = bodyOverrides?.solo_verificados_ves !== undefined
      ? Boolean(bodyOverrides.solo_verificados_ves)
      : (current.solo_verificados_ves !== undefined ? Boolean(current.solo_verificados_ves) : true);

    const tiempoPagoVes = bodyOverrides?.tiempo_pago_ves !== undefined
      ? Number(bodyOverrides.tiempo_pago_ves)
      : Number(current.tiempo_pago_ves || 0);

    const paisVes = bodyOverrides?.pais_ves !== undefined
      ? String(bodyOverrides.pais_ves)
      : (current.pais_ves || "ALL");

    const soloTradingVes = bodyOverrides?.solo_trading_ves !== undefined
      ? Boolean(bodyOverrides.solo_trading_ves)
      : (current.solo_trading_ves !== undefined ? Boolean(current.solo_trading_ves) : true);

    const soloProVes = bodyOverrides?.solo_pro_ves !== undefined
      ? Boolean(bodyOverrides.solo_pro_ves)
      : Boolean(current.solo_pro_ves);

    const sinVerifVes = bodyOverrides?.sin_verif_ves !== undefined
      ? Boolean(bodyOverrides.sin_verif_ves)
      : Boolean(current.sin_verif_ves);

    // 3. Parámetros independientes para MXN (México)
    const filtroMxn = bodyOverrides?.filtro_monto_mxn !== undefined 
      ? Number(bodyOverrides.filtro_monto_mxn) 
      : Number(current.filtro_monto_mxn || 200);

    const metodoMxn = bodyOverrides?.metodo_pago_mxn !== undefined 
      ? String(bodyOverrides.metodo_pago_mxn) 
      : (current.metodo_pago_mxn || "ALL");

    const cantMxn = bodyOverrides?.cant_ofertas_mxn !== undefined 
      ? Number(bodyOverrides.cant_ofertas_mxn) 
      : Number(current.cant_ofertas_mxn || 10);

    const margenMxn = bodyOverrides?.margen_spread_mxn !== undefined 
      ? Number(bodyOverrides.margen_spread_mxn) 
      : Number(current.margen_spread_mxn || 0);

    const tipoMxn = bodyOverrides?.tipo_operacion_mxn 
      ? String(bodyOverrides.tipo_operacion_mxn).toUpperCase() 
      : (current.tipo_operacion_mxn || "BUY");

    const soloVerifMxn = bodyOverrides?.solo_verificados_mxn !== undefined
      ? Boolean(bodyOverrides.solo_verificados_mxn)
      : (current.solo_verificados_mxn !== undefined ? Boolean(current.solo_verificados_mxn) : true);

    const tiempoPagoMxn = bodyOverrides?.tiempo_pago_mxn !== undefined
      ? Number(bodyOverrides.tiempo_pago_mxn)
      : Number(current.tiempo_pago_mxn || 0);

    const paisMxn = bodyOverrides?.pais_mxn !== undefined
      ? String(bodyOverrides.pais_mxn)
      : (current.pais_mxn || "ALL");

    const soloTradingMxn = bodyOverrides?.solo_trading_mxn !== undefined
      ? Boolean(bodyOverrides.solo_trading_mxn)
      : (current.solo_trading_mxn !== undefined ? Boolean(current.solo_trading_mxn) : true);

    const soloProMxn = bodyOverrides?.solo_pro_mxn !== undefined
      ? Boolean(bodyOverrides.solo_pro_mxn)
      : Boolean(current.solo_pro_mxn);

    const sinVerifMxn = bodyOverrides?.sin_verif_mxn !== undefined
      ? Boolean(bodyOverrides.sin_verif_mxn)
      : Boolean(current.sin_verif_mxn);

    if (!current.modo_automatico && !force) {
      return NextResponse.json({
        success: true,
        updated: false,
        message: "Modo automático desactivado por el Administrador (Suiche Manual Activo).",
        tasa_ves: Number(current.tasa_ves),
        tasa_mxn: Number(current.tasa_mxn),
        modo_automatico: false,
        ultima_actualizacion: current.ultima_actualizacion,
        intervalo_minutos: intervaloMinutos,
        filtros: {
          ves: {
            monto: filtroVes,
            metodo_pago: metodoVes,
            cant_ofertas: cantVes,
            spread: margenVes,
            tipo: tipoVes,
            solo_verificados: soloVerifVes,
            tiempo_pago: tiempoPagoVes,
            pais: paisVes,
            solo_trading: soloTradingVes,
            solo_pro: soloProVes,
            sin_verif: sinVerifVes,
          },
          mxn: {
            monto: filtroMxn,
            metodo_pago: metodoMxn,
            cant_ofertas: cantMxn,
            spread: margenMxn,
            tipo: tipoMxn,
            solo_verificados: soloVerifMxn,
            tiempo_pago: tiempoPagoMxn,
            pais: paisMxn,
            solo_trading: soloTradingMxn,
            solo_pro: soloProMxn,
            sin_verif: sinVerifMxn,
          },
        },
      });
    }

    // Consultar tasas en paralelo usando los filtros independientes de cada moneda
    const [vesResult, mxnResult] = await Promise.all([
      fetchBinanceP2PRate({
        fiat: "VES",
        transAmount: filtroVes,
        rows: cantVes,
        tradeType: (tipoVes as any) || "BUY",
        spreadPercent: margenVes,
        payTypes: getPayTypes(metodoVes, "VES"),
        soloVerificados: soloVerifVes,
        tiempoPago: tiempoPagoVes,
        pais: paisVes,
        soloTrading: soloTradingVes,
        soloPro: soloProVes,
        sinVerif: sinVerifVes,
      }),
      fetchBinanceP2PRate({
        fiat: "MXN",
        transAmount: filtroMxn,
        rows: cantMxn,
        tradeType: (tipoMxn as any) || "BUY",
        spreadPercent: margenMxn,
        payTypes: getPayTypes(metodoMxn, "MXN"),
        soloVerificados: soloVerifMxn,
        tiempoPago: tiempoPagoMxn,
        pais: paisMxn,
        soloTrading: soloTradingMxn,
        soloPro: soloProMxn,
        sinVerif: sinVerifMxn,
      }),
    ]);

    const finalVes = vesResult ? vesResult.rate : Number(current.tasa_ves);
    const finalMxn = mxnResult ? mxnResult.rate : Number(current.tasa_mxn);

    // Actualizar en base de datos las tasas y los parámetros independientes
    await sql`
      UPDATE public.tasas_cambio
      SET 
        tasa_ves = ${finalVes},
        tasa_mxn = ${finalMxn},
        intervalo_minutos = ${intervaloMinutos},
        filtro_monto_ves = ${filtroVes},
        metodo_pago_ves = ${metodoVes},
        cant_ofertas_ves = ${cantVes},
        margen_spread_ves = ${margenVes},
        tipo_operacion_ves = ${tipoVes},
        solo_verificados_ves = ${soloVerifVes},
        tiempo_pago_ves = ${tiempoPagoVes},
        pais_ves = ${paisVes},
        solo_trading_ves = ${soloTradingVes},
        solo_pro_ves = ${soloProVes},
        sin_verif_ves = ${sinVerifVes},
        filtro_monto_mxn = ${filtroMxn},
        metodo_pago_mxn = ${metodoMxn},
        cant_ofertas_mxn = ${cantMxn},
        margen_spread_mxn = ${margenMxn},
        tipo_operacion_mxn = ${tipoMxn},
        solo_verificados_mxn = ${soloVerifMxn},
        tiempo_pago_mxn = ${tiempoPagoMxn},
        pais_mxn = ${paisMxn},
        solo_trading_mxn = ${soloTradingMxn},
        solo_pro_mxn = ${soloProMxn},
        sin_verif_mxn = ${sinVerifMxn},
        ultima_actualizacion = NOW()
      WHERE id = 1
    `;

    return NextResponse.json({
      success: true,
      updated: true,
      message: "Tasas calculadas y sincronizadas exitosamente con Binance P2P (algoritmos independientes).",
      tasa_ves: finalVes,
      tasa_mxn: finalMxn,
      raw_ves: vesResult?.rawAverage ?? finalVes,
      raw_mxn: mxnResult?.rawAverage ?? finalMxn,
      modo_automatico: current.modo_automatico,
      intervalo_minutos: intervaloMinutos,
      filtros_usados: {
        ves: {
          monto: filtroVes,
          metodo_pago: metodoVes,
          cant_ofertas: cantVes,
          spread: margenVes,
          tipo: tipoVes,
          solo_verificados: soloVerifVes,
          tiempo_pago: tiempoPagoVes,
          pais: paisVes,
          solo_trading: soloTradingVes,
          solo_pro: soloProVes,
          sin_verif: sinVerifVes,
        },
        mxn: {
          monto: filtroMxn,
          metodo_pago: metodoMxn,
          cant_ofertas: cantMxn,
          spread: margenMxn,
          tipo: tipoMxn,
          solo_verificados: soloVerifMxn,
          tiempo_pago: tiempoPagoMxn,
          pais: paisMxn,
          solo_trading: soloTradingMxn,
          solo_pro: soloProMxn,
          sin_verif: sinVerifMxn,
        },
      },
      muestras_ofertas: {
        ves: vesResult?.sampleOffers || [],
        mxn: mxnResult?.sampleOffers || [],
      },
      fuente: "Binance P2P",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error en sincronización P2P cron:", error);
    return NextResponse.json(
      { error: "Error al sincronizar tasas", details: error.message },
      { status: 500 }
    );
  }
}
