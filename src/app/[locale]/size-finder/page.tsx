import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SizeFinder } from "@/components/lab/size-finder";
import { PageHeader } from "@/components/shop/page-header";
import { getSession } from "@/lib/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("sizes");
  return { title: t("title") };
}

export default async function SizeFinderPage() {
  const t = await getTranslations("sizes");
  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-4 md:px-8">
      <PageHeader eyebrow="SAKR LAB" title={t("title")} text={t("intro")} />
      <Suspense fallback={<SizeFinder loggedIn={false} />}>
        <WithSession />
      </Suspense>
    </div>
  );
}

async function WithSession() {
  return <SizeFinder loggedIn={!!(await getSession())} />;
}
