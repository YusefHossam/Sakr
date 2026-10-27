"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { sendApology } from "@/lib/actions/admin";
import { adminButton, adminField } from "./ui";

/** Late order: reason + apology coupon, then a ready-made WhatsApp message (BR-62). */
export function ApologyForm({ number, percent, phone }: { number: string; percent: number; phone: string }) {
  const t = useTranslations("admin.order");
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const digits = phone.replace(/\D/g, "").replace(/^0/, "20");

  if (code) {
    const text = `SAKR — طلبك ${number} اتأخر عليك وإحنا آسفين. السبب: ${reason}. خد كوبون ${percent}٪ على الطلب الجاي: ${code}`;
    return (
      <div className="flex flex-wrap items-center gap-3 text-xs text-bone">
        ✓ {t("apologySent", { code })}
        <a href={`https://wa.me/${digits}?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer" className={adminButton}>
          {t("whatsapp")}
        </a>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-2 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const res = await sendApology(number, reason);
          if (res.ok) {
            setCode(res.message ?? "");
            router.refresh();
          }
        });
      }}
    >
      <label className="sr-only" htmlFor={`reason-${number}`}>{t("apologyReason")}</label>
      <input id={`reason-${number}`} value={reason} onChange={(e) => setReason(e.target.value)} required minLength={3} maxLength={300} placeholder={t("apologyReason")} className={adminField} />
      <button type="submit" disabled={pending} className={`${adminButton} shrink-0`}>{t("apologySend", { percent })}</button>
    </form>
  );
}
