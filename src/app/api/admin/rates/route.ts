import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [tasas] = await sql`
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

    if (!tasas) {
      return NextResponse.json({ error: "No se encontraron tasas" }, { status: 404 });
    }

    return NextResponse.json({
      tasa_ves: Number(tasas.tasa_ves),
      tasa_mxn: Number(tasas.tasa_mxn),
      modo_automatico: Boolean(tasas.modo_automatico),
      ultima_actualizacion: tasas.ultima_actualizacion,
      intervalo_minutos: Number(tasas.intervalo_minutos || 15),
      ves: {
        filtro_monto: Number(tasas.filtro_monto_ves || 1000),
        metodo_pago: tasas.metodo_pago_ves || "ALL",
        cant_ofertas: Number(tasas.cant_ofertas_ves || 10),
        margen_spread: Number(tasas.margen_spread_ves || 0),
        tipo_operacion: tasas.tipo_operacion_ves || "BUY",
        solo_verificados: tasas.solo_verificados_ves !== undefined ? Boolean(tasas.solo_verificados_ves) : true,
        tiempo_pago: Number(tasas.tiempo_pago_ves || 0),
        pais: tasas.pais_ves || "ALL",
        solo_trading: tasas.solo_trading_ves !== undefined ? Boolean(tasas.solo_trading_ves) : true,
        solo_pro: Boolean(tasas.solo_pro_ves),
        sin_verif: Boolean(tasas.sin_verif_ves),
      },
      mxn: {
        filtro_monto: Number(tasas.filtro_monto_mxn || 200),
        metodo_pago: tasas.metodo_pago_mxn || "ALL",
        cant_ofertas: Number(tasas.cant_ofertas_mxn || 10),
        margen_spread: Number(tasas.margen_spread_mxn || 0),
        tipo_operacion: tasas.tipo_operacion_mxn || "BUY",
        solo_verificados: tasas.solo_verificados_mxn !== undefined ? Boolean(tasas.solo_verificados_mxn) : true,
        tiempo_pago: Number(tasas.tiempo_pago_mxn || 0),
        pais: tasas.pais_mxn || "ALL",
        solo_trading: tasas.solo_trading_mxn !== undefined ? Boolean(tasas.solo_trading_mxn) : true,
        solo_pro: Boolean(tasas.solo_pro_mxn),
        sin_verif: Boolean(tasas.sin_verif_mxn),
      },
    });
  } catch (error: any) {
    console.error("Error al obtener tasas admin:", error);
    return NextResponse.json(
      { error: "Error al obtener tasas", details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { 
      modo_automatico, 
      tasa_ves, 
      tasa_mxn,
      intervalo_minutos,
      // VES
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
      // MXN
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
      sin_verif_mxn,
    } = body;

    const [current] = await sql`
      SELECT * FROM public.tasas_cambio WHERE id = 1
    `;

    const newModo = typeof modo_automatico === "boolean" ? modo_automatico : current.modo_automatico;
    const newVes = tasa_ves !== undefined ? Number(tasa_ves) : Number(current.tasa_ves);
    const newMxn = tasa_mxn !== undefined ? Number(tasa_mxn) : Number(current.tasa_mxn);
    const newIntervalo = intervalo_minutos !== undefined ? Number(intervalo_minutos) : Number(current.intervalo_minutos || 15);

    // VES
    const newFiltroVes = filtro_monto_ves !== undefined ? Number(filtro_monto_ves) : Number(current.filtro_monto_ves || 1000);
    const newMetodoVes = metodo_pago_ves !== undefined ? String(metodo_pago_ves) : (current.metodo_pago_ves || "ALL");
    const newCantVes = cant_ofertas_ves !== undefined ? Number(cant_ofertas_ves) : Number(current.cant_ofertas_ves || 10);
    const newSpreadVes = margen_spread_ves !== undefined ? Number(margen_spread_ves) : Number(current.margen_spread_ves || 0);
    const newTipoVes = tipo_operacion_ves ? String(tipo_operacion_ves).toUpperCase() : (current.tipo_operacion_ves || "BUY");
    const newSoloVerifVes = solo_verificados_ves !== undefined ? Boolean(solo_verificados_ves) : (current.solo_verificados_ves !== undefined ? Boolean(current.solo_verificados_ves) : true);
    const newTiempoPagoVes = tiempo_pago_ves !== undefined ? Number(tiempo_pago_ves) : Number(current.tiempo_pago_ves || 0);
    const newPaisVes = pais_ves !== undefined ? String(pais_ves) : (current.pais_ves || "ALL");
    const newSoloTradingVes = solo_trading_ves !== undefined ? Boolean(solo_trading_ves) : (current.solo_trading_ves !== undefined ? Boolean(current.solo_trading_ves) : true);
    const newSoloProVes = solo_pro_ves !== undefined ? Boolean(solo_pro_ves) : Boolean(current.solo_pro_ves);
    const newSinVerifVes = sin_verif_ves !== undefined ? Boolean(sin_verif_ves) : Boolean(current.sin_verif_ves);

    // MXN
    const newFiltroMxn = filtro_monto_mxn !== undefined ? Number(filtro_monto_mxn) : Number(current.filtro_monto_mxn || 200);
    const newMetodoMxn = metodo_pago_mxn !== undefined ? String(metodo_pago_mxn) : (current.metodo_pago_mxn || "ALL");
    const newCantMxn = cant_ofertas_mxn !== undefined ? Number(cant_ofertas_mxn) : Number(current.cant_ofertas_mxn || 10);
    const newSpreadMxn = margen_spread_mxn !== undefined ? Number(margen_spread_mxn) : Number(current.margen_spread_mxn || 0);
    const newTipoMxn = tipo_operacion_mxn ? String(tipo_operacion_mxn).toUpperCase() : (current.tipo_operacion_mxn || "BUY");
    const newSoloVerifMxn = solo_verificados_mxn !== undefined ? Boolean(solo_verificados_mxn) : (current.solo_verificados_mxn !== undefined ? Boolean(current.solo_verificados_mxn) : true);
    const newTiempoPagoMxn = tiempo_pago_mxn !== undefined ? Number(tiempo_pago_mxn) : Number(current.tiempo_pago_mxn || 0);
    const newPaisMxn = pais_mxn !== undefined ? String(pais_mxn) : (current.pais_mxn || "ALL");
    const newSoloTradingMxn = solo_trading_mxn !== undefined ? Boolean(solo_trading_mxn) : (current.solo_trading_mxn !== undefined ? Boolean(current.solo_trading_mxn) : true);
    const newSoloProMxn = solo_pro_mxn !== undefined ? Boolean(solo_pro_mxn) : Boolean(current.solo_pro_mxn);
    const newSinVerifMxn = sin_verif_mxn !== undefined ? Boolean(sin_verif_mxn) : Boolean(current.sin_verif_mxn);

    await sql`
      UPDATE public.tasas_cambio
      SET 
        modo_automatico = ${newModo},
        tasa_ves = ${newVes},
        tasa_mxn = ${newMxn},
        intervalo_minutos = ${newIntervalo},
        -- VES
        filtro_monto_ves = ${newFiltroVes},
        metodo_pago_ves = ${newMetodoVes},
        cant_ofertas_ves = ${newCantVes},
        margen_spread_ves = ${newSpreadVes},
        tipo_operacion_ves = ${newTipoVes},
        solo_verificados_ves = ${newSoloVerifVes},
        tiempo_pago_ves = ${newTiempoPagoVes},
        pais_ves = ${newPaisVes},
        solo_trading_ves = ${newSoloTradingVes},
        solo_pro_ves = ${newSoloProVes},
        sin_verif_ves = ${newSinVerifVes},
        -- MXN
        filtro_monto_mxn = ${newFiltroMxn},
        metodo_pago_mxn = ${newMetodoMxn},
        cant_ofertas_mxn = ${newCantMxn},
        margen_spread_mxn = ${newSpreadMxn},
        tipo_operacion_mxn = ${newTipoMxn},
        solo_verificados_mxn = ${newSoloVerifMxn},
        tiempo_pago_mxn = ${newTiempoPagoMxn},
        pais_mxn = ${newPaisMxn},
        solo_trading_mxn = ${newSoloTradingMxn},
        solo_pro_mxn = ${newSoloProMxn},
        sin_verif_mxn = ${newSinVerifMxn},
        ultima_actualizacion = NOW()
      WHERE id = 1
    `;

    return NextResponse.json({
      success: true,
      message: "Configuración de algoritmos y periodicidad actualizada con éxito.",
      tasa_ves: newVes,
      tasa_mxn: newMxn,
      modo_automatico: newModo,
      intervalo_minutos: newIntervalo,
      ves: {
        filtro_monto: newFiltroVes,
        metodo_pago: newMetodoVes,
        cant_ofertas: newCantVes,
        margen_spread: newSpreadVes,
        tipo_operacion: newTipoVes,
        solo_verificados: newSoloVerifVes,
      },
      mxn: {
        filtro_monto: newFiltroMxn,
        metodo_pago: newMetodoMxn,
        cant_ofertas: newCantMxn,
        margen_spread: newSpreadMxn,
        tipo_operacion: newTipoMxn,
        solo_verificados: newSoloVerifMxn,
      },
    });
  } catch (error: any) {
    console.error("Error al actualizar tasas:", error);
    return NextResponse.json(
      { error: "Error al actualizar tasas", details: error.message },
      { status: 500 }
    );
  }
}
