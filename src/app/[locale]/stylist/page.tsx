import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Stylist } from "@/components/lab/stylist";
import { PageHeader } from "@/components/shop/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("stylist");
  return { title: t("title") };
}

export default async function StylistPage() {
  const [t, tl] = await Promise.all([getTranslations("stylist"), getTranslations("lab")]);
  return (
    <div className="mx-auto max-w-[1300px] px-4 pt-4 md:px-8">
      <PageHeader eyebrow="SAKR LAB" title={t("title")} text={tl("stylistText")} />
      <Stylist />
    </div>
  );
}
