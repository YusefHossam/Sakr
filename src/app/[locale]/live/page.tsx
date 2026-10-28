import { Suspense } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { LiveChat } from "@/components/social/live-chat";
import { PageHeader } from "@/components/shop/page-header";
import { Price } from "@/components/product/price";
import { Link } from "@/i18n/navigation";
import { getSession } from "@/lib/auth/session";
import { getCardsBySlugs } from "@/lib/catalog";
import { safeEmbed } from "@/lib/live";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Live drop" };

export default function LivePage() {
  return (
    <div className="mx-auto max-w-[1300px] px-4 pt-4 md:px-8">
      <Suspense fallback={<div className="h-96 animate-pulse bg-smoke" />}>
        <Content />
      </Suspense>
    </div>
  );
}

async function Content() {
  const [lang, session, settings, h] = await Promise.all([getLocale().then((l) => (l === "ar" ? "ar" : "en")), getSession(), getSettings(), headers()]);
  const ar = lang === "ar";
  const live = settings.live;
  if (!live.active)
    return (
      <>
        <PageHeader eyebrow="LIVE" title={ar ? "اللايف" : "Live drop"} />
        <p className="py-16 text-center text-steel">{ar ? "مفيش لايف دلوقتي. هنعلن عن الموعد الجاي." : "Nothing live right now. We will announce the next one."}</p>
      </>
    );
  const embed = live.embedUrl ? safeEmbed(live.embedUrl, (h.get("host") ?? "localhost").split(":")[0]) : null;
  const cards = await getCardsBySlugs(live.productSlugs);

  return (
    <>
      <PageHeader eyebrow="● LIVE" title={live.title || (ar ? "لايف دروب" : "Live drop")} />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-6">
          {embed ? (
            <div className="aspect-video bg-ink">
              <iframe src={embed} title={live.title || "Live"} className="size-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
            </div>
          ) : (
            <p className="border border-ash p-10 text-center text-steel">{ar ? "البث هيبدأ في أي لحظة." : "The stream starts any moment."}</p>
          )}
          {cards.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="street-heading text-2xl">{ar ? "القطع في اللايف" : "On air"}</h2>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {cards.map((c) => (
                  <li key={c.slug} className="flex flex-col gap-1">
                    <Link href={`/product/${c.slug}`} className="flex flex-col gap-1">
                      <span className="aspect-square bg-tile">
                        {/* eslint-disable-next-line @next/next/no-img-element -- remote CDN thumbnail */}
                        {c.image && <img src={c.image} alt={c.title} loading="lazy" className="size-full object-contain p-2 mix-blend-multiply" />}
                      </span>
                      <span className="line-clamp-1 text-xs text-steel" dir="ltr">{c.title}</span>
                    </Link>
                    <Price price={c.price} salePrice={c.salePrice} />
                    <Link href={`/product/${c.slug}`} className="mt-1 min-h-10 border border-bone/70 py-2 text-center text-[11px] tracking-[0.25em] text-bone uppercase hover:bg-bone hover:text-ink">
                      {ar ? "اشتري" : "Buy"}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
        <LiveChat loggedIn={!!session} />
      </div>
    </>
  );
}
