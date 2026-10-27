"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { saveSettings } from "@/lib/actions/admin";
import { GOVERNORATES } from "@/lib/shipping";
import { adminButton, adminField } from "./ui";

type Initial = {
  dropLocked: boolean;
  dropPassword: string;
  dropName: string;
  dropOpensAt: string;
  vipEarlyHours: number;
  transferInstapay: string;
  transferWallet: string;
  bigOrderThreshold: number;
  bigOrderPercent: number;
  apologyPercent: number;
  shippingEgypt: Record<string, number>;
};

export function SettingsForm({ initial }: { initial: Initial }) {
  const t = useTranslations("admin.settings");
  const locale = useLocale();
  const router = useRouter();
  const [s, setS] = useState(initial);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [pending, startTransition] = useTransition();
  const num = (k: keyof Initial) => (e: React.ChangeEvent<HTMLInputElement>) => setS({ ...s, [k]: Number(e.target.value) });
  const str = (k: keyof Initial) => (e: React.ChangeEvent<HTMLInputElement>) => setS({ ...s, [k]: e.target.value });

  return (
    <form
      className="flex flex-col gap-10"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const res = await saveSettings(s);
          setStatus(res.ok ? "saved" : "error");
          router.refresh();
        });
      }}
    >
      <fieldset className={`grid gap-4 border p-5 sm:grid-cols-2 ${s.dropLocked ? "border-blood/70" : "border-ash"}`}>
        <legend className="street-heading px-2 text-2xl">{t("drop")}</legend>
        <label className="flex items-center gap-3 text-sm text-bone sm:col-span-2">
          <input type="checkbox" checked={s.dropLocked} onChange={(e) => setS({ ...s, dropLocked: e.target.checked })} className="size-5 accent-[#9b111e]" />
          {t("locked")}
        </label>
        <label className="flex flex-col gap-1 text-xs text-dust">{t("dropName")}<input value={s.dropName} onChange={str("dropName")} className={adminField} /></label>
        <label className="flex flex-col gap-1 text-xs text-dust">{t("password")}<input value={s.dropPassword} onChange={str("dropPassword")} dir="ltr" className={adminField} /></label>
        <label className="flex flex-col gap-1 text-xs text-dust">{t("opensAt")}<input type="datetime-local" value={s.dropOpensAt} onChange={str("dropOpensAt")} className={adminField} /></label>
        <label className="flex flex-col gap-1 text-xs text-dust">{t("vipHours")}<input type="number" min={0} max={72} value={s.vipEarlyHours} onChange={num("vipEarlyHours")} className={adminField} /></label>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="street-heading mb-3 text-2xl">{t("payments")}</legend>
        <label className="flex flex-col gap-1 text-xs text-dust">{t("instapay")}<input value={s.transferInstapay} onChange={str("transferInstapay")} dir="ltr" className={adminField} /></label>
        <label className="flex flex-col gap-1 text-xs text-dust">{t("wallet")}<input value={s.transferWallet} onChange={str("transferWallet")} dir="ltr" className={adminField} /></label>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-3">
        <legend className="street-heading mb-3 text-2xl">{t("rules")}</legend>
        <label className="flex flex-col gap-1 text-xs text-dust">{t("bigOrderThreshold")}<input type="number" min={0} value={s.bigOrderThreshold} onChange={num("bigOrderThreshold")} className={adminField} /></label>
        <label className="flex flex-col gap-1 text-xs text-dust">{t("bigOrderPercent")}<input type="number" min={1} max={90} value={s.bigOrderPercent} onChange={num("bigOrderPercent")} className={adminField} /></label>
        <label className="flex flex-col gap-1 text-xs text-dust">{t("apologyPercent")}<input type="number" min={1} max={90} value={s.apologyPercent} onChange={num("apologyPercent")} className={adminField} /></label>
      </fieldset>

      <fieldset className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <legend className="street-heading mb-3 text-2xl">{t("shipping")}</legend>
        {Object.entries(GOVERNORATES).map(([key, g]) => (
          <label key={key} className="flex flex-col gap-1 text-xs text-dust">
            {locale === "ar" ? g.ar : g.en}
            <input
              type="number"
              min={0}
              value={s.shippingEgypt[key] ?? g.fee}
              onChange={(e) => setS({ ...s, shippingEgypt: { ...s.shippingEgypt, [key]: Number(e.target.value) } })}
              className={adminField}
            />
          </label>
        ))}
      </fieldset>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={adminButton}>{t("save")}</button>
        {status === "saved" && <span className="text-xs text-bone">✓ {t("saved")}</span>}
        {status === "error" && <span className="text-xs text-blood">!</span>}
      </div>
    </form>
  );
}
