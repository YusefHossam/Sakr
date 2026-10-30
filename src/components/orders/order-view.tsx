import { getLocale, getTranslations } from "next-intl/server";
import { GOVERNORATES } from "@/lib/shipping";
import { Price } from "@/components/product/price";
import type { OrderSummary } from "@/lib/order-queries";
import { TrackMapLoader } from "./track-map-loader";

const STEPS = ["pending", "confirmed", "preparing", "shipped", "delivered"] as const;
// Where the courier dot sits on the route for each status.
const PROGRESS: Record<string, number> = { pending: 0, awaiting_payment: 0, confirmed: 0, preparing: 0.05, shipped: 0.55, delivered: 1, cancelled: 0 };

export async function OrderView({ order, children }: { order: OrderSummary; children?: React.ReactNode }) {
  const t = await getTranslations("order");
  const tc = await getTranslations("checkout");
  const reached = (s: string) => order.history.find((h) => h.status === s);
  const currentIndex = STEPS.indexOf(order.status as (typeof STEPS)[number]);
  const ar = (await getLocale()) === "ar";
  const L = (a: string, e: string) => (ar ? a : e);
  const gov = GOVERNORATES[order.address.governorate];
  const place = [order.address.city, gov ? (ar ? gov.ar : gov.en) : order.address.governorate].filter(Boolean).join(ar ? "، " : ", ");
  const method = order.paymentMethod === "cod" ? tc("cod") : order.paymentMethod === "transfer" ? tc("transfer") : tc("card");
  const rows: [string, React.ReactNode][] = [
    [L("الاسم", "Name"), <span key="n" dir="auto">{order.contact.name}</span>],
    [L("الموبايل", "Phone"), <span key="p" dir="ltr">{order.contact.phone}{order.contact.phone2 && ` · ${order.contact.phone2}`}</span>],
    [L("العنوان", "Address"), <span key="a" className="flex flex-col" dir="auto">{order.address.lines[0] && <span>{order.address.lines[0]}</span>}<span>{place}</span>{order.address.lines.slice(1).map((l) => <span key={l} className="text-steel">{l}</span>)}</span>],
    [L("الدفع", "Payment"), <span key="m">{method}{order.paymentPlan === "deposit" ? ` · ${L("عربون ٥٠٪", "50% deposit")}` : ""}</span>],
    [L("التوصيل المتوقع", "Expected delivery"), <span key="d" dir="ltr">{order.deliveryDate}</span>],
  ];

  return (
    <div className="flex flex-col gap-10">
      {children}
      {/* What was ordered, where it goes and how it is paid: first thing on the page. */}
      <section aria-label={t("deliveryDetails")} className="flex flex-col gap-4 border border-bone/40 bg-smoke p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="street-heading text-2xl">{t("deliveryDetails")}</p>
          <div className="flex items-baseline gap-2 text-sm text-steel">
            {L("المطلوب", "Total")}: <Price price={order.total} />
          </div>
        </div>
        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[auto_1fr]">
          {rows.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-xs tracking-[0.15em] text-dust uppercase sm:pt-0.5">{k}</dt>
              <dd className="text-bone">{v}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section aria-label={t("status")} className="flex flex-col gap-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="street-heading text-3xl">{t(`statuses.${order.status}`)}</p>
          <p className="text-xs text-dust">
            {t("status")}: {t(`payments.${order.paymentStatus}`)}
          </p>
        </div>
        {order.status !== "cancelled" && (
          <ol className="grid grid-cols-5 gap-2">
            {STEPS.map((s, i) => {
              const done = currentIndex >= i;
              const at = reached(s)?.at;
              return (
                <li key={s} className="flex flex-col gap-2">
                  <span className={`h-1.5 ${done ? "bg-bone" : "bg-iron"} ${i === currentIndex && s !== "delivered" ? "animate-pulse" : ""}`} />
                  <span className={`text-[11px] leading-tight ${done ? "text-bone" : "text-dust"}`}>{t(`statuses.${s}`)}</span>
                  {at && <span className="text-[10px] text-dust" dir="ltr">{at.slice(0, 16).replace("T", " ")}</span>}
                </li>
              );
            })}
          </ol>
        )}
        {order.delayReason && (
          <p className="border border-blood/50 bg-blood/10 p-4 text-sm text-bone" role="status">
            {order.delayReason}
            {order.delayCoupon && <span className="mt-1 block font-display tracking-widest" dir="ltr">{order.delayCoupon}</span>}
          </p>
        )}
        {order.pin && order.status !== "cancelled" && (
          <div className="overflow-hidden border border-ash">
            <TrackMapLoader to={order.pin} progress={PROGRESS[order.status] ?? 0} />
          </div>
        )}
      </section>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-3">
          <p className="street-heading text-xl">{t("items")}</p>
          <ul className="flex flex-col divide-y divide-ash border-y border-ash">
            {order.items.map((i) => (
              <li key={`${i.productSlug}-${i.size}`} className="flex items-center gap-4 py-3">
                <span className="size-16 shrink-0 bg-tile">
                  {/* eslint-disable-next-line @next/next/no-img-element -- remote CDN thumbnail */}
                  {i.image && <img src={i.image} alt="" className="size-full object-contain p-1 mix-blend-multiply" />}
                </span>
                <span className="flex-1 text-sm text-steel" dir="ltr">{i.qty} × {i.brand} {i.title} {i.size && `· ${i.size}`}</span>
                <Price price={i.unitPrice * i.qty} />
              </li>
            ))}
          </ul>
        </div>
        <dl className="flex h-fit flex-col gap-2 border border-ash p-5 text-sm">
          <div className="flex justify-between"><dt className="text-steel">{tc("summary")}</dt><dd><Price price={order.subtotal} /></dd></div>
          {order.discount > 0 && <div className="flex justify-between"><dt className="text-steel">{tc("discount")}</dt><dd>−<Price price={order.discount} /></dd></div>}
          <div className="flex justify-between"><dt className="text-steel">{tc("shipping")}</dt><dd><Price price={order.shipping} /></dd></div>
          <div className="flex justify-between border-t border-ash pt-2"><dt className="text-bone">{tc("total")}</dt><dd><Price price={order.total} /></dd></div>
        </dl>
      </section>
    </div>
  );
}
