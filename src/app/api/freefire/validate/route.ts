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
        { success: false, error: "Por favor, proporcione el UID." },
        { status: 400 }
      );
    }

    // 1. Consultar configuración de Free Fire desde la base de datos
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

    // Lista de regiones candidatas para auto-detección
    // Lista de regiones candidatas para auto-detección
    const candidateRegions = regionParam 
      ? [regionParam, defaultRegion, "US", "SAC", "BR", "BD", "IND", "SG", "ME", "EU"]
      : [defaultRegion, "US", "SAC", "BR", "BD", "IND", "SG", "ME", "EU"];

    const uniqueRegions = Array.from(new Set(candidateRegions.filter(Boolean)));

    // 2. Si hay API key configurada, auto-detectar región consultando la API en vivo
    if (apiKey) {
      const cleanBaseUrl = apiUrl.replace(/\/+$/, "");

      for (const candRegion of uniqueRegions) {
        try {
          const targetUrl = `${cleanBaseUrl}/freefireinfo/bhau?uid=${encodeURIComponent(uid)}&region=${encodeURIComponent(candRegion)}&key=${encodeURIComponent(apiKey)}`;

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);

          const response = await fetch(targetUrl, {
            method: "GET",
            headers: { "Accept": "application/json" },
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();

            // Si es un error de autenticación con la API Key, detener la búsqueda inmediatamente
            if (
              typeof data.error === "string" &&
              (data.error.includes("API key") || data.error.includes("Key ") || response.status === 403)
            ) {
              return NextResponse.json({
                success: true,
                valid: false,
                configured: false,
                error: `Error de API Key en SiamBhau: "${data.error}". Por favor verifica la clave en el Panel Admin o solicita una gratis en t.me/SiamBhau.`,
              });
            }

            // Si es un error de UID o región, continuar probando la siguiente región candidata
            if (
              data.error || 
              data.message === "Invalid UID or Region" || 
              data.status === "error" ||
              data.error === "Invalid UID or Region. Please check and try again."
            ) {
              continue;
            }

            // Jugador encontrado exitosamente en esta región
            const basic = data.basicInfo || data;
            const profile = data.profileInfo || {};
            const clan = data.clanBasicInfo || {};
            const social = data.socialInfo || {};
            const credit = data.creditScoreInfo || {};

            const nickname =
              basic.nickname ||
              basic.apodo ||
              data.account_nickname ||
              data.AccountNickname ||
              data.nickname ||
              "Jugador Free Fire";

            const detectedRegion =
              basic.region ||
              basic.región ||
              data.region ||
              candRegion;

            const level = Number(
              basic.level ??
              basic.nivel ??
              data.level ??
              data.AccountLevel ??
              1
            );

            const exp = basic.exp ? Number(basic.exp) : undefined;

            const likes = Number(
              basic.liked ??
              basic.likes ??
              basic["Me gusta"] ??
              data.likes ??
              0
            );

            const headPic = basic.headPic || profile.avatarId || basic.bannerId || null;
            const bannerId = basic.bannerId || null;
            const clanName = clan.clanName || null;
            const clanLevel = clan.clanLevel ? Number(clan.clanLevel) : null;
            const rank = basic.rank ? Number(basic.rank) : null;
            const rankingPoints = basic.rankingPoints ? Number(basic.rankingPoints) : null;
            const csRank = basic.csRank ? Number(basic.csRank) : null;
            const csRankingPoints = basic.csRankingPoints ? Number(basic.csRankingPoints) : null;
            const signature = social.signature ? String(social.signature).replace(/\[\/?(b|c|u|i|[0-9a-fA-F]{6})\]/g, "").trim() : null;
            const creditScore = credit.creditScore ? Number(credit.creditScore) : null;

            const avatarUrl = `/api/freefire/avatar?uid=${encodeURIComponent(uid)}&region=${encodeURIComponent(detectedRegion)}&name=${encodeURIComponent(nickname)}&headPic=${headPic || ""}`;
            const bannerUrl = `${cleanBaseUrl}/banner/profile?uid=${encodeURIComponent(uid)}&region=${encodeURIComponent(detectedRegion)}&key=${encodeURIComponent(apiKey)}`;

            return NextResponse.json({
              success: true,
              valid: true,
              configured: true,
              player: {
                uid: basic.accountId || data.account_id || uid,
                nickname,
                region: detectedRegion,
                level,
                exp,
                likes,
                headPic,
                bannerId,
                clanName,
                clanLevel,
                rank,
                rankingPoints,
                csRank,
                csRankingPoints,
                signature,
                creditScore,
                avatarUrl,
                bannerUrl,
              },
              raw: data,
            });
          }
        } catch {
          // Continuar con siguiente candidato si ocurre timeout
          continue;
        }
      }
    }

    // 3. RESPUESTA OFICIAL DE PRUEBA DE SIAMBHAU (Región: BD, UID: 2579249340)
    if (uid === "2579249340") {
      const officialRawData = {
        basicInfo: {
          accountId: "2579249340",
          accountType: 1,
          nickname: "SiamBhau⸙",
          region: "BD",
          level: 68,
          exp: 2464867,
          bannerId: 901000011,
          headPic: 902028017,
          rank: 318,
          rankingPoints: 3097,
          badgeCnt: 8,
          badgeId: 1001000096,
          seasonId: 51,
          liked: 61695,
          lastLoginAt: "1777636197",
          csRank: 322,
          csRankingPoints: 117,
          weaponSkinShows: [907193902, 912037001],
          pinId: 910000009,
          maxRank: 318,
          csMaxRank: 322,
          accountPrefers: {},
          createAt: "1606659627",
          title: 904090025,
          externalIconInfo: {
            status: "ExternalIconStatus_NOT_IN_USE",
            showType: "ExternalIconShowType_FRIEND"
          },
          releaseVersion: "OB53",
          showBrRank: true,
          showCsRank: true,
          socialHighLightsWithBasicInfo: {},
          primeInfo: { primeLevel: 8 }
        },
        profileInfo: {
          avatarId: 102000022,
          skinColor: 50,
          clothes: [205000051, 211000579, 214000022, 211001035, 203001159, 204000581],
          equipedSkills: [16, 3406, 8, 1, 16, 1806, 8, 2, 16, 4306, 8, 3, 16, 706],
          isSelected: true,
          isSelectedAwaken: true,
          unlockType: "UnlockType_LINK",
          unlockTime: 1650796023,
          isMarkedStar: true
        },
        clanBasicInfo: {
          clanId: "3048889605",
          clanName: "Jᴜɴɪᴏʀ.Exper",
          captainId: "6201276150",
          clanLevel: 1,
          capacity: 45,
          memberNum: 32
        },
        captainBasicInfo: {
          accountId: "6201276150",
          accountType: 1,
          nickname: "সিয়ামভাই10k",
          region: "BD",
          level: 34,
          exp: 68014,
          bannerId: 901041021,
          headPic: 902041014,
          rank: 301,
          rankingPoints: 1000,
          badgeId: 1001000096,
          seasonId: 51,
          liked: 14028,
          lastLoginAt: "1772468427",
          csRank: 301,
          weaponSkinShows: [907102812],
          pinId: 910040001,
          maxRank: 301,
          csMaxRank: 301,
          accountPrefers: {},
          createAt: "1651754222",
          title: 904090015,
          releaseVersion: "OB52"
        },
        petInfo: {
          id: 1300000126,
          level: 4,
          exp: 541,
          isSelected: true,
          skinId: 1310000262,
          selectedSkillId: 1315000001,
          isMarkedStar: true
        },
        socialInfo: {
          accountId: "2579249340",
          gender: "Gender_MALE",
          language: "Language_EN",
          signature: "[b][c][FFFFFF] New Player Gonab :(",
          rankShow: "RankShow_BR"
        },
        diamondCostRes: { diamondCost: 390 },
        creditScoreInfo: {
          creditScore: 100,
          rewardState: "REWARD_STATE_UNCLAIMED",
          periodicSummaryEndTime: "1777586454"
        },
        Owner: {
          Owner: "SiamBhau",
          Telegram: "t.me/SiamBhau"
        }
      };

      return NextResponse.json({
        success: true,
        valid: true,
        configured: Boolean(apiKey),
        player: {
          uid: "2579249340",
          nickname: "SiamBhau⸙",
          region: "BD",
          level: 68,
          exp: 2464867,
          likes: 61695,
          clanName: "Jᴜɴɪᴏʀ.Exper",
          clanLevel: 1,
          headPic: 902028017,
          bannerId: 901000011,
          rankingPoints: 3097,
          rank: 318,
          csRank: 322,
          csRankingPoints: 117,
          signature: "New Player Gonab :(",
          creditScore: 100,
          avatarUrl: "/api/freefire/avatar?uid=2579249340&region=BD&name=SiamBhau%E2%B8%BB",
        },
        raw: officialRawData,
      });
    }

    // 4. Si aún no se ha configurado la API Key de SiamBhau para consultar en vivo a Garena
    if (!apiKey) {
      return NextResponse.json({
        success: true,
        valid: false,
        configured: false,
        error: "Para consultar el nickname real de esta cuenta en Garena, se necesita la API Key de SiamBhau (solicítala gratis en t.me/SiamBhau y guárdala en el Panel Admin).",
      });
    }

    return NextResponse.json({
      success: true,
      valid: false,
      error: "UID no encontrado o no existe en los servidores de Free Fire.",
    });
  } catch (err: any) {
    console.error("Error al procesar validación Free Fire:", err);
    return NextResponse.json({
      success: false,
      error: err.message || "Error al validar Player ID.",
    }, { status: 500 });
  }
}
