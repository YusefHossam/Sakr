import { Suspense } from "react";
import { getLocale } from "next-intl/server";
import { ContentForm } from "@/components/admin/more-forms";
import { requireAdmin } from "@/lib/auth/admin";
import { getSettings } from "@/lib/settings";

export default async function AdminContent() {
  const locale = await getLocale();
  return (
    <div className="flex flex-col gap-8">
      <h1 className="street-heading text-5xl">{locale === "ar" ? "المحتوى" : "Content"}</h1>
      <Suspense fallback={<div className="h-64 animate-pulse bg-smoke" />}>
        <Form />
      </Suspense>
    </div>
  );
}

async function Form() {
  await requireAdmin();
  const s = await getSettings();
  return <ContentForm announcement={s.announcement} banners={s.banners} />;
}
