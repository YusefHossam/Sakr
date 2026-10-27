import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ListingSkeleton, ShopListing, type SearchParams } from "@/components/shop/listing";
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
      <form action="" role="search" className="flex gap-2">
        <label htmlFor="q" className="sr-only">
          {t("searchPlaceholder")}
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q}
          autoFocus
          placeholder={t("searchPlaceholder")}
          className="flex-1 border border-ash bg-smoke px-4 py-3.5 text-bone placeholder:text-dust focus:border-steel focus:outline-none"
        />
        <button type="submit" className="border border-bone/70 px-6 font-display tracking-[0.3em] text-bone uppercase hover:bg-bone hover:text-ink">
          {t("searchButton")}
        </button>
      </form>
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
