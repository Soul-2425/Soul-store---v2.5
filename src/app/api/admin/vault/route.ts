import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

const VAULT_SECRET = process.env.VAULT_SECRET || "soul_store_master_vault_key_2026";

// Asegurar que pgcrypto esté habilitado
let pgcryptoEnsured = false;
async function ensurePgcrypto() {
  if (!pgcryptoEnsured) {
    try {
      await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto;`;
      pgcryptoEnsured = true;
    } catch (e) {
      console.warn("pgcrypto check:", e);
    }
  }
}

// GET: Listar inventario seguro de la bóveda
export async function GET() {
  try {
    await ensurePgcrypto();

    // Actualizar ciclo de caducidad automático:
    // Items con fecha_vencimiento <= 15 días pasan a OFERTA_ESPECIAL
    await sql`
      UPDATE public.inventario_boveda
      SET estado = 'OFERTA_ESPECIAL', actualizado_en = NOW()
      WHERE estado = 'DISPONIBLE'
        AND fecha_vencimiento IS NOT NULL
        AND fecha_vencimiento <= (NOW() + INTERVAL '15 days')
        AND fecha_vencimiento > NOW()
    `;

    // Items vencidos pasan a CADUCADO
    await sql`
      UPDATE public.inventario_boveda
      SET estado = 'CADUCADO', actualizado_en = NOW()
      WHERE estado IN ('DISPONIBLE', 'OFERTA_ESPECIAL', 'POR_CADUCAR')
        AND fecha_vencimiento IS NOT NULL
        AND fecha_vencimiento <= NOW()
    `;

    const items = await sql`
      SELECT 
        v.id,
        v.producto_id,
        p.nombre as producto_nombre,
        p.precio_base as precio_usd,
        v.variante_id,
        v.identificador_publico,
        v.instruccion_entrega,
        v.tipo_entrega,
        v.fecha_reserva,
        v.fecha_vencimiento,
        v.estado,
        v.asignado_a_pedido_item_id,
        v.creado_en,
        v.actualizado_en
      FROM public.inventario_boveda v
      JOIN public.productos p ON v.producto_id = p.id
      ORDER BY v.creado_en DESC
    `;

    return NextResponse.json({ vault: items });
  } catch (error: any) {
    console.error("Error al obtener bóveda:", error);
    return NextResponse.json(
      { error: "Error al consultar la bóveda de inventario", details: error.message },
      { status: 500 }
    );
  }
}

// POST: Registrar nuevo ítem en la bóveda con credenciales cifradas (pgcrypto AES-256)
export async function POST(request: Request) {
  try {
    await ensurePgcrypto();
    const body = await request.json();

    const {
      producto_id,
      variante_id,
      identificador_publico,
      instruccion_entrega,
      datos_sensibles, // Ej: "usuario@email.com : password_secreta"
      tipo_entrega = "RAPIDA", // RAPIDA | RESERVA_FECHA
      fecha_reserva,
      fecha_vencimiento,
    } = body;

    if (!producto_id || !identificador_publico || !instruccion_entrega || !datos_sensibles) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios para guardar en la bóveda." },
        { status: 400 }
      );
    }

    const safeVarianteId = variante_id || null;
    const safeFechaReserva = fecha_reserva || null;
    const safeFechaVencimiento = fecha_vencimiento || null;

    // Calcular estado inicial si vence en <= 15 días
    let initialEstado = "DISPONIBLE";
    if (safeFechaVencimiento) {
      const vDate = new Date(safeFechaVencimiento);
      const diffDays = (vDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      if (diffDays <= 0) {
        initialEstado = "CADUCADO";
      } else if (diffDays <= 15) {
        initialEstado = "OFERTA_ESPECIAL";
      }
    }

    const [newItem] = await sql`
      INSERT INTO public.inventario_boveda (
        producto_id,
        variante_id,
        identificador_publico,
        instruccion_entrega,
        datos_sensibles_encriptados,
        tipo_entrega,
        fecha_reserva,
        fecha_vencimiento,
        estado
      ) VALUES (
        ${producto_id}::uuid,
        ${safeVarianteId}::uuid,
        ${identificador_publico.trim()},
        ${instruccion_entrega.trim()},
        pgp_sym_encrypt(${datos_sensibles.trim()}, ${VAULT_SECRET}),
        ${tipo_entrega},
        ${safeFechaReserva}::timestamptz,
        ${safeFechaVencimiento}::timestamptz,
        ${initialEstado}
      )
      RETURNING id, producto_id, identificador_publico, tipo_entrega, estado, creado_en
    `;

    return NextResponse.json({
      success: true,
      message: "Ítem encriptado y guardado exitosamente en la bóveda.",
      item: newItem,
    });
  } catch (error: any) {
    console.error("Error al guardar en bóveda:", error);
    return NextResponse.json(
      { error: "Error al registrar en la bóveda", details: error.message },
      { status: 500 }
    );
  }
}
