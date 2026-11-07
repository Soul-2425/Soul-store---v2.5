import { NextResponse } from "next/server";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const headersList = await headers();
    
    // Cabeceras enviadas comúnmente por Vercel, Cloudflare y Proxies
    const country = (
      headersList.get("x-vercel-ip-country") ||
      headersList.get("cf-ipcountry") ||
      headersList.get("x-country-code") ||
      headersList.get("x-real-ip-country") ||
      ""
    ).trim().toUpperCase();

    let currency: "USD" | "VES" | "MXN" = "USD";
    if (country === "VE") {
      currency = "VES";
    } else if (country === "MX") {
      currency = "MXN";
    } else {
      // Cualquier otro país del mundo utiliza USDT / USD
      currency = "USD";
    }

    return NextResponse.json({
      country: country || null,
      currency,
      source: country ? "headers" : "default",
    });
  } catch (error: any) {
    console.error("Error al detectar geolocalización en /api/geo:", error);
    return NextResponse.json({
      country: null,
      currency: "USD",
      error: error.message,
    });
  }
}

