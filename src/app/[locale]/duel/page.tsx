import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { getLocale } from "next-intl/server";
import { DuelBoard, type Duel, type DuelLook } from "@/components/social/duel-board";
import { MoodChips } from "@/components/mood/mood-chips";
import { PageHeader } from "@/components/shop/page-header";
import { Price } from "@/components/product/price";
import { Link } from "@/i18n/navigation";
import { getSession } from "@/lib/auth/session";
import { getCardsBySlugs, getFits } from "@/lib/catalog";
import { isMood, MOOD_KEYS, type Mood } from "@/lib/moods";
import { getWeeklyBoard, lookKey } from "@/lib/social-data";

export const metadata: Metadata = { title: "Hot or Not" };

export default function DuelPage({ searchParams }: PageProps<"/[locale]/duel">) {
  return (
    <div className="mx-auto max-w-[1100px] px-4 pt-4 md:px-8">
      <Suspense fallback={<div className="h-96 animate-pulse bg-smoke" />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Content({ searchParams }: Pick<PageProps<"/[locale]/duel">, "searchParams">) {
  await connection();
  const [{ mood: raw }, lang, session] = await Promise.all([searchParams, getLocale().then((l) => (l === "ar" ? "ar" : "en")), getSession()]);
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo" }).format(new Date());
  const mood: Mood = typeof raw === "string" && isMood(raw) ? raw : MOOD_KEYS[Number(day.replaceAll("-", "")) % MOOD_KEYS.length];

  const fits = await getFits(mood, day, 6);
  const looks: DuelLook[] = fits.map((f) => ({ key: lookKey(f.cards.map((c) => c.slug)), slugs: f.cards.map((c) => c.slug), cards: f.cards, total: f.cards.reduce((s, c) => s + (c.salePrice ?? c.price), 0) }));
  const duels: Duel[] = [];
  for (let i = 0; i + 1 < looks.length; i += 2) duels.push({ a: looks[i], b: looks[i + 1] });

  const board = await getWeeklyBoard(3);
  const boardCards = await Promise.all(board.map((w) => getCardsBySlugs(w.slugs)));

  return (
    <>
      <PageHeader
        eyebrow="HOT OR NOT"
        title={lang === "ar" ? "مين الأحلى؟" : "Which one's hotter?"}
        text={lang === "ar" ? "فيتس وراء بعض، اختار الأحلى. صوتك بيحدد فيت الأسبوع." : "Two fits, pick the better one. Your vote decides the fit of the week."}
      />
      <div className="mb-10"><MoodChips active={mood} base="duel" /></div>
      <DuelBoard key={mood} duels={duels} mood={mood} loggedIn={!!session} />

      <section className="mt-16 flex flex-col gap-4">
        <h2 className="street-heading text-3xl">{lang === "ar" ? "فيت الأسبوع" : "Fit of the week"}</h2>
        {board.length ? (
          <ol className="flex flex-col gap-4">
            {board.map((w, n) => (
              <li key={w.key} className="flex flex-col gap-3 border border-ash p-4">
                <p className="text-xs tracking-[0.3em] text-dust uppercase">
                  #{n + 1} · {w.wins} {lang === "ar" ? "صوت من" : "wins of"} {w.votes}
                </p>
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {boardCards[n].map((c) => (
                    <li key={c.slug}>
                      <Link href={`/product/${c.slug}`} className="flex flex-col gap-1">
                        <span className="aspect-square bg-tile">
                          {/* eslint-disable-next-line @next/next/no-img-element -- remote CDN thumbnail */}
                          {c.image && <img src={c.image} alt={c.title} loading="lazy" className="size-full object-contain p-2 mix-blend-multiply" />}
                        </span>
                        <span className="line-clamp-1 text-xs text-steel" dir="ltr">{c.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="self-end"><Price price={boardCards[n].reduce((s, c) => s + (c.salePrice ?? c.price), 0)} /></div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-steel">{lang === "ar" ? "لسه مفيش أصوات كفاية. ابدأ صوّت." : "Not enough votes yet. Start voting."}</p>
        )}
      </section>
    </>
  );
}
