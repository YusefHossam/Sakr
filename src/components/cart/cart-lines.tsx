"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Price } from "@/components/product/price";
import { updateCartLine } from "@/lib/actions/cart";
import type { CartLine } from "@/lib/shop-data";

export function CartLines({ lines }: { lines: CartLine[] }) {
  const t = useTranslations("cart");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const set = (l: CartLine, qty: number) =>
    startTransition(async () => {
      const res = await updateCartLine({ slug: l.slug, size: l.size, color: l.color, qty });
      if (!res.ok) setError(`${l.title}: ${t("unavailable")}`);
      else setError(null);
      router.refresh();
    });

  return (
    <div className={`flex flex-col divide-y divide-ash border-y border-ash ${pending ? "opacity-60" : ""}`}>
      {error && <p className="py-3 text-sm text-blood" role="alert">{error}</p>}
      {lines.map((l) => (
        <div key={`${l.slug}-${l.size}-${l.color}`} className="flex gap-4 py-5">
          <Link href={`/product/${l.slug}`} className="size-24 shrink-0 bg-tile md:size-28">
            {/* eslint-disable-next-line @next/next/no-img-element -- remote CDN image */}
            {l.image && <img src={l.image} alt={l.title} className="size-full object-contain p-2 mix-blend-multiply" />}
          </Link>
          <div className="flex flex-1 flex-col gap-1.5">
            <p className="text-[11px] tracking-[0.2em] text-dust uppercase" dir="ltr">{l.brand}</p>
            <Link href={`/product/${l.slug}`} className="text-sm text-bone hover:underline" dir="ltr">{l.title}</Link>
            <p className="text-xs text-steel">
              {l.size && <>{t("size")}: <span dir="ltr">{l.size}</span></>} {l.color && <>· {t("color")}: {l.color}</>}
            </p>
            {l.qty > l.stock && <p className="text-xs text-blood">{t("unavailable")}</p>}
            <div className="mt-auto flex flex-wrap items-center gap-3">
              <label className="sr-only" htmlFor={`qty-${l.slug}-${l.size}`}>{t("qty")}</label>
              <select
                id={`qty-${l.slug}-${l.size}`}
                value={l.qty}
                onChange={(e) => set(l, Number(e.target.value))}
                className="min-h-10 border border-ash bg-smoke px-2 text-bone"
              >
                {Array.from({ length: Math.max(l.qty, Math.min(10, l.stock)) }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <button type="button" onClick={() => set(l, 0)} className="min-h-10 text-xs text-dust underline underline-offset-4 hover:text-bone">
                {t("remove")}
              </button>
            </div>
          </div>
          <div className="text-end">
            <Price price={l.listPrice * l.qty} salePrice={l.unitPrice < l.listPrice ? l.unitPrice * l.qty : null} />
          </div>
        </div>
      ))}
    </div>
  );
}
