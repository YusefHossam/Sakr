import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getLocale } from "next-intl/server";
import { BadgeGrid } from "@/components/social/badge-grid";
import { Link } from "@/i18n/navigation";
import { badgesFor } from "@/lib/badges";
import { getPublicProfile } from "@/lib/social-data";

export const metadata: Metadata = { title: "Wardrobe" };

export default function ProfilePage({ params }: PageProps<"/[locale]/u/[handle]">) {
  return (
    <div className="mx-auto max-w-[1100px] px-4 pt-8 md:px-8">
      <Suspense fallback={<div className="h-96 animate-pulse bg-smoke" />}>
        <Content params={params} />
      </Suspense>
    </div>
  );
}

async function Content({ params }: Pick<PageProps<"/[locale]/u/[handle]">, "params">) {
  const { handle } = await params;
  await connection(); // live data per request (orders, votes, crew)
  const profile = await getPublicProfile(handle);
  if (!profile) notFound();
  const lang = (await getLocale()) === "ar" ? "ar" : "en";
  const badges = badgesFor(profile.stats, lang);
  const earned = badges.filter((b) => b.earned).length;

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <p className="text-xs tracking-[0.3em] text-dust uppercase" dir="ltr">@{profile.handle}</p>
        <h1 className="street-heading text-4xl md:text-5xl">{profile.name}</h1>
        <p className="text-xs tracking-[0.3em] text-dust uppercase">
          {lang === "ar" ? "المستوى" : "Level"}: <span className="font-display text-xl text-chrome">{profile.level.toUpperCase()}</span> · {earned}/{badges.length} {lang === "ar" ? "شارة" : "badges"}
        </p>
        {profile.bio && <p className="max-w-xl text-sm text-steel" dir="auto">{profile.bio}</p>}
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="street-heading text-2xl">{lang === "ar" ? "الشارات" : "Badges"}</h2>
        <BadgeGrid badges={badges} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="street-heading text-2xl">{lang === "ar" ? `الدولاب (${profile.wardrobe.length})` : `Wardrobe (${profile.wardrobe.length})`}</h2>
        {profile.wardrobe.length ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {profile.wardrobe.map((w) => (
              <li key={w.slug}>
                <Link href={`/product/${w.slug}`} className="flex flex-col gap-1">
                  <span className="aspect-square bg-tile">
                    {/* eslint-disable-next-line @next/next/no-img-element -- remote CDN thumbnail */}
                    {w.image && <img src={w.image} alt={w.title} loading="lazy" className="size-full object-contain p-2 mix-blend-multiply" />}
                  </span>
                  <span className="text-[10px] tracking-[0.2em] text-dust uppercase" dir="ltr">{w.brand}</span>
                  <span className="line-clamp-2 text-xs text-steel" dir="ltr">{w.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-steel">{lang === "ar" ? "لسه مفيش قطع متسلّمة." : "No delivered pieces yet."}</p>
        )}
      </section>
    </div>
  );
}
