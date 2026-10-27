"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export type AdSlide = {
  id: string;
  eyebrow: string;
  title: string;
  text: string;
  href: string;
  images: string[];
  hot?: boolean;
};

const INTERVAL_MS = 6500;

/** Home ad banner: rotates through running promotions (discounts first). */
export function AdCarousel({ slides }: { slides: AdSlide[] }) {
  const t = useTranslations("home");
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const go = useCallback((i: number) => setIndex((i + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), INTERVAL_MS);
    return () => clearInterval(id);
  }, [paused, slides.length]);

  if (!slides.length) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label={t("adsLabel")}
      className="relative mx-auto max-w-[1500px] px-4 md:px-8"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="relative h-[440px] overflow-hidden border border-ash bg-smoke md:h-[380px]">
        {slides.map((s, i) => (
          <div
            key={s.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} / ${slides.length}`}
            aria-hidden={i !== index}
            className={`absolute inset-0 grid grid-rows-[1fr_auto] transition-opacity duration-700 md:grid-cols-[1.1fr_1fr] md:grid-rows-1 ${
              i === index ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <div className="relative order-2 flex flex-col justify-center gap-3 p-6 md:order-1 md:p-12">
              <p className={`text-[11px] tracking-[0.35em] uppercase ${s.hot ? "text-blood" : "text-dust"}`}>{s.eyebrow}</p>
              <h2 className="street-heading text-[clamp(1.8rem,4vw,3.4rem)] leading-[0.95]" dir="auto">{s.title}</h2>
              <p className="max-w-md text-sm text-steel">{s.text}</p>
              <Link
                href={s.href}
                tabIndex={i === index ? 0 : -1}
                className={`mt-2 self-start px-7 py-3 font-display text-sm tracking-[0.3em] uppercase transition-colors ${
                  s.hot ? "bg-blood text-chrome hover:bg-chrome hover:text-ink" : "border border-bone/70 text-bone hover:bg-bone hover:text-ink"
                }`}
              >
                {t("heroCta")}
              </Link>
            </div>
            <div className="order-1 grid grid-cols-4 gap-px bg-ash md:order-2 md:grid-cols-2" aria-hidden="true">
              {s.images.slice(0, 4).map((src, k) => (
                <div key={k} className="bg-tile">
                  {/* eslint-disable-next-line @next/next/no-img-element -- remote CDN images */}
                  <img src={src} alt="" loading="lazy" className="size-full max-h-[120px] object-contain p-2 mix-blend-multiply md:max-h-none md:p-5" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`${i + 1}`}
                aria-current={i === index}
                className={`h-1 rounded-full transition-all ${i === index ? "w-10 bg-bone" : "w-5 bg-iron hover:bg-dust"}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => go(index - 1)} aria-label={t("previous")} className="grid size-11 place-items-center border border-ash text-steel hover:text-chrome">
              <span className="rtl:rotate-180" aria-hidden="true">←</span>
            </button>
            <button type="button" onClick={() => go(index + 1)} aria-label={t("nextSlide")} className="grid size-11 place-items-center border border-ash text-steel hover:text-chrome">
              <span className="rtl:rotate-180" aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
