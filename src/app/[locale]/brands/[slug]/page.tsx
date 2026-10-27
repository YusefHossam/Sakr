import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ListingSkeleton, ShopListing } from "@/components/shop/listing";
import { PageHeader } from "@/components/shop/page-header";
import { getNavData } from "@/lib/catalog";

export async function generateStaticParams() {
  const { brands } = await getNavData();
  return brands.map((b) => ({ slug: b.slug }));
}

async function findBrand(slug: string) {
  const { brands } = await getNavData();
  return brands.find((b) => b.slug === slug) ?? null;
}

export async function generateMetadata({ params }: PageProps<"/[locale]/brands/[slug]">): Promise<Metadata> {
  const brand = await findBrand((await params).slug);
  return brand ? { title: brand.name } : {};
}

export default function BrandPage({ params, searchParams }: PageProps<"/[locale]/brands/[slug]">) {
  return (
    <div className="mx-auto max-w-[1500px] px-4 pt-4 md:px-8">
      <Suspense fallback={<ListingSkeleton />}>
        <BrandContent params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function BrandContent({ params, searchParams }: Pick<PageProps<"/[locale]/brands/[slug]">, "params" | "searchParams">) {
  const { slug } = await params;
  const brand = await findBrand(slug);
  if (!brand) notFound();
  const [t, tc] = await Promise.all([getTranslations("shop"), getTranslations("categories")]);
  return (
    <>
      <PageHeader eyebrow={tc("brands")} title={brand.name} text={t("brandPieces", { count: brand.productCount })} />
      <ShopListing basePath={`/brands/${slug}`} brand={slug} searchParams={searchParams} />
    </>
  );
}
