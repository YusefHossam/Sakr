import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ListingSkeleton, ShopListing, type SearchParams } from "@/components/shop/listing";
import { SearchBox } from "@/components/shop/search-box";
import { PageHeader } from "@/components/shop/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("shop");
  return { title: t("searchTitle"), robots: { index: false } };
}

export default async function SearchPage({ searchParams }: PageProps<"/[locale]/search">) {
  const t = await getTranslations("shop");
  return (
    <div className="mx-auto max-w-[1500px] px-4 pt-4 md:px-8">
      <PageHeader title={t("searchTitle")} />
      <Suspense fallback={<ListingSkeleton />}>
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function SearchResults({ searchParams }: { searchParams: SearchParams }) {
  const t = await getTranslations("shop");
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.trim().slice(0, 80) ?? "";
  return (
    <div className="flex flex-col gap-8">
      <SearchBox initial={q} />
      {q ? (
        <>
          <p className="street-heading text-2xl" dir="auto">{t("searchResults", { q })}</p>
          <ShopListing basePath="/search" searchParams={searchParams} />
        </>
      ) : (
        <p className="text-sm text-steel">{t("searchHint")}</p>
      )}
    </div>
  );
}
