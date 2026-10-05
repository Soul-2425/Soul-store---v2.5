import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid")?.trim();
    const regionParam = searchParams.get("region")?.trim().toUpperCase();

    if (!uid) {
      return NextResponse.json(
        { success: false, error: "El UID del jugador es requerido." },
        { status: 400 }
      );
    }

    // 1. Obtener configuración de API de Free Fire desde la base de datos o env
    let apiKey = process.env.FREEFIRE_API_KEY?.trim() || "";
    let apiUrl = process.env.FREEFIRE_API_URL?.trim() || "http://siambhau69.eu.cc";
    let defaultRegion = "US";

    try {
      const [config] = await sql`
        SELECT freefire_api_key, freefire_api_url, freefire_default_region 
        FROM public.tasas_cambio 
        WHERE id = 1
      `;
      if (config) {
        if (config.freefire_api_key) apiKey = config.freefire_api_key.trim();
        if (config.freefire_api_url) apiUrl = config.freefire_api_url.trim();
        if (config.freefire_default_region) defaultRegion = config.freefire_default_region.trim();
      }
    } catch (dbErr) {
      console.error("Error al consultar configuración Free Fire:", dbErr);
    }

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        configured: false,
        error: "API Key de Free Fire pendiente de configurar en el panel admin.",
      });
    }

    // Región a consultar (por defecto US para Latinoamérica/EEUU, o la seleccionada)
    const region = regionParam || defaultRegion || "US";

    // 2. Limpiar URL base
    const cleanBaseUrl = apiUrl.replace(/\/+$/, "");
    const targetUrl = `${cleanBaseUrl}/freefireinfo/bhau?uid=${encodeURIComponent(uid)}&region=${encodeURIComponent(region)}&key=${encodeURIComponent(apiKey)}`;

    // 3. Llamada al endpoint con timeout de 8 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({
        success: true,
        valid: false,
        error: `Servidor Free Fire respondió con estado ${response.status}: ${errText.slice(0, 100)}`,
      });
    }

    const data = await response.json();

    // 4. Analizar respuesta de la API
    // Si la API retorna error directo
    if (data.error || data.status === "error" || data.message === "Invalid UID or Region") {
      return NextResponse.json({
        success: true,
        valid: false,
        error: data.error || data.message || "Player ID o región inválidos.",
      });
    }

    // Extraer datos del jugador
    const nickname =
      data.account_nickname ||
      data.basicInfo?.nickname ||
      data.nickname ||
      data.name ||
      data.AccountNickname ||
      null;

    const level =
      data.basicInfo?.level ||
      data.level ||
      data.AccountLevel ||
      null;

    const playerRegion =
      data.region ||
      data.basicInfo?.region ||
      region;

    const accountId =
      data.account_id ||
      data.basicInfo?.accountId ||
      uid;

    if (!nickname) {
      return NextResponse.json({
        success: true,
        valid: false,
        error: "No se encontraron datos para este Player ID.",
      });
    }

    return NextResponse.json({
      success: true,
      valid: true,
      configured: true,
      player: {
        uid: accountId,
        nickname,
        level,
        region: playerRegion,
      },
      raw: data,
    });
  } catch (err: any) {
    if (err.name === "AbortError") {
      return NextResponse.json({
        success: false,
        error: "Tiempo de espera agotado al conectar con el servidor de Free Fire.",
      });
    }

    console.error("Error al validar Free Fire ID:", err);
    return NextResponse.json({
      success: false,
      error: err.message || "Error al validar Player ID.",
    }, { status: 500 });
  }
}
