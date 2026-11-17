import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const [adminProfile] = await sql`
      SELECT id, rango FROM public.usuarios WHERE id = ${user.id}
    `;
    if (!adminProfile || adminProfile.rango !== "admin") {
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { solicitud_id, accion, monto_aprobado_usdt, notas } = body; // accion: 'APROBAR' | 'RECHAZAR'

    if (!solicitud_id || !accion) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const [solicitud] = await sql`
      SELECT * FROM public.solicitudes_deposito_revendedor WHERE id = ${solicitud_id}
    `;

    if (!solicitud) {
      return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
    }

    if (solicitud.estado !== "PENDIENTE") {
      return NextResponse.json({ error: `La solicitud ya fue procesada anteriormente (${solicitud.estado})` }, { status: 400 });
    }

    if (accion === "RECHAZAR") {
      await sql`
        UPDATE public.solicitudes_deposito_revendedor
        SET estado = 'RECHAZADO',
            notas_admin = ${notas || 'Depósito rechazado por administración'},
            revisado_por = ${user.id},
            revisado_en = NOW()
        WHERE id = ${solicitud_id}
      `;
      return NextResponse.json({ success: true, message: "Solicitud de depósito rechazada." });
    }

    // ACCIÓN: APROBAR
    const montoUsdt = monto_aprobado_usdt ? Number(monto_aprobado_usdt) : Number(solicitud.monto_estimado_usdt);

    if (isNaN(montoUsdt) || montoUsdt <= 0) {
      return NextResponse.json({ error: "Monto en USDT inválido" }, { status: 400 });
    }

    // Obtener datos actuales del usuario
    const [cliente] = await sql`
      SELECT id, nickname, email, rango, saldo_usdt, total_depositado_usdt
      FROM public.usuarios
      WHERE id = ${solicitud.usuario_id}
    `;

    if (!cliente) {
      return NextResponse.json({ error: "Usuario cliente no encontrado" }, { status: 404 });
    }

    const saldoAnterior = Number(cliente.saldo_usdt || 0);
    const nuevoSaldo = saldoAnterior + montoUsdt;
    const nuevoTotalDepositado = Number(cliente.total_depositado_usdt || 0) + montoUsdt;

    // Actualizar solicitud
    await sql`
      UPDATE public.solicitudes_deposito_revendedor
      SET estado = 'APROBADO',
          monto_estimado_usdt = ${montoUsdt},
          notas_admin = ${notas || 'Depósito verificado y acreditado exitosamente'},
          revisado_por = ${user.id},
          revisado_en = NOW()
      WHERE id = ${solicitud_id}
    `;

    // Registrar en historial de transacciones
    await sql`
      INSERT INTO public.transacciones_saldo (
        usuario_id,
        tipo,
        monto_usdt,
        monto_origen,
        moneda_origen,
        saldo_anterior,
        saldo_posterior,
        metodo_pago,
        comprobante_url,
        referencia_bancaria,
        estado,
        aprobado_por,
        notas
      ) VALUES (
        ${cliente.id},
        'DEPOSITO',
        ${montoUsdt},
        ${solicitud.monto_reportado},
        ${solicitud.moneda},
        ${saldoAnterior},
        ${nuevoSaldo},
        ${solicitud.metodo_pago},
        ${solicitud.comprobante_url},
        ${solicitud.referencia_bancaria},
        'COMPLETADO',
        ${user.id},
        ${notas || `Depósito aprobado vía ${solicitud.metodo_pago}`}
      )
    `;

    // EVALUACIÓN DE ESCALAFÓN:
    // Si era cliente normal y su total_depositado_usdt >= 5 USDT -> asciende a revendedor_4
    // O si califica para un nivel superior según reglas_revendedor_escalafon
    const rules = await sql`
      SELECT rango, deposito_minimo_usdt 
      FROM public.reglas_revendedor_escalafon
      WHERE activo = TRUE
      ORDER BY deposito_minimo_usdt DESC
    `;

    let nuevoRango = cliente.rango;

    for (const rule of rules) {
      if (nuevoTotalDepositado >= Number(rule.deposito_minimo_usdt)) {
        // Si el usuario no es admin ni diseñador, actualizar al rango ganado
        if (cliente.rango !== "admin" && cliente.rango !== "disenador") {
          nuevoRango = rule.rango;
        }
        break;
      }
    }

    // Si aún no califica pero supera el umbral configurado de revendedor base (por defecto revendedor_4)
    const baseRule = rules.find((r) => r.rango === "revendedor_4") || rules[rules.length - 1];
    if (baseRule && nuevoTotalDepositado >= Number(baseRule.deposito_minimo_usdt) && cliente.rango.startsWith("cliente_")) {
      nuevoRango = baseRule.rango;
    }

    await sql`
      UPDATE public.usuarios
      SET 
        saldo_usdt = ${nuevoSaldo},
        total_depositado_usdt = ${nuevoTotalDepositado},
        rango = ${nuevoRango},
        actualizado_en = NOW()
      WHERE id = ${cliente.id}
    `;

    return NextResponse.json({
      success: true,
      message: `Depósito de ${montoUsdt.toFixed(2)} USDT acreditado con éxito. Saldo nuevo: ${nuevoSaldo.toFixed(2)} USDT. Rango: ${nuevoRango}`,
      nuevo_saldo: nuevoSaldo,
      nuevo_rango: nuevoRango,
    });
  } catch (error: any) {
    console.error("Error al procesar depósito:", error);
    return NextResponse.json(
      { error: "Error al procesar depósito", details: error.message },
      { status: 500 }
    );
  }
}
