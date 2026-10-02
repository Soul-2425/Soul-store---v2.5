/**
 * Utilidad avanzada para consultar tasas P2P de Binance en tiempo real.
 * Permite filtrar por monto mínimo de transacción (transAmount) para evitar
 * tasas distorsionadas de comerciantes mayoristas (ballenas de millones de Bs o MXN).
 */

export interface P2POptions {
  fiat: "VES" | "MXN";
  transAmount?: number | null;
  rows?: number;
  tradeType?: "SELL" | "BUY";
  spreadPercent?: number;
  payTypes?: string[];
  soloVerificados?: boolean;
  tiempoPago?: number; // 0 = Todo, 15, 30, 45, 60, 120, 180
  pais?: string; // "ALL", "VE", "MX", etc.
  soloTrading?: boolean; // Solo anuncios para trading
  soloPro?: boolean; // Solo comerciantes Pro
  sinVerif?: boolean; // Anuncios que no necesitan verificación
}

export interface P2POfferSample {
  nick: string;
  price: number;
  minAmount: string;
  maxAmount: string;
  paymentMethods?: string[];
  isMerchant?: boolean;
  isPro?: boolean;
  payTimeLimit?: number;
}

export interface P2PResult {
  rate: number;
  rawAverage: number;
  offersCount: number;
  sampleOffers: P2POfferSample[];
}

export async function fetchBinanceP2PRate(
  param: ("VES" | "MXN") | P2POptions
): Promise<P2PResult | null> {
  const options: P2POptions =
    typeof param === "string"
      ? {
          fiat: param,
          transAmount: param === "VES" ? 1000 : 200,
          rows: 10,
          tradeType: "BUY",
          spreadPercent: 0,
          payTypes: [],
          soloVerificados: true,
          tiempoPago: 0,
          pais: "ALL",
          soloTrading: true,
          soloPro: false,
          sinVerif: false,
        }
      : param;

  const {
    fiat,
    transAmount,
    rows = 10,
    tradeType = "BUY",
    spreadPercent = 0,
    payTypes = [],
    soloVerificados = true,
    tiempoPago = 0,
    pais = "ALL",
    soloTrading = true,
    soloPro = false,
    sinVerif = false,
  } = options;

  try {
    const isVerifiedOnly = Boolean(soloVerificados) && !sinVerif;

    const payload: Record<string, any> = {
      asset: "USDT",
      fiat: fiat,
      merchantCheck: isVerifiedOnly,
      page: 1,
      payTypes: Array.isArray(payTypes) && payTypes.length > 0 && !payTypes.includes("ALL") ? payTypes : [],
      publisherType: isVerifiedOnly ? "merchant" : null,
      rows: Math.min(Math.max(rows * 2, 10), 30), // Traer suficiente margen para filtrar en cliente
      tradeType: tradeType || "BUY",
    };

    if (soloPro) {
      payload.proMerchant = true;
    }

    // País / Región si no es ALL
    if (pais && pais !== "ALL") {
      payload.countries = [pais];
    }

    // Si se especifica monto filtro (ej: 1000 Bs), filtrar anuncios
    if (transAmount && Number(transAmount) > 0) {
      payload.transAmount = String(transAmount);
    }

    const response = await fetch("https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "*/*",
        "Origin": "https://p2p.binance.com",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!response.ok) {
      console.warn(`Binance P2P respondió con status ${response.status} para ${fiat}`);
      return null;
    }

    const data = await response.json();
    if (data.data && Array.isArray(data.data) && data.data.length > 0) {
      let validItems = data.data.filter((item: any) => {
        const price = parseFloat(item?.adv?.price);
        return !isNaN(price) && price > 0;
      });

      // Filtro 1: Solo anuncios para trading
      if (soloTrading) {
        validItems = validItems.filter((item: any) => item?.adv?.isTradable !== false);
      }

      // Filtro 2: Límite de tiempo de pago (minutos)
      if (tiempoPago && Number(tiempoPago) > 0) {
        validItems = validItems.filter((item: any) => {
          const limit = Number(item?.adv?.payTimeLimit);
          return !isNaN(limit) ? limit <= Number(tiempoPago) : true;
        });
      }

      // Filtro 3: Solo comerciantes Pro
      if (soloPro) {
        validItems = validItems.filter((item: any) => {
          const isProBadge = item?.advertiser?.badges?.includes("Pro");
          const isProMerchant = item?.advertiser?.proMerchant === true;
          const isProfession = item?.adv?.classify === "profession";
          return isProBadge || isProMerchant || isProfession;
        });
      }

      if (validItems.length === 0) return null;

      const prices: number[] = validItems.map((item: any) => parseFloat(item.adv.price));
      const sampleOffers: P2POfferSample[] = validItems.slice(0, 8).map((item: any) => {
        const methods: string[] = Array.isArray(item?.adv?.tradeMethods)
          ? item.adv.tradeMethods.map((m: any) => m.tradeMethodName || m.identifier || "").filter(Boolean)
          : [];

        const isPro = item?.advertiser?.badges?.includes("Pro") || item?.advertiser?.proMerchant === true;

        return {
          nick: item?.advertiser?.nickName || "Comerciante",
          price: parseFloat(item?.adv?.price),
          minAmount: String(item?.adv?.minSingleTransAmount || "0"),
          maxAmount: String(item?.adv?.dynamicMaxSingleTransAmount || item?.adv?.maxSingleTransAmount || "0"),
          paymentMethods: methods,
          isMerchant: item?.advertiser?.userType === "merchant",
          isPro,
          payTimeLimit: item?.adv?.payTimeLimit ? Number(item.adv.payTimeLimit) : undefined,
        };
      });

      // Calcular promedio de las ofertas obtenidas (hasta rows ofertas)
      const count = Math.min(prices.length, rows);
      const topPrices = prices.slice(0, count);
      const rawAvg = topPrices.reduce((sum, val) => sum + val, 0) / topPrices.length;

      // Aplicar margen / spread porcentual si existe
      const spreadMultiplier = 1 + (Number(spreadPercent) || 0) / 100;
      const finalRate = Math.round(rawAvg * spreadMultiplier * 100) / 100;

      return {
        rate: finalRate,
        rawAverage: Math.round(rawAvg * 100) / 100,
        offersCount: topPrices.length,
        sampleOffers,
      };
    }

    return null;
  } catch (error) {
    console.error(`Error al consultar Binance P2P para ${fiat}:`, error);
    return null;
  }
}
