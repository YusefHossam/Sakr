import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { FitBuilder } from "@/components/lab/fit-builder";
import { PageHeader } from "@/components/shop/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("builder");
  return { title: t("title") };
}

export default async function FitBuilderPage() {
  const t = await getTranslations("builder");
  return (
    <div className="mx-auto max-w-[1300px] px-4 pt-4 md:px-8">
      <PageHeader eyebrow="SAKR LAB" title={t("title")} text={t("text")} />
      <FitBuilder />
    </div>
  );
}
