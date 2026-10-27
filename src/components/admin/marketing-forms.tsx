"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { addPromo, createCoupon } from "@/lib/actions/admin";
import { adminButton, adminField } from "./ui";

export function PromoForm() {
  const t = useTranslations("admin.marketing");
  const router = useRouter();
  const [scope, setScope] = useState<"site" | "brand" | "category" | "product">("site");
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <form
      className="grid gap-3 sm:grid-cols-[1fr_1.4fr_90px_1fr_auto] sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        const d = new FormData(e.currentTarget);
        startTransition(async () => {
          const res = await addPromo({ scope, key: String(d.get("key") ?? ""), percent: Number(d.get("percent")), endsAt: String(d.get("endsAt") ?? "") });
          setError(!res.ok);
          if (res.ok) {
            (e.target as HTMLFormElement).reset();
            router.refresh();
          }
        });
      }}
    >
      <label className="flex flex-col gap-1 text-xs text-steel">
        {t("promoScope")}
        <select value={scope} onChange={(e) => setScope(e.target.value as typeof scope)} className={adminField}>
          {(["site", "brand", "category", "product"] as const).map((s) => <option key={s} value={s}>{t(`scopes.${s}`)}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-steel">
        {t("promoKey")}
        <input name="key" disabled={scope === "site"} placeholder={scope === "brand" ? "nike" : scope === "category" ? "hoodies" : scope === "product" ? "slug" : ""} dir="ltr" className={adminField} />
      </label>
      <label className="flex flex-col gap-1 text-xs text-steel">
        {t("percent")}
        <input name="percent" type="number" min={1} max={90} required className={adminField} />
      </label>
      <label className="flex flex-col gap-1 text-xs text-steel">
        {t("endsAt")}
        <input name="endsAt" type="date" className={adminField} />
      </label>
      <button type="submit" disabled={pending} className={adminButton}>{t("addPromo")}</button>
      {error && <p className="text-xs text-blood">!</p>}
    </form>
  );
}

export function CouponForm() {
  const t = useTranslations("admin.marketing");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <form
      className="grid gap-3 sm:grid-cols-3"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const d = new FormData(form);
        startTransition(async () => {
          const res = await createCoupon({
            code: String(d.get("code")),
            percent: Number(d.get("percent")),
            maxUses: Number(d.get("maxUses") || 0),
            expiresAt: String(d.get("expiresAt") ?? ""),
            influencer: String(d.get("influencer") ?? ""),
            customerEmail: String(d.get("customerEmail") ?? ""),
          });
          setError(res.ok ? null : res.error);
          if (res.ok) {
            form.reset();
            router.refresh();
          }
        });
      }}
    >
      <label className="flex flex-col gap-1 text-xs text-steel">{t("code")}<input name="code" required pattern="[A-Za-z0-9-]{3,30}" placeholder="SAKR10" dir="ltr" className={`${adminField} uppercase`} /></label>
      <label className="flex flex-col gap-1 text-xs text-steel">{t("percent")}<input name="percent" type="number" min={1} max={90} required className={adminField} /></label>
      <label className="flex flex-col gap-1 text-xs text-steel">{t("maxUses")}<input name="maxUses" type="number" min={0} defaultValue={0} className={adminField} /></label>
      <label className="flex flex-col gap-1 text-xs text-steel">{t("endsAt")}<input name="expiresAt" type="date" className={adminField} /></label>
      <label className="flex flex-col gap-1 text-xs text-steel">{t("influencer")}<input name="influencer" className={adminField} /></label>
      <label className="flex flex-col gap-1 text-xs text-steel">{t("forCustomer")}<input name="customerEmail" type="email" dir="ltr" className={adminField} /></label>
      {error && <p className="text-xs text-blood sm:col-span-3">{error}</p>}
      <button type="submit" disabled={pending} className={`${adminButton} sm:col-span-3 sm:justify-self-start`}>{t("addCoupon")}</button>
    </form>
  );
}
