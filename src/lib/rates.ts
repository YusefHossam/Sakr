import "server-only";
import { cacheLife } from "next/cache";
import type { Rates } from "./regions";

// Used when the free rates API can't be reached (approximate, EGP → currency).
const FALLBACK: Rates = {
  EGP: 1, USD: 0.0206, EUR: 0.019, GBP: 0.0156, SAR: 0.0773, AED: 0.0757, KWD: 0.0063, QAR: 0.075,
  BHD: 0.0078, OMR: 0.0079, JOD: 0.0146, IQD: 27, MAD: 0.19, DZD: 2.75, TND: 0.061, LYD: 0.1, SDG: 12.4,
  CAD: 0.0285, AUD: 0.0315, TRY: 0.86, CHF: 0.0178, SEK: 0.2, JPY: 3.1, INR: 1.78, BRL: 0.115,
};

/** Daily EGP exchange rates from open.er-api.com (free, no key). */
export async function getRates(): Promise<Rates> {
  "use cache";
  cacheLife("days");
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/EGP");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { result: string; rates: Rates };
    if (data.result !== "success") throw new Error(data.result);
    return { ...FALLBACK, ...data.rates };
  } catch (error) {
    console.warn("[rates] using fallback rates:", error);
    return FALLBACK;
  }
}
