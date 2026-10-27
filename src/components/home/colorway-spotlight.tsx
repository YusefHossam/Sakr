"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Price } from "@/components/product/price";
import type { ModelSpotlight } from "@/lib/catalog";

/** One model, all its colorways: hover or tap a swatch to swap the big shot. */
export function ColorwaySpotlight({ spotlight }: { spotlight: ModelSpotlight }) {
  const t = useTranslations("common");
  const [active, setActive] = useState(0);
  const current = spotlight.colorways[active];

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
      <Link href={`/product/${current.slug}`} className="group relative aspect-[4/3] overflow-hidden border border-ash bg-tile">
        {current.image && (
          // eslint-disable-next-line @next/next/no-img-element -- remote CDN image
          <img key={current.slug} src={current.image} alt={current.title} className="size-full object-contain p-8 mix-blend-multiply transition-transform duration-500 group-hover:scale-105" style={{ animation: "fade-up 0.35s ease both" }} />
        )}
        <span className="absolute start-4 top-4 text-[11px] tracking-[0.3em] text-dust uppercase" dir="ltr">
          {String(active + 1).padStart(2, "0")} / {String(spotlight.colorways.length).padStart(2, "0")}
        </span>
      </Link>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1" dir="ltr">
          <p className="text-[11px] tracking-[0.3em] text-dust uppercase">{spotlight.brand}</p>
          <p className="street-heading text-4xl leading-none">{spotlight.model}</p>
          <p className="text-lg text-steel">{current.colorway}</p>
        </div>
        <Price price={current.price} salePrice={current.salePrice} size="lg" />
        <p className="text-xs tracking-[0.2em] text-dust uppercase">{t("colorways", { count: spotlight.colorways.length })}</p>
        <ul className="grid max-h-[300px] grid-cols-5 gap-2 overflow-y-auto pe-1 sm:grid-cols-6" role="listbox" aria-label={spotlight.model}>
          {spotlight.colorways.map((c, i) => (
            <li key={c.slug} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                title={c.colorway ?? c.title}
                aria-label={c.colorway ?? c.title}
                className={`aspect-square w-full overflow-hidden border bg-tile transition-colors ${i === active ? "border-bone" : "border-ash hover:border-dust"}`}
              >
                {c.image && (
                  // eslint-disable-next-line @next/next/no-img-element -- remote CDN thumbnail
                  <img src={c.image} alt="" loading="lazy" className="size-full object-contain p-1 mix-blend-multiply" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
