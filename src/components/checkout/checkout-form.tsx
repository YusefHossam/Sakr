"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Price } from "@/components/product/price";
import { useRouter } from "@/i18n/navigation";
import { checkCoupon, placeOrder, type CheckoutError } from "@/lib/actions/checkout";
import { REGIONS } from "@/lib/regions";
import { GOVERNORATES, defaultIntlFee, earliestDelivery, toDateInput } from "@/lib/shipping";
import type { CartLine, UsableCoupon } from "@/lib/shop-data";
import type { Pin } from "./pin-map";

const PinMap = dynamic(() => import("./pin-map"), { ssr: false, loading: () => <div className="h-64 animate-pulse bg-smoke" /> });

type Props = {
  lines: CartLine[];
  coupons: UsableCoupon[];
  profile: { name: string; email: string; phone: string; phone2: string };
  shipping: { egypt: Record<string, number>; intl: Record<string, number> };
  transfer: { instapay: string; wallet: string };
  cardEnabled: boolean;
};

const input = "min-h-12 w-full border border-ash bg-smoke px-4 text-bone placeholder:text-dust focus:border-steel focus:outline-none aria-[invalid=true]:border-blood";

export function CheckoutForm({ lines, coupons, profile, shipping, transfer, cardEnabled }: Props) {
  const t = useTranslations("checkout");
  const tr = useTranslations("regions");
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [country, setCountry] = useState("EG");
  const [governorate, setGovernorate] = useState("cairo");
  const [method, setMethod] = useState<"card" | "transfer" | "cod">(cardEnabled ? "card" : "transfer");
  const [plan, setPlan] = useState<"full" | "deposit">("full");
  const [pin, setPin] = useState<Pin | null>(null);
  const [coupon, setCoupon] = useState("");
  const [couponPercent, setCouponPercent] = useState<number | null>(null);
  const [couponError, setCouponError] = useState(false);
  const [error, setError] = useState<CheckoutError | null>(null);
  const [badFields, setBadFields] = useState<string[]>([]);
  const minDate = useMemo(() => toDateInput(earliestDelivery()), []);

  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const couponBase = lines.filter((l) => l.unitPrice === l.listPrice).reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const discount = couponPercent ? Math.round((couponBase * couponPercent) / 100) : 0;
  const ship = country === "EG" ? (shipping.egypt[governorate] ?? 100) : (shipping.intl[country] ?? defaultIntlFee(country));
  const total = subtotal - discount + ship;
  const effectiveMethod = method === "cod" && country !== "EG" ? "transfer" : method;
  const dueNow = effectiveMethod === "cod" ? 0 : plan === "deposit" ? Math.ceil(total / 2) : total;

  const applyCoupon = (code: string) => {
    setCoupon(code);
    setCouponError(false);
    if (!code) return setCouponPercent(null);
    startTransition(async () => {
      const res = await checkCoupon(code);
      setCouponPercent(res.ok ? res.percent : null);
      setCouponError(!res.ok);
    });
  };

  const bad = (name: string) => badFields.includes(name);

  return (
    <form
      className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        data.set("method", effectiveMethod);
        data.set("plan", plan);
        data.set("coupon", couponPercent ? coupon : "");
        data.set("locale", locale);
        if (pin) {
          data.set("lat", String(pin.lat));
          data.set("lng", String(pin.lng));
        }
        startTransition(async () => {
          const res = await placeOrder(data);
          if (res.ok) {
            if (/^https?:/.test(res.redirect)) location.assign(res.redirect);
            else router.push(res.redirect);
          } else {
            setError(res.error);
            setBadFields(res.fields ?? []);
            if (res.error === "login") router.push("/login?next=/checkout");
          }
        });
      }}
    >
      <div className="flex flex-col gap-10">
        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="street-heading mb-4 text-2xl">{t("contact")}</legend>
          <input name="name" defaultValue={profile.name} required aria-invalid={bad("name")} placeholder="Name" autoComplete="name" className={input} />
          <input name="email" type="email" defaultValue={profile.email} required aria-invalid={bad("email")} dir="ltr" autoComplete="email" className={input} />
          <input name="phone" type="tel" defaultValue={profile.phone} required aria-invalid={bad("phone")} dir="ltr" pattern="\+?[0-9 ]{8,16}" autoComplete="tel" placeholder="+20 1XX XXX XXXX" className={input} />
          <input name="phone2" type="tel" defaultValue={profile.phone2} aria-invalid={bad("phone2")} dir="ltr" pattern="\+?[0-9 ]{8,16}" placeholder={t("phone2")} aria-label={t("phone2")} className={input} />
        </fieldset>

        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="street-heading mb-4 text-2xl">{t("address")}</legend>
          <label className="flex flex-col gap-1.5 text-xs text-dust">
            {t("country")}
            <select name="country" value={country} onChange={(e) => setCountry(e.target.value)} className={input}>
              {REGIONS.map((r) => (
                <option key={r.code} value={r.code}>{tr(r.code)}</option>
              ))}
            </select>
          </label>
          {country === "EG" && (
            <label className="flex flex-col gap-1.5 text-xs text-dust">
              {t("governorate")}
              <select name="governorate" value={governorate} onChange={(e) => setGovernorate(e.target.value)} aria-invalid={bad("governorate")} className={input}>
                {Object.entries(GOVERNORATES).map(([key, g]) => (
                  <option key={key} value={key}>{locale === "ar" ? g.ar : g.en}</option>
                ))}
              </select>
            </label>
          )}
          {(["city", "street", "building", "floor", "apartment", "landmark"] as const).map((name) => (
            <label key={name} className="flex flex-col gap-1.5 text-xs text-dust">
              {t(name)}
              <input name={name} required={name === "city" || name === "street"} aria-invalid={bad(name)} maxLength={120} className={input} />
            </label>
          ))}
          <div className="flex flex-col gap-2 sm:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-dust">{t("mapHint")}</span>
              <button
                type="button"
                className="text-xs text-bone underline underline-offset-4"
                onClick={() => navigator.geolocation?.getCurrentPosition((p) => setPin({ lat: p.coords.latitude, lng: p.coords.longitude }))}
              >
                📍 {t("useLocation")}
              </button>
            </div>
            <div className="overflow-hidden border border-ash">
              <PinMap pin={pin} onPick={setPin} />
            </div>
          </div>
        </fieldset>

        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="street-heading mb-4 text-2xl">{t("delivery")}</legend>
          <label className="flex flex-col gap-1.5 text-xs text-dust">
            {t("deliveryDate")}
            <input name="deliveryDate" type="date" min={minDate} defaultValue={minDate} required aria-invalid={bad("deliveryDate")} className={input} />
            <span className="text-[11px]">{t("deliveryDateHint")}</span>
          </label>
          <label className="flex flex-col gap-1.5 text-xs text-dust sm:col-span-2">
            {t("notes")}
            <textarea name="notes" rows={2} maxLength={500} className={`${input} py-3`} />
          </label>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="street-heading mb-4 text-2xl">{t("payment")}</legend>
          {(
            [
              ["card", t("card"), !cardEnabled ? t("cardSoon") : null],
              ["transfer", t("transfer"), null],
              ["cod", t("cod"), country !== "EG" ? t("codEgyptOnly") : null],
            ] as const
          ).map(([value, label, note]) => {
            const disabled = (value === "card" && !cardEnabled) || (value === "cod" && country !== "EG");
            return (
              <label key={value} className={`flex cursor-pointer items-center gap-3 border p-4 ${effectiveMethod === value ? "border-bone" : "border-ash"} ${disabled ? "cursor-not-allowed opacity-40" : ""}`}>
                <input type="radio" name="methodChoice" value={value} checked={effectiveMethod === value} disabled={disabled} onChange={() => setMethod(value)} className="accent-[#b9b9b9]" />
                <span className="flex-1 text-sm text-bone">{label}</span>
                {note && <span className="text-[11px] text-dust">{note}</span>}
              </label>
            );
          })}
          {effectiveMethod === "transfer" && (
            <div className="flex flex-col gap-3 border border-ash bg-smoke p-4 text-sm text-steel">
              <p>{t("transferHint", { instapay: transfer.instapay, wallet: transfer.wallet })}</p>
              <label className="flex flex-col gap-1.5 text-xs text-dust">
                {t("proof")}
                <input name="proof" type="file" accept="image/*" required className="text-sm text-bone file:me-3 file:border file:border-ash file:bg-ink file:px-3 file:py-2 file:text-bone" />
              </label>
            </div>
          )}
          {effectiveMethod !== "cod" && (
            <div className="flex flex-col gap-2">
              <span className="text-xs text-dust">{t("plan")}</span>
              <div className="flex gap-2">
                {(["full", "deposit"] as const).map((p) => (
                  <button key={p} type="button" onClick={() => setPlan(p)} aria-pressed={plan === p} className={`min-h-11 flex-1 border px-3 text-sm ${plan === p ? "border-bone text-bone" : "border-ash text-steel"}`}>
                    {p === "full" ? t("planFull") : t("planDeposit")}
                  </button>
                ))}
              </div>
              {plan === "deposit" && <p className="text-[11px] text-dust">{t("depositHint")}</p>}
            </div>
          )}
        </fieldset>
      </div>

      <aside className="flex h-fit flex-col gap-5 border border-ash p-6 lg:sticky lg:top-32">
        <p className="street-heading text-2xl">{t("summary")}</p>
        <ul className="flex max-h-60 flex-col gap-3 overflow-y-auto">
          {lines.map((l) => (
            <li key={`${l.slug}-${l.size}-${l.color}`} className="flex gap-3 text-xs">
              <span className="size-12 shrink-0 bg-tile">
                {/* eslint-disable-next-line @next/next/no-img-element -- remote CDN thumbnail */}
                {l.image && <img src={l.image} alt="" className="size-full object-contain p-1 mix-blend-multiply" />}
              </span>
              <span className="flex-1 text-steel" dir="ltr">{l.qty} × {l.title} {l.size && `· ${l.size}`}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-dust" htmlFor="my-coupons">{t("myCoupons")}</label>
          <select id="my-coupons" value={coupons.some((c) => c.code === coupon) ? coupon : ""} onChange={(e) => applyCoupon(e.target.value)} className={input}>
            <option value="">{coupons.length ? "—" : t("noCoupons")}</option>
            {coupons.map((c) => (
              <option key={c.code} value={c.code}>{c.code} · {t("couponOff", { percent: c.percent })}{c.expiresAt ? ` · ${c.expiresAt}` : ""}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder={t("couponCode")} aria-label={t("couponCode")} dir="ltr" className={input} />
            <button type="button" onClick={() => applyCoupon(coupon)} className="border border-ash px-4 text-xs text-bone hover:border-bone">{t("apply")}</button>
          </div>
          {couponError && <p className="text-xs text-blood">{t("errors.coupon")}</p>}
          {couponPercent && <p className="text-xs text-bone">✓ {t("couponOff", { percent: couponPercent })}</p>}
        </div>

        <dl className="flex flex-col gap-2 border-t border-ash pt-4 text-sm">
          <div className="flex justify-between"><dt className="text-steel">{t("summary")}</dt><dd><Price price={subtotal} /></dd></div>
          {discount > 0 && <div className="flex justify-between"><dt className="text-steel">{t("discount")}</dt><dd className="text-blood">−<Price price={discount} /></dd></div>}
          <div className="flex justify-between"><dt className="text-steel">{t("shipping")}</dt><dd><Price price={ship} /></dd></div>
          <div className="flex justify-between border-t border-ash pt-2"><dt className="text-bone">{t("total")}</dt><dd><Price price={total} size="lg" /></dd></div>
          {dueNow !== total && <div className="flex justify-between"><dt className="text-steel">{t("payNow")}</dt><dd><Price price={dueNow} /></dd></div>}
        </dl>

        <p className="text-[11px] leading-relaxed text-dust">{t("exchangeAgree")}</p>
        {error && <p className="text-sm text-blood" role="alert">{t(`errors.${error === "login" ? "invalid" : error}`)}</p>}
        <button type="submit" disabled={pending} className="min-h-12 bg-bone font-display tracking-[0.3em] text-ink uppercase hover:bg-chrome disabled:opacity-50">
          {pending ? t("placing") : t("placeOrder")}
        </button>
      </aside>
    </form>
  );
}
