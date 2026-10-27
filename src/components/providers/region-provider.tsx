"use client";

import { createContext, use, useCallback, useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { DEFAULT_REGION, findRegion, REGION_STORAGE_KEY, type Rates, type Region } from "@/lib/regions";

type RegionContextValue = {
  region: Region;
  setRegion: (code: string) => void;
  /** Formats an EGP amount in the visitor's currency. */
  format: (egp: number) => string;
  formatEgp: (egp: number) => string;
};

const RegionContext = createContext<RegionContextValue | null>(null);

export function RegionProvider({ rates, children }: { rates: Rates; children: React.ReactNode }) {
  const locale = useLocale();
  const router = useRouter();
  const [region, setRegionState] = useState<Region>(DEFAULT_REGION);

  // The saved choice only exists in the browser, so it is read after hydration.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(REGION_STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from browser storage
      if (saved) setRegionState(findRegion(saved));
    } catch {}
  }, []);

  const setRegion = useCallback(
    (code: string) => {
      const next = findRegion(code);
      setRegionState(next);
      try {
        localStorage.setItem(REGION_STORAGE_KEY, next.code);
      } catch {}
      if (next.locale !== locale) {
        // Read the URL at click time (usePathname here would make every page wait on the URL).
        const path = location.pathname.replace(new RegExp(`^/${locale}(?=/|$)`), "") || "/";
        router.replace(`${path}${location.search}`, { locale: next.locale });
      }
    },
    [locale, router],
  );

  const value = useMemo<RegionContextValue>(() => {
    // Latin digits read better next to brand names and sizes, even in Arabic.
    const tag = locale === "ar" ? "ar-EG-u-nu-latn" : "en-US";
    const money = (amount: number, currency: string) =>
      new Intl.NumberFormat(tag, {
        style: "currency",
        currency,
        maximumFractionDigits: amount >= 100 ? 0 : 2,
      }).format(amount);
    return {
      region,
      setRegion,
      format: (egp) => money(egp * (rates[region.currency] ?? 1), rates[region.currency] ? region.currency : "EGP"),
      formatEgp: (egp) => new Intl.NumberFormat(tag, { maximumFractionDigits: 0 }).format(egp),
    };
  }, [locale, rates, region, setRegion]);

  return <RegionContext value={value}>{children}</RegionContext>;
}

export function useRegion(): RegionContextValue {
  const value = use(RegionContext);
  if (!value) throw new Error("useRegion must be used inside <RegionProvider>");
  return value;
}
