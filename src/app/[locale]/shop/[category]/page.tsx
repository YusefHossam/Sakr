import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ListingSkeleton, ShopListing } from "@/components/shop/listing";
import { PageHeader } from "@/components/shop/page-header";
import { CATEGORIES, type Category } from "@/models/product";

const isCategory = (c: string): c is Category => (CATEGORIES as readonly string[]).includes(c);

export function generateStaticParams() {
  return CATEGORIES.map((category) => ({ category }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/shop/[category]">): Promise<Metadata> {
  const { category } = await params;
  if (!isCategory(category)) return {};
  const t = await getTranslations("categories");
  return { title: t(category) };
}

export default function CategoryPage({ params, searchParams }: PageProps<"/[locale]/shop/[category]">) {
  return (
    <div className="mx-auto max-w-[1500px] px-4 pt-4 md:px-8">
      <Suspense fallback={<ListingSkeleton />}>
        <CategoryContent params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function CategoryContent({ params, searchParams }: Pick<PageProps<"/[locale]/shop/[category]">, "params" | "searchParams">) {
  const { category } = await params;
  if (!isCategory(category)) notFound();
  const t = await getTranslations("categories");
  return (
    <>
      <PageHeader eyebrow="SAKR" title={t(category)} />
      <ShopListing basePath={`/shop/${category}`} category={category} searchParams={searchParams} />
    </>
  );
}
