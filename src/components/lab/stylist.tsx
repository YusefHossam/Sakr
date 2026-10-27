"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Price } from "@/components/product/price";
import { Link } from "@/i18n/navigation";
import { styleMe, type Outfit } from "@/lib/actions/stylist";

export function Stylist() {
  const t = useTranslations("stylist");
  const locale = useLocale() as "ar" | "en";
  const [prompt, setPrompt] = useState("");
  const [outfits, setOutfits] = useState<Outfit[] | null>(null);
  const [source, setSource] = useState<"gemini" | "rules" | null>(null);
  const [pending, startTransition] = useTransition();

  const ask = (text: string) => {
    setPrompt(text);
    startTransition(async () => {
      const res = await styleMe(text, locale);
      setOutfits(res.ok ? res.outfits : []);
      setSource(res.ok ? res.source : null);
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          if (prompt.trim()) ask(prompt);
        }}
      >
        <label htmlFor="stylist-prompt" className="sr-only">{t("placeholder")}</label>
        <input id="stylist-prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={t("placeholder")} maxLength={200} className="min-h-14 flex-1 border border-ash bg-smoke px-5 text-lg text-bone placeholder:text-dust focus:border-steel focus:outline-none" />
        <button type="submit" disabled={pending} className="min-h-14 bg-bone px-10 font-display tracking-[0.3em] text-ink uppercase disabled:opacity-50">{pending ? "…" : t("ask")}</button>
      </form>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-dust">{t("examples")}</span>
        {(["ex1", "ex2", "ex3"] as const).map((k) => (
          <button key={k} type="button" onClick={() => ask(t(k))} className="border border-ash px-3 py-1.5 text-steel hover:border-dust hover:text-bone">{t(k)}</button>
        ))}
      </div>

      {pending && <p className="animate-pulse text-sm text-steel">{t("thinking")}</p>}
      {source === "rules" && <p className="text-[11px] text-dust">{t("offline")}</p>}
      {outfits && !outfits.length && !pending && <p className="text-sm text-steel">{t("none")}</p>}

      <div className="grid gap-6 lg:grid-cols-3">
        {outfits?.map((o, n) => (
          <article key={n} className="flex flex-col gap-4 border border-ash p-5" style={{ animation: `fade-up 0.4s ease ${n * 0.12}s both` }}>
            <header className="flex flex-col gap-1">
              <p className="text-[11px] tracking-[0.3em] text-dust uppercase">{t("outfit", { n: n + 1 })}</p>
              {o.name && <h3 className="street-heading text-2xl" dir="auto">{o.name}</h3>}
              {o.why && <p className="text-xs text-steel" dir="auto">{o.why}</p>}
            </header>
            <ul className="grid grid-cols-2 gap-2">
              {o.items.map((i) => (
                <li key={i.slug}>
                  <Link href={`/product/${i.slug}`} className="group flex flex-col gap-1">
                    <span className="aspect-square bg-tile">
                      {/* eslint-disable-next-line @next/next/no-img-element -- remote CDN image */}
                      {i.image && <img src={i.image} alt={i.title} className="size-full object-contain p-2 mix-blend-multiply transition-transform group-hover:scale-105" />}
                    </span>
                    <span className="truncate text-[11px] text-steel" dir="ltr">{i.brand}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-auto flex items-center justify-between border-t border-ash pt-3">
              <span className="text-xs text-dust">{t("total")}</span>
              <Price price={o.total} />
            </div>
            <Link href={`/fit-builder?items=${o.items.map((i) => i.slug).join(",")}`} className="min-h-11 border border-bone/70 text-center text-xs leading-[2.75rem] tracking-[0.2em] text-bone uppercase hover:bg-bone hover:text-ink">
              {t("openBuilder")}
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
