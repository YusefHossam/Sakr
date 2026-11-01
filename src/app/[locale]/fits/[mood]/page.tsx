import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getLocale } from "next-intl/server";
import { MoodChips } from "@/components/mood/mood-chips";
import { MoodTint } from "@/components/mood/mood-tint";
import { PageHeader } from "@/components/shop/page-header";
import { Price } from "@/components/product/price";
import { Link } from "@/i18n/navigation";
import { getFits } from "@/lib/catalog";
import { isMood, type Mood, MOOD_KEYS, MOODS } from "@/lib/moods";
import { REASON_TEXT } from "@/lib/style";

export function generateStaticParams() {
  return MOOD_KEYS.map((mood) => ({ mood }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/fits/[mood]">): Promise<Metadata> {
  const { mood } = await params;
  return isMood(mood) ? { title: `${MOODS[mood].en} fits` } : {};
}

export default async function FitsPage({ params }: PageProps<"/[locale]/fits/[mood]">) {
  const [{ mood }, locale] = await Promise.all([params, getLocale()]);
  if (!isMood(mood)) notFound();
  const lang = locale === "ar" ? "ar" : "en";
  return (
    <div className="mx-auto max-w-[1500px] px-4 pt-4 md:px-8">
      <MoodTint mood={mood} />
      <PageHeader eyebrow={lang === "ar" ? "فيتس" : "FITS"} title={`${MOODS[mood][lang]} ${lang === "ar" ? "فيت" : "fits"}`} text={lang === "ar" ? "لوكات كاملة مركّبة على القصّة واللون والمود. بتتغير كل يوم." : "Whole looks built on cut, colour and mood. They change every day."} />
      <div className="mb-10"><MoodChips active={mood} base="fits" /></div>
      <Suspense fallback={<div className="h-96 animate-pulse bg-smoke" />}>
        <FitList mood={mood} lang={lang} />
      </Suspense>
    </div>
  );
}

async function FitList({ mood, lang }: { mood: Mood; lang: "ar" | "en" }) {
  await connection(); // the daily seed reads the clock
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo" }).format(new Date());
  const fits = await getFits(mood, day);

  return (
    <>
      {fits.length ? (
        <div className="grid gap-10 lg:grid-cols-2">
          {fits.map(({ outfit, cards }, i) => (
            <article key={i} className="flex flex-col gap-4 border border-ash p-4">
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {cards.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/product/${c.slug}`} className="flex flex-col gap-1">
                      <span className="aspect-square bg-tile">
                        {/* eslint-disable-next-line @next/next/no-img-element -- remote CDN thumbnail */}
                        {c.image && <img src={c.image} alt={c.title} loading="lazy" className="size-full object-contain p-2 mix-blend-multiply" />}
                      </span>
                      <span className="text-[10px] tracking-[0.2em] text-dust uppercase" dir="ltr">{c.brand}</span>
                      <span className="line-clamp-2 text-xs text-steel" dir="ltr">{c.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap items-end justify-between gap-3 border-t border-ash pt-3">
                <ul className="flex flex-col gap-1 text-xs text-steel">
                  <li className="text-sm text-bone">{outfit.formula[lang]}</li>
                  {outfit.why.filter((k) => REASON_TEXT[k][lang]).slice(0, 2).map((k) => (
                    <li key={k} className={k.startsWith("pick") ? "text-bone" : ""}>· {REASON_TEXT[k][lang]}</li>
                  ))}
                </ul>
                <div className="text-end">
                  <p className="text-[10px] tracking-[0.2em] text-dust uppercase">{lang === "ar" ? "إجمالي اللوك" : "Total"}</p>
                  <Price price={cards.reduce((s, c) => s + (c.salePrice ?? c.price), 0)} size="lg" />
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="py-24 text-center text-steel">{lang === "ar" ? "مفيش لوكات متاحة دلوقتي." : "No fits available right now."}</p>
      )}
    </>
  );
}
