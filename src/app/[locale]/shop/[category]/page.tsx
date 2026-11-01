import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { ListingSkeleton, ShopListing } from "@/components/shop/listing";
import { PageHeader } from "@/components/shop/page-header";
import { redirect } from "@/i18n/navigation";
import { isSection, LEGACY_CATEGORY, SECTION_DEF, SECTIONS } from "@/lib/sections";

export function generateStaticParams() {
  return SECTIONS.map((category) => ({ category }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/shop/[category]">): Promise<Metadata> {
  const { category } = await params;
  if (!isSection(category)) return {};
  const lang = (await getLocale()) === "ar" ? "ar" : "en";
  return { title: SECTION_DEF[category].label[lang] };
}

export default function SectionPage({ params, searchParams }: PageProps<"/[locale]/shop/[category]">) {
  return (
    <div className="mx-auto max-w-[1500px] px-4 pt-4 md:px-8">
      <Suspense fallback={<ListingSkeleton />}>
        <SectionContent params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function SectionContent({ params, searchParams }: Pick<PageProps<"/[locale]/shop/[category]">, "params" | "searchParams">) {
  const [{ category }, locale] = await Promise.all([params, getLocale()]);
  // Links from before the seven sections (/shop/footwear, /shop/crewnecks …) still land in the right place.
  if (LEGACY_CATEGORY[category]) redirect({ href: LEGACY_CATEGORY[category], locale });
  if (!isSection(category)) notFound();
  const lang = locale === "ar" ? "ar" : "en";
  return (
    <>
      <PageHeader eyebrow="SAKR" title={SECTION_DEF[category].label[lang]} />
      <ShopListing basePath={`/shop/${category}`} section={category} searchParams={searchParams} />
    </>
  );
}
