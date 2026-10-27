// Countries in the flag menu. Picking one sets the display currency and the default language.
// Client-safe: no server imports.
import type { Locale } from "@/i18n/routing";

export type Region = { code: string; currency: string; locale: Locale };

const arab = (code: string, currency: string): Region => ({ code, currency, locale: "ar" });
const intl = (code: string, currency: string): Region => ({ code, currency, locale: "en" });

export const REGIONS: Region[] = [
  arab("EG", "EGP"), arab("SA", "SAR"), arab("AE", "AED"), arab("KW", "KWD"), arab("QA", "QAR"),
  arab("BH", "BHD"), arab("OM", "OMR"), arab("JO", "JOD"), arab("LB", "USD"), arab("IQ", "IQD"),
  arab("MA", "MAD"), arab("DZ", "DZD"), arab("TN", "TND"), arab("LY", "LYD"), arab("SD", "SDG"),
  intl("US", "USD"), intl("GB", "GBP"), intl("DE", "EUR"), intl("FR", "EUR"), intl("IT", "EUR"),
  intl("ES", "EUR"), intl("NL", "EUR"), intl("CA", "CAD"), intl("AU", "AUD"), intl("TR", "TRY"),
  intl("CH", "CHF"), intl("SE", "SEK"), intl("JP", "JPY"), intl("IN", "INR"), intl("BR", "BRL"),
];

export const DEFAULT_REGION = REGIONS[0];
export const REGION_STORAGE_KEY = "sakr-region";

export const findRegion = (code: string | null | undefined): Region =>
  REGIONS.find((r) => r.code === code) ?? DEFAULT_REGION;

/** EGP → currency multipliers. */
export type Rates = Record<string, number>;
