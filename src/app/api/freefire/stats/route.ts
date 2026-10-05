import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid")?.trim();
    const regionParam = searchParams.get("region")?.trim().toUpperCase();
    const gamemode = searchParams.get("gamemode")?.trim().toLowerCase(); // br or cs
    const matchmode = searchParams.get("matchmode")?.trim().toUpperCase(); // CAREER, NORMAL, RANKED

    if (!uid) {
      return NextResponse.json(
        { success: false, error: "El UID del jugador es requerido." },
        { status: 400 }
      );
    }

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
        error: "API Key de Free Fire no configurada.",
      });
    }

    const region = regionParam || defaultRegion || "US";
    const cleanBaseUrl = apiUrl.replace(/\/+$/, "");

    let targetUrl = `${cleanBaseUrl}/freefireinfo/stats?uid=${encodeURIComponent(uid)}&region=${encodeURIComponent(region)}&key=${encodeURIComponent(apiKey)}`;
    if (gamemode) targetUrl += `&gamemode=${encodeURIComponent(gamemode)}`;
    if (matchmode) targetUrl += `&matchmode=${encodeURIComponent(matchmode)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(targetUrl, {
      method: "GET",
      headers: { "Accept": "application/json" },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `Servidor Free Fire respondió con estado ${response.status}`,
      });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || "Error al obtener estadísticas de Free Fire.",
    }, { status: 500 });
  }
}
