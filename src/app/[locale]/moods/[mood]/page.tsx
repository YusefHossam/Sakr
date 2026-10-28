import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { MoodChips } from "@/components/mood/mood-chips";
import { MoodTint } from "@/components/mood/mood-tint";
import { ListingSkeleton, ShopListing } from "@/components/shop/listing";
import { PageHeader } from "@/components/shop/page-header";
import { isMood, MOOD_KEYS, MOODS } from "@/lib/moods";

export function generateStaticParams() {
  return MOOD_KEYS.map((mood) => ({ mood }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/moods/[mood]">): Promise<Metadata> {
  const { mood } = await params;
  return isMood(mood) ? { title: MOODS[mood].en } : {};
}

export default function MoodPage({ params, searchParams }: PageProps<"/[locale]/moods/[mood]">) {
  return (
    <div className="mx-auto max-w-[1500px] px-4 pt-4 md:px-8">
      <Suspense fallback={<ListingSkeleton />}>
        <Content params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Content({ params, searchParams }: Pick<PageProps<"/[locale]/moods/[mood]">, "params" | "searchParams">) {
  const { mood } = await params;
  if (!isMood(mood)) notFound();
  const locale = (await getLocale()) === "ar" ? "ar" : "en";
  return (
    <>
      <MoodTint mood={mood} />
      <PageHeader eyebrow={locale === "ar" ? "المود" : "MOOD"} title={MOODS[mood][locale]} text={MOODS[mood].tagline[locale]} />
      <div className="mb-8"><MoodChips active={mood} /></div>
      <ShopListing basePath={`/moods/${mood}`} mood={mood} searchParams={searchParams} />
    </>
  );
}
