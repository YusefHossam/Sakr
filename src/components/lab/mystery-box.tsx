"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Price } from "@/components/product/price";
import { useRouter } from "@/i18n/navigation";
import { addToCart } from "@/lib/actions/cart";

type Tier = { slug: string; price: number; worth: number };

export function MysteryBox({ tiers }: { tiers: Tier[] }) {
  const t = useTranslations("mystery");
  const router = useRouter();
  const [shaking, setShaking] = useState<string | null>(null);
  const [opened, setOpened] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {tiers.map((tier, i) => (
        <article key={tier.slug} className={`relative flex flex-col items-center gap-5 overflow-hidden border p-6 text-center ${i === 2 ? "border-blood/60" : "border-ash"}`}>
          <button
            type="button"
            onClick={() => {
              setShaking(tier.slug);
              setTimeout(() => {
                setShaking(null);
                setOpened(tier.slug);
              }, 900);
            }}
            className="relative size-48"
            aria-label={t("open")}
            style={shaking === tier.slug ? { animation: "glitch 0.15s steps(2,end) 6" } : undefined}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- our own SVG */}
            <img src="/mystery/box.svg" alt="" className={`size-full object-contain transition-transform duration-500 ${opened === tier.slug ? "-translate-y-3 scale-90 opacity-60" : ""}`} />
            {opened === tier.slug && (
              <span className="absolute inset-0 flex items-center justify-center gap-2" aria-hidden="true">
                {["?", "?", "?"].map((q, k) => (
                  <span key={k} className="grid size-12 place-items-center border border-bone bg-ink font-gothic text-3xl text-chrome" style={{ animation: `fade-up 0.5s ease ${k * 0.15}s both` }}>{q}</span>
                ))}
              </span>
            )}
          </button>
          <p className="street-heading text-3xl" dir="ltr">{t("tier", { price: tier.price.toLocaleString("en") })}</p>
          <Price price={tier.price} size="lg" />
          <p className="text-xs text-blood">{t("worth", { price: `${tier.worth.toLocaleString("en")} EGP` })}</p>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await addToCart({ slug: tier.slug, size: "ONE", color: null, qty: 1 });
                if (!res.ok && res.error === "login") router.push("/login?next=/mystery-box");
                else router.push("/cart");
              })
            }
            className="min-h-12 w-full bg-bone font-display tracking-[0.3em] text-ink uppercase hover:bg-chrome disabled:opacity-50"
          >
            {t("get")}
          </button>
        </article>
      ))}
    </div>
  );
}
