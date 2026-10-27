import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { MysteryBox } from "@/components/lab/mystery-box";
import { PageHeader } from "@/components/shop/page-header";
import { CATALOG_TAG } from "@/lib/catalog";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/product";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("mystery");
  return { title: t("title") };
}

async function getTiers() {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  await connectDB();
  const docs = await Product.find({ subcategory: "mystery", active: true }).sort({ price: 1 }).select("slug price costPrice").lean();
  // costPrice was seeded at 55% of the worth, so the worth reads back from it.
  return docs.map((d) => ({ slug: d.slug, price: d.price, worth: Math.round((d.costPrice ?? d.price) / 0.55 / 1000) * 1000 }));
}

export default async function MysteryBoxPage() {
  const [t, tiers] = await Promise.all([getTranslations("mystery"), getTiers()]);
  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-4 md:px-8">
      <PageHeader eyebrow="SAKR LAB" title={t("title")} text={t("text")} />
      <MysteryBox tiers={tiers} />
    </div>
  );
}
