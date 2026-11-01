"use client";

import { createContext, use, useCallback, useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { CURRENCIES, CURRENCY_STORAGE_KEY, DEFAULT_CURRENCY, findRegion, REGION_STORAGE_KEY, type Rates } from "@/lib/regions";

type RegionContextValue = {
  /** The display currency. Independent from the language. */
  currency: string;
  setCurrency: (code: string) => void;
  /** Formats an EGP amount in the visitor's currency. */
  format: (egp: number) => string;
  formatEgp: (egp: number) => string;
};

const RegionContext = createContext<RegionContextValue | null>(null);

export function RegionProvider({ rates, children }: { rates: Rates; children: React.ReactNode }) {
  const locale = useLocale();
  const [currency, setCurrencyState] = useState(DEFAULT_CURRENCY);

  // The saved choice only exists in the browser, so it is read after hydration.
  // Visitors from before the split had a country saved: keep its currency.
  useEffect(() => {
    try {
      const old = localStorage.getItem(REGION_STORAGE_KEY);
      const saved = localStorage.getItem(CURRENCY_STORAGE_KEY) ?? (old ? findRegion(old).currency : null);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from browser storage
      if (saved && CURRENCIES.some((c) => c.code === saved)) setCurrencyState(saved);
    } catch {}
  }, []);

  const setCurrency = useCallback((code: string) => {
    if (!CURRENCIES.some((c) => c.code === code)) return;
    setCurrencyState(code);
    try {
      localStorage.setItem(CURRENCY_STORAGE_KEY, code);
    } catch {}
  }, []);

  const value = useMemo<RegionContextValue>(() => {
    // Latin digits read better next to brand names and sizes, even in Arabic.
    const tag = locale === "ar" ? "ar-EG-u-nu-latn" : "en-US";
    const money = (amount: number, code: string) =>
      new Intl.NumberFormat(tag, { style: "currency", currency: code, maximumFractionDigits: amount >= 100 ? 0 : 2 }).format(amount);
    const known = rates[currency] ? currency : "EGP";
    return {
      currency: known,
      setCurrency,
      format: (egp) => money(egp * (rates[known] ?? 1), known),
      formatEgp: (egp) => new Intl.NumberFormat(tag, { maximumFractionDigits: 0 }).format(egp),
    };
  }, [locale, rates, currency, setCurrency]);

  return <RegionContext value={value}>{children}</RegionContext>;
}

export function useRegion(): RegionContextValue {
  const value = use(RegionContext);
  if (!value) throw new Error("useRegion must be used inside <RegionProvider>");
  return value;
}
