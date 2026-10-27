import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { SettingsForm } from "@/components/admin/settings-form";
import { requireAdmin } from "@/lib/auth/admin";
import { connectDB } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { Settings } from "@/models/settings";

export default async function AdminSettings() {
  const t = await getTranslations("admin.settings");
  return (
    <div className="flex flex-col gap-8">
      <h1 className="street-heading text-5xl">{t("title")}</h1>
      <Suspense fallback={<div className="h-96 animate-pulse bg-smoke" />}>
        <Content />
      </Suspense>
    </div>
  );
}

async function Content() {
  await requireAdmin();
  await connectDB();
  // The drop password isn't in the cached settings shape on purpose; read it fresh for the form.
  const [s, raw] = await Promise.all([getSettings(), Settings.findOne({ key: "store" }).select("drop.password drop.opensAt").lean()]);
  const opensAt = raw?.drop?.opensAt ? new Date(raw.drop.opensAt) : null;
  return (
    <SettingsForm
      initial={{
        dropLocked: s.drop.locked,
        dropPassword: raw?.drop?.password ?? "",
        dropName: s.drop.name,
        // datetime-local wants local "YYYY-MM-DDTHH:mm".
        dropOpensAt: opensAt ? new Date(opensAt.getTime() - opensAt.getTimezoneOffset() * 6e4).toISOString().slice(0, 16) : "",
        vipEarlyHours: s.drop.vipEarlyHours,
        transferInstapay: s.transferInstapay,
        transferWallet: s.transferWallet,
        bigOrderThreshold: s.bigOrderThreshold,
        bigOrderPercent: s.bigOrderPercent,
        apologyPercent: s.apologyPercent,
        shippingEgypt: s.shippingEgypt,
      }}
    />
  );
}
