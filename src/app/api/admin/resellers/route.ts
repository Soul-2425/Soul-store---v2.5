import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Verificar si el usuario es admin
async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { isAdmin: false, user: null };
  const [u] = await sql`SELECT id, rango FROM public.usuarios WHERE id = ${user.id}`;
  return { isAdmin: u && u.rango === "admin", user: u };
}

// GET: Obtener lista de revendedores, solicitudes de depósito pendientes y reglas de escalafón
export async function GET() {
  try {
    const { isAdmin } = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // 1. Usuarios con roles de revendedor o clientes que han depositado
    const resellers = await sql`
      SELECT 
        id, nombre, apellido, nickname, email, telefono_whatsapp, 
        rango, saldo_usdt, total_depositado_usdt, fecha_registro, actualizado_en
      FROM public.usuarios
      WHERE rango LIKE 'revendedor_%' OR total_depositado_usdt > 0 OR saldo_usdt > 0
      ORDER BY total_depositado_usdt DESC, saldo_usdt DESC, fecha_registro DESC
    `;

    // 2. Solicitudes de depósito de revendedores pendientes y recientes
    const depositRequests = await sql`
      SELECT 
        s.id, s.usuario_id, s.monto_reportado, s.moneda, s.monto_estimado_usdt,
        s.metodo_pago, s.referencia_bancaria, s.comprobante_url, s.estado,
        s.notas_admin, s.revisado_por, s.revisado_en, s.creado_en,
        u.nickname as usuario_nickname, u.email as usuario_email, u.rango as usuario_rango,
        u.telefono_whatsapp as usuario_whatsapp
      FROM public.solicitudes_deposito_revendedor s
      JOIN public.usuarios u ON s.usuario_id = u.id
      ORDER BY 
        CASE WHEN s.estado = 'PENDIENTE' THEN 0 ELSE 1 END,
        s.creado_en DESC
      LIMIT 100
    `;

    // 3. Reglas de escalafón
    const rules = await sql`
      SELECT id, rango, deposito_minimo_usdt, nombre_nivel, beneficio_resumen, activo
      FROM public.reglas_revendedor_escalafon
      ORDER BY deposito_minimo_usdt ASC
    `;

    // 4. Últimas transacciones de saldo para auditoría
    const recentTransactions = await sql`
      SELECT 
        t.id, t.usuario_id, t.tipo, t.monto_usdt, t.monto_origen, t.moneda_origen,
        t.saldo_anterior, t.saldo_posterior, t.metodo_pago, t.referencia_bancaria,
        t.estado, t.notas, t.creado_en,
        u.nickname as usuario_nickname
      FROM public.transacciones_saldo t
      JOIN public.usuarios u ON t.usuario_id = u.id
      ORDER BY t.creado_en DESC
      LIMIT 50
    `;

    return NextResponse.json({
      resellers,
      depositRequests,
      rules,
      recentTransactions,
    });
  } catch (error: any) {
    console.error("Error al obtener datos de revendedores:", error);
    return NextResponse.json(
      { error: "Error al cargar revendedores", details: error.message },
      { status: 500 }
    );
  }
}

// PATCH: Ajustar saldo manualmente o cambiar rango de un revendedor
export async function PATCH(request: Request) {
  try {
    const { isAdmin, user: adminUser } = await checkAdmin();
    if (!isAdmin || !adminUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { usuario_id, nuevo_rango, ajuste_saldo_usdt, motivo } = body;

    if (!usuario_id) {
      return NextResponse.json({ error: "ID de usuario requerido" }, { status: 400 });
    }

    const [user] = await sql`
      SELECT id, nickname, rango, saldo_usdt, total_depositado_usdt 
      FROM public.usuarios 
      WHERE id = ${usuario_id}
    `;

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    let updatedSaldo = Number(user.saldo_usdt || 0);
    const saldoAnterior = updatedSaldo;

    // Si hay ajuste de saldo manual
    if (ajuste_saldo_usdt !== undefined && Number(ajuste_saldo_usdt) !== 0) {
      const delta = Number(ajuste_saldo_usdt);
      updatedSaldo = Math.max(0, updatedSaldo + delta);

      // Registrar transacción
      await sql`
        INSERT INTO public.transacciones_saldo (
          usuario_id,
          tipo,
          monto_usdt,
          saldo_anterior,
          saldo_posterior,
          estado,
          aprobado_por,
          notas
        ) VALUES (
          ${usuario_id},
          'AJUSTE_ADMIN',
          ${delta},
          ${saldoAnterior},
          ${updatedSaldo},
          'COMPLETADO',
          ${adminUser.id},
          ${motivo || 'Ajuste manual administrativo de saldo'}
        )
      `;

      await sql`
        UPDATE public.usuarios
        SET saldo_usdt = ${updatedSaldo}, actualizado_en = NOW()
        WHERE id = ${usuario_id}
      `;
    }

    // Si hay cambio de rango
    if (nuevo_rango && nuevo_rango !== user.rango) {
      await sql`
        UPDATE public.usuarios
        SET rango = ${nuevo_rango}, actualizado_en = NOW()
        WHERE id = ${usuario_id}
      `;
    }

    return NextResponse.json({
      success: true,
      message: "Usuario actualizado correctamente",
      saldo_actual: updatedSaldo,
      nuevo_rango: nuevo_rango || user.rango,
    });
  } catch (error: any) {
    console.error("Error al actualizar revendedor:", error);
    return NextResponse.json(
      { error: "Error al actualizar revendedor", details: error.message },
      { status: 500 }
    );
  }
}
