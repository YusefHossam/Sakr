"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { requestExchange, saveSizePassport } from "@/lib/actions/account";
import { logout } from "@/lib/actions/auth";

const field = "min-h-11 w-full border border-ash bg-smoke px-3 text-sm text-bone focus:border-steel focus:outline-none";

export function LogoutButton() {
  const t = useTranslations("account");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await logout();
          router.push("/");
          router.refresh();
        })
      }
      className="min-h-11 border border-ash px-5 text-xs tracking-[0.2em] text-steel uppercase hover:border-bone hover:text-bone"
    >
      {t("logout")}
    </button>
  );
}

type Passport = { top: string | null; bottom: string | null; shoeUS: number | null; heightCm: number | null; weightKg: number | null };

export function SizePassportForm({ initial }: { initial: Passport }) {
  const t = useTranslations("account");
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const num = (v: FormDataEntryValue | null) => (v ? Number(v) : null);
  const str = (v: FormDataEntryValue | null) => (v ? String(v) : null);

  return (
    <form
      className="grid grid-cols-2 gap-3 sm:grid-cols-5"
      onSubmit={(e) => {
        e.preventDefault();
        const d = new FormData(e.currentTarget);
        startTransition(async () => {
          const res = await saveSizePassport({
            top: str(d.get("top")) as Passport["top"] as never,
            bottom: str(d.get("bottom")) as never,
            shoeUS: num(d.get("shoeUS")),
            heightCm: num(d.get("heightCm")),
            weightKg: num(d.get("weightKg")),
          });
          setSaved(res.ok);
        });
      }}
    >
      <label className="flex flex-col gap-1 text-xs text-dust">
        {t("top")}
        <select name="top" defaultValue={initial.top ?? ""} className={field}>
          <option value="">—</option>
          {["XS", "S", "M", "L", "XL", "XXL"].map((s) => <option key={s}>{s}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-dust">
        {t("bottom")}
        <select name="bottom" defaultValue={initial.bottom ?? ""} className={field}>
          <option value="">—</option>
          {["28", "30", "32", "34", "36", "38"].map((s) => <option key={s}>{s}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-dust">
        {t("shoe")}
        <input name="shoeUS" type="number" step="0.5" min={5} max={16} defaultValue={initial.shoeUS ?? ""} className={field} />
      </label>
      <label className="flex flex-col gap-1 text-xs text-dust">
        {t("height")}
        <input name="heightCm" type="number" min={120} max={230} defaultValue={initial.heightCm ?? ""} className={field} />
      </label>
      <label className="flex flex-col gap-1 text-xs text-dust">
        {t("weight")}
        <input name="weightKg" type="number" min={35} max={250} defaultValue={initial.weightKg ?? ""} className={field} />
      </label>
      <button type="submit" disabled={pending} className="col-span-2 min-h-11 border border-bone/70 font-display tracking-[0.25em] text-bone uppercase hover:bg-bone hover:text-ink sm:col-span-1">
        {saved ? `✓ ${t("saved")}` : t("save")}
      </button>
    </form>
  );
}

export function ExchangeButton({ orderNumber }: { orderNumber: string }) {
  const t = useTranslations("account");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (done) return <span className="text-xs text-bone">✓ {t("exchangeSent")}</span>;
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs text-bone underline underline-offset-4">
        {t("exchange")}
      </button>
    );

  return (
    <form
      className="mt-3 flex w-full flex-col gap-3 border border-ash p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const d = new FormData(e.currentTarget);
        startTransition(async () => {
          const res = await requestExchange({
            orderNumber,
            reason: String(d.get("reason")) as "size",
            note: String(d.get("note") ?? ""),
            confirmUnworn: d.get("confirm") === "on" ? true : (false as never),
          });
          if (res.ok) {
            setDone(true);
            router.refresh();
          } else setError(res.error);
        });
      }}
    >
      <p className="street-heading text-lg">{t("exchangeTitle")}</p>
      <p className="text-xs text-dust">{t("exchangeRule")}</p>
      <label className="flex flex-col gap-1 text-xs text-dust">
        {t("exchangeReason")}
        <select name="reason" className={field}>
          {(["size", "defect", "wrong-item"] as const).map((r) => <option key={r} value={r}>{t(`reasons.${r}`)}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-dust">
        {t("exchangeNote")}
        <textarea name="note" rows={2} maxLength={500} className={`${field} py-2`} />
      </label>
      <label className="flex items-center gap-2 text-xs text-steel">
        <input name="confirm" type="checkbox" required className="size-4 accent-[#b9b9b9]" />
        {t("exchangeConfirm")}
      </label>
      {error && <p className="text-xs text-blood" role="alert">{error}</p>}
      <button type="submit" disabled={pending} className="min-h-11 self-start border border-bone/70 px-5 text-xs tracking-[0.2em] text-bone uppercase hover:bg-bone hover:text-ink">
        {t("exchangeSend")}
      </button>
    </form>
  );
}
