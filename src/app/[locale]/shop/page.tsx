import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ListingSkeleton, ShopListing } from "@/components/shop/listing";
import { PageHeader } from "@/components/shop/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("shop");
  return { title: t("all") };
}

export default async function ShopPage({ searchParams }: PageProps<"/[locale]/shop">) {
  const t = await getTranslations("shop");
  return (
    <div className="mx-auto max-w-[1500px] px-4 pt-4 md:px-8">
      <PageHeader eyebrow="SAKR" title={t("all")} />
      <Suspense fallback={<ListingSkeleton />}>
        <ShopListing basePath="/shop" searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
