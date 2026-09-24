import { NextResponse } from "next/server";

interface ExchangeRateCache {
  rate: number;
  source: string;
  timestamp: number;
  date: string;
}

let cachedRate: ExchangeRateCache | null = null;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export async function GET() {
  const now = Date.now();

  // Return fresh cache if available
  if (cachedRate && now - cachedRate.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({
      success: true,
      rate: cachedRate.rate,
      source: cachedRate.source,
      date: cachedRate.date,
      cached: true,
      lastUpdated: new Date(cachedRate.timestamp).toISOString(),
    });
  }

  let rate = 18.35;
  let source = "BANXICO_FIX_FALLBACK";
  const dateStr = new Date().toLocaleDateString("es-MX", { timeZone: "America/Mexico_City" });

  // 1. Try official Banxico SIE API if token is configured
  const banxicoToken = process.env.BANXICO_TOKEN;
  if (banxicoToken) {
    try {
      const bmxRes = await fetch(
        "https://www.banxico.org.mx/SieAPIRest/service/v1/series/SF43718/datos/oportuno",
        {
          headers: {
            "Bmx-Token": banxicoToken,
            Accept: "application/json",
          },
          next: { revalidate: 900 },
        }
      );

      if (bmxRes.ok) {
        const bmxData = await bmxRes.json();
        const datoStr = bmxData?.bmx?.series?.[0]?.datos?.[0]?.dato;
        if (datoStr) {
          const parsed = parseFloat(datoStr.replace(/,/g, ""));
          if (!isNaN(parsed) && parsed > 5 && parsed < 50) {
            rate = Math.round((parsed + Number.EPSILON) * 10000) / 10000;
            source = "BANXICO_SIE_OFICIAL";
          }
        }
      }
    } catch (bmxErr) {
      console.warn("Banxico SIE direct fetch error:", bmxErr);
    }
  }

  // 2. If Banxico token is not present or failed, fetch real-time USD/MXN from public market FX
  if (source === "BANXICO_FIX_FALLBACK") {
    try {
      const fxRes = await fetch("https://open.er-api.com/v6/latest/USD", {
        next: { revalidate: 900 },
      });
      if (fxRes.ok) {
        const fxData = await fxRes.json();
        const mxnRate = fxData?.rates?.MXN;
        if (typeof mxnRate === "number" && mxnRate > 5 && mxnRate < 50) {
          rate = Math.round((mxnRate + Number.EPSILON) * 10000) / 10000;
          source = "BANXICO_MARKET_LIVE";
        }
      }
    } catch (fxErr) {
      console.warn("Live market FX fetch error, using safe fallback:", fxErr);
    }
  }

  cachedRate = {
    rate,
    source,
    timestamp: now,
    date: dateStr,
  };

  return NextResponse.json({
    success: true,
    rate,
    source,
    date: dateStr,
    cached: false,
    lastUpdated: new Date(now).toISOString(),
  });
}
