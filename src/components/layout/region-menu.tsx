"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRegion } from "@/components/providers/region-provider";
import { REGIONS } from "@/lib/regions";

/** Flag button → list of countries; picking one switches currency (and language). */
export function RegionMenu() {
  const t = useTranslations();
  const { region, setRegion } = useRegion();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

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

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t("header.region")}
        className="flex items-center gap-2 rounded-full border border-ash px-2.5 py-1.5 text-xs text-steel transition-colors hover:border-iron hover:text-bone"
      >
        <span className={`fi fi-${region.code.toLowerCase()} rounded-[2px]`} aria-hidden="true" />
        <span dir="ltr">{region.currency}</span>
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={t("header.region")}
          className="absolute end-0 top-full z-50 mt-2 grid max-h-[70vh] w-72 grid-cols-1 overflow-y-auto rounded-lg border border-ash bg-pitch/95 p-1.5 shadow-2xl backdrop-blur-md"
        >
          {REGIONS.map((r) => (
            <li key={r.code} role="option" aria-selected={r.code === region.code}>
              <button
                type="button"
                onClick={() => {
                  setRegion(r.code);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-start text-sm transition-colors hover:bg-ash ${
                  r.code === region.code ? "bg-ash text-chrome" : "text-steel"
                }`}
              >
                <span className={`fi fi-${r.code.toLowerCase()} shrink-0 rounded-[2px]`} aria-hidden="true" />
                <span className="flex-1">{t(`regions.${r.code}`)}</span>
                <span className="text-xs text-dust" dir="ltr">
                  {r.currency} · {r.locale === "ar" ? "ع" : "EN"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
