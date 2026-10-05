import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid")?.trim() || "";
    const region = searchParams.get("region")?.trim().toUpperCase() || "US";
    const name = searchParams.get("name")?.trim() || "FF";
    const headPic = searchParams.get("headPic")?.trim() || "";

    // 1. Intentar consultar el avatar / outfit real a través de la API si hay API key
    let apiKey = process.env.FREEFIRE_API_KEY?.trim() || "";
    let apiUrl = process.env.FREEFIRE_API_URL?.trim() || "http://siambhau69.eu.cc";

    try {
      const [config] = await sql`
        SELECT freefire_api_key, freefire_api_url 
        FROM public.tasas_cambio 
        WHERE id = 1
      `;
      if (config) {
        if (config.freefire_api_key) apiKey = config.freefire_api_key.trim();
        if (config.freefire_api_url) apiUrl = config.freefire_api_url.trim();
      }
    } catch {
      // Ignorar error DB
    }

    if (apiKey && uid) {
      try {
        const cleanBaseUrl = apiUrl.replace(/\/+$/, "");
        
        // 1. Intentar obtener el banner oficial de perfil (/banner/profile)
        const bannerUrl = `${cleanBaseUrl}/banner/profile?uid=${encodeURIComponent(uid)}&region=${encodeURIComponent(region)}&key=${encodeURIComponent(apiKey)}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        let imgRes = await fetch(bannerUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        // 2. Si /banner/profile no responde imagen, intentar /outfits/outfit
        if (!imgRes.ok) {
          const outfitUrl = `${cleanBaseUrl}/outfits/outfit?uid=${encodeURIComponent(uid)}&region=${encodeURIComponent(region)}&key=${encodeURIComponent(apiKey)}`;
          const c2 = new AbortController();
          const t2 = setTimeout(() => c2.abort(), 4000);
          imgRes = await fetch(outfitUrl, { signal: c2.signal });
          clearTimeout(t2);
        }

        if (imgRes.ok) {
          const contentType = imgRes.headers.get("content-type") || "";
          if (contentType.includes("image")) {
            const buffer = await imgRes.arrayBuffer();
            return new NextResponse(buffer, {
              headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=86400, immutable",
              },
            });
          }
        }
      } catch {
        // Fallback a generación de avatar SVG
      }
    }

    // 2. Si no hay API key o no responde, generar un Avatar SVG oficial estilo Free Fire
    const initial = (name.replace(/[^a-zA-Z0-9]/g, "")[0] || "F").toUpperCase();
    const colors = [
      { from: "#FF0055", to: "#FFAA00" },
      { from: "#FF4500", to: "#FFD700" },
      { from: "#8A2387", to: "#E94057" },
      { from: "#00c6ff", to: "#0072ff" },
    ];
    const hash = (uid || name).split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const theme = colors[hash % colors.length];

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${theme.from}" />
            <stop offset="100%" stop-color="${theme.to}" />
          </linearGradient>
          <linearGradient id="borderGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#FFF01F" />
            <stop offset="50%" stop-color="#FF4500" />
            <stop offset="100%" stop-color="#FF007F" />
          </linearGradient>
        </defs>
        <!-- Background -->
        <rect width="120" height="120" rx="26" fill="#0A0D14" />
        <!-- Inner Glow -->
        <rect x="5" y="5" width="110" height="110" rx="22" fill="url(#grad)" fill-opacity="0.22" />
        <!-- Border -->
        <rect x="4" y="4" width="112" height="112" rx="23" fill="none" stroke="url(#borderGrad)" stroke-width="3" />
        <!-- Flame Icon / Emblem -->
        <path d="M60 22 C64 34 76 42 74 54 C72 66 62 70 60 70 C58 70 48 66 46 54 C44 42 56 34 60 22 Z" fill="#FFF01F" opacity="0.4" />
        <!-- Letter Initial -->
        <text x="60" y="72" font-family="'Impact', 'Arial Black', sans-serif" font-size="44" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">
          ${initial}
        </text>
        <!-- Free Fire Bottom Tag -->
        <rect x="25" y="88" width="70" height="18" rx="9" fill="#D61A1A" />
        <text x="60" y="101" font-family="monospace" font-size="9" font-weight="bold" fill="#FFF01F" text-anchor="middle">
          FREE FIRE
        </text>
      </svg>
    `.trim();

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new NextResponse("Error generating avatar", { status: 500 });
  }
}
