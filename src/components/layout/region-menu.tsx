"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { useRegion } from "@/components/providers/region-provider";
import { useRouter } from "@/i18n/navigation";
import { CURRENCIES } from "@/lib/regions";

const pill = "flex items-center gap-2 rounded-full border border-ash px-2.5 py-1.5 text-xs text-steel transition-colors hover:border-iron hover:text-bone";

/** One tap switches between Arabic and English on the same page. */
export function LanguageSwitch() {
  const locale = useLocale();
  const router = useRouter();
  const other = locale === "ar" ? "en" : "ar";
  return (
    <button
      type="button"
      onClick={() => {
        // Read the URL at click time (usePathname here would make every page wait on the URL).
        const path = location.pathname.replace(new RegExp(`^/${locale}(?=/|$)`), "") || "/";
        router.replace(`${path}${location.search}`, { locale: other });
      }}
      aria-label={other === "en" ? "Switch to English" : "التحويل للعربي"}
      lang={other}
      className={`${pill} min-w-11 justify-center font-medium`}
    >
      {other === "en" ? "EN" : "عربي"}
    </button>
  );
}

/** Display currency, independent from the language. */
export function CurrencyMenu() {
  const locale = useLocale();
  const { currency, setCurrency } = useRegion();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const names = useMemo(() => {
    try {
      return new Intl.DisplayNames([locale === "ar" ? "ar" : "en"], { type: "currency" });
    } catch {
      return null;
    }
  }, [locale]);
  const flag = CURRENCIES.find((c) => c.code === currency)?.flag ?? "EG";

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    addEventListener("pointerdown", close);
    addEventListener("keydown", close);
    return () => {
      removeEventListener("pointerdown", close);
      removeEventListener("keydown", close);
    };
  }, [open]);

  const label = locale === "ar" ? "العملة" : "Currency";
  return (
    <div ref={box} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="listbox" aria-label={`${label}: ${currency}`} className={pill}>
        <span className={`fi fi-${flag.toLowerCase()} rounded-[2px]`} aria-hidden="true" />
        <span dir="ltr">{currency}</span>
      </button>
      {open && (
        <ul role="listbox" aria-label={label} className="absolute end-0 top-full z-50 mt-2 grid max-h-[70vh] w-64 grid-cols-1 overflow-y-auto rounded-lg border border-ash bg-pitch/95 p-1.5 shadow-2xl backdrop-blur-md">
          {CURRENCIES.map((c) => (
            <li key={c.code} role="option" aria-selected={c.code === currency}>
              <button
                type="button"
                onClick={() => {
                  setCurrency(c.code);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-start text-sm transition-colors hover:bg-ash ${c.code === currency ? "bg-ash text-chrome" : "text-steel"}`}
              >
                <span className={`fi fi-${c.flag.toLowerCase()} shrink-0 rounded-[2px]`} aria-hidden="true" />
                <span className="flex-1">{names?.of(c.code) ?? c.code}</span>
                <span className="text-xs text-dust" dir="ltr">{c.code}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const THEME_KEY = "sakr_theme";

/** Light / dark switch. The inline head script applies the saved choice before paint, so there is no flash. */
export function ThemeToggle() {
  const locale = useLocale();
  const [light, setLight] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLight(document.documentElement.dataset.theme === "light"), 0);
    return () => clearTimeout(t);
  }, []);

  const toggle = () => {
    const next = !light;
    setLight(next);
    if (next) document.documentElement.dataset.theme = "light";
    else delete document.documentElement.dataset.theme;
    try {
      if (next) localStorage.setItem(THEME_KEY, "light");
      else localStorage.removeItem(THEME_KEY);
    } catch {}
  };

  const label = light ? (locale === "ar" ? "الوضع الغامق" : "Dark mode") : locale === "ar" ? "الوضع الفاتح" : "Light mode";
  return (
    <button type="button" onClick={toggle} aria-label={label} aria-pressed={light} title={label} className={`${pill} size-8 justify-center px-0`}>
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {light ? (
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
        ) : (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        )}
      </svg>
    </button>
  );
}
