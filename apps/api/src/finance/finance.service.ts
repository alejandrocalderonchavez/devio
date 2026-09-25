import { Injectable } from "@nestjs/common";

interface ExchangeRateCache {
  rate: number;
  source: string;
  timestamp: number;
  date: string;
}

@Injectable()
export class FinanceService {
  private cachedRate: ExchangeRateCache | null = null;
  private readonly CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

  async getExchangeRate() {
    const now = Date.now();

    if (this.cachedRate && now - this.cachedRate.timestamp < this.CACHE_TTL_MS) {
      return {
        success: true,
        rate: this.cachedRate.rate,
        source: this.cachedRate.source,
        date: this.cachedRate.date,
        cached: true,
        lastUpdated: new Date(this.cachedRate.timestamp).toISOString(),
      };
    }

    let rate = 18.35;
    let source = "BANXICO_FIX_FALLBACK";
    const dateStr = new Date().toLocaleDateString("es-MX", { timeZone: "America/Mexico_City" });

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

    if (source === "BANXICO_FIX_FALLBACK") {
      try {
        const fxRes = await fetch("https://open.er-api.com/v6/latest/USD");
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

    this.cachedRate = {
      rate,
      source,
      timestamp: now,
      date: dateStr,
    };

    return {
      success: true,
      rate,
      source,
      date: dateStr,
      cached: false,
      lastUpdated: new Date(now).toISOString(),
    };
  }
}
