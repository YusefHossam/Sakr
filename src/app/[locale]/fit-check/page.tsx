import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { FitCheck } from "@/components/lab/fit-check";
import { PageHeader } from "@/components/shop/page-header";

// The AI call can wait up to ~40s on the free tier.
export const maxDuration = 60;

export const metadata: Metadata = { title: "Fit Check" };

export default async function FitCheckPage() {
  const locale = await getLocale();
  return (
    <div className="mx-auto max-w-[1500px] px-4 pt-4 md:px-8">
      <PageHeader eyebrow="SAKR LAB" title="FIT CHECK" text={locale === "ar" ? "قيّم لوكك بالكاميرا." : "Rate your fit with the camera."} />
      <FitCheck />
    </div>
  );
}
