import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ApologyForm } from "@/components/admin/apology-form";
import { OrderTools } from "@/components/admin/more-forms";
import { Link } from "@/i18n/navigation";
import { ActionButton, adminButton } from "@/components/admin/ui";
import { approvePayment, rejectOrder, setOrderStatus } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth/admin";
import { connectDB } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { GOVERNORATES } from "@/lib/shipping";
import { Order } from "@/models/order";

const NEXT_STEPS = ["confirmed", "preparing", "shipped", "delivered"] as const;
const egp = (n: number) => `${n.toLocaleString("en")} EGP`;

export default function AdminOrder({ params }: PageProps<"/[locale]/admin/orders/[number]">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse bg-smoke" />}>
      <OrderDetail params={params} />
    </Suspense>
  );
}

async function OrderDetail({ params }: Pick<PageProps<"/[locale]/admin/orders/[number]">, "params">) {
  await requireAdmin();
  const { number } = await params;
  await connectDB();
  const [o, t, ts, tp, settings] = await Promise.all([
    Order.findOne({ number }).lean(),
    getTranslations("admin.order"),
    getTranslations("order.statuses"),
    getTranslations("order.payments"),
    getSettings(),
  ]);
  if (!o) notFound();
  const a = o.address!;
  const c = o.contact!;
  const p = o.payment!;
  const phone = c.phone.replace(/\D/g, "").replace(/^0/, "20");
  const closed = o.status === "cancelled" || o.status === "delivered";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="street-heading text-4xl" dir="ltr">{o.number}</h1>
          <p className="text-sm text-steel">{ts(o.status)} · {p.method} · {tp(p.status)} · {egp(o.total)}{o.dueNow !== o.total && ` (${egp(o.dueNow)} now)`}{o.refunded && <span className="ms-2 border border-blood/70 px-1.5 text-[10px] text-blood">REFUNDED</span>}</p>
        </div>
        <div className="flex flex-wrap gap-2">
        <Link href={`/admin/orders/${o.number}/invoice`} className={adminButton}>Invoice</Link>
        <a href={`https://wa.me/${phone}?text=${encodeURIComponent(`SAKR — ${o.number}`)}`} target="_blank" rel="noreferrer" className={adminButton}>{t("whatsapp")}</a>
        </div>
      </div>

      <OrderTools number={o.number} note={o.adminNote ?? ""} refunded={!!o.refunded} deliveryDate={new Date(o.deliveryDate).toISOString().slice(0, 10)} />

      {!closed && (
        <section className="flex flex-wrap gap-2">
          {p.status === "awaiting_review" && <ActionButton action={approvePayment.bind(null, o.number)} label={t("approve")} />}
          {NEXT_STEPS.filter((s) => s !== o.status).map((s) => (
            <ActionButton key={s} action={setOrderStatus.bind(null, o.number, s)} label={`${t("setStatus")} ${ts(s)}`} />
          ))}
          <ActionButton action={rejectOrder.bind(null, o.number)} label={t("reject")} confirm={`${t("reject")}?`} danger />
        </section>
      )}

      {!closed && !o.delay?.couponCode && (
        <section className="flex flex-col gap-2">
          <h2 className="street-heading text-xl">{t("apology")}</h2>
          <ApologyForm number={o.number} percent={settings.apologyPercent} phone={c.phone} />
        </section>
      )}
      {o.delay?.couponCode && <p className="text-sm text-dust">✓ {o.delay.reason} · <span dir="ltr">{o.delay.couponCode}</span></p>}

      <section className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-1 border border-ash p-4 text-sm text-steel">
          <h2 className="street-heading mb-2 text-xl">{t("contact")}</h2>
          <p className="text-bone">{c.name}</p>
          <p dir="ltr" className="text-start">{c.email}</p>
          <p dir="ltr" className="text-start">{c.phone}{c.phone2 && ` · ${c.phone2}`}</p>
        </div>
        <div className="flex flex-col gap-1 border border-ash p-4 text-sm text-steel">
          <h2 className="street-heading mb-2 text-xl">{t("address")}</h2>
          <p>{a.country}{a.governorate && ` · ${GOVERNORATES[a.governorate]?.ar ?? a.governorate}`} · {a.city}</p>
          <p>{a.street} {a.building && `· ${a.building}`} {a.floor && `· ${a.floor}`} {a.apartment && `· ${a.apartment}`}</p>
          {a.landmark && <p>{a.landmark}</p>}
          <p dir="ltr" className="text-start">{new Date(o.deliveryDate).toISOString().slice(0, 10)}</p>
          {a.lat != null && a.lng != null && (
            <a href={`https://www.openstreetmap.org/?mlat=${a.lat}&mlon=${a.lng}#map=17/${a.lat}/${a.lng}`} target="_blank" rel="noreferrer" className="text-bone underline underline-offset-4">{t("map")}</a>
          )}
          {o.notes && <p className="mt-2 text-dust">{t("notes")}: {o.notes}</p>}
        </div>
      </section>

      {p.hasProof && (
        <section className="flex flex-col gap-2">
          <h2 className="street-heading text-xl">{t("proof")}</h2>
          {/* eslint-disable-next-line @next/next/no-img-element -- private image served by an admin-only route */}
          <img src={`/api/admin/proof/${String(o._id)}`} alt={t("proof")} className="max-h-[520px] max-w-full self-start border border-ash object-contain" />
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="street-heading text-xl">{t("items")}</h2>
        <ul className="flex flex-col divide-y divide-ash border-y border-ash text-sm">
          {o.items.map((i) => (
            <li key={`${i.productSlug}-${i.size}`} className="flex items-center gap-4 py-3">
              <span className="size-14 shrink-0 bg-tile">
                {/* eslint-disable-next-line @next/next/no-img-element -- remote CDN thumbnail */}
                {i.image && <img src={i.image} alt="" className="size-full object-contain p-1 mix-blend-multiply" />}
              </span>
              <span className="flex-1 text-steel" dir="ltr">{i.qty} × {i.brand} {i.title} {i.size && `· ${i.size}`}</span>
              <span className="text-bone" dir="ltr">{egp(i.unitPrice * i.qty)}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-dust" dir="ltr">
          subtotal {egp(o.subtotal)} · discount {egp(o.discount)}{o.couponCode && ` (${o.couponCode})`} · shipping {egp(o.shipping)}
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="street-heading text-xl">{t("history")}</h2>
        <ol className="flex flex-col gap-1 text-xs text-steel">
          {o.history.map((h, i) => (
            <li key={i} dir="ltr" className="text-start">{h.at ? new Date(h.at).toISOString().slice(0, 16).replace("T", " ") : ""} — {h.status} {h.note && `· ${h.note}`}</li>
          ))}
        </ol>
      </section>
    </div>
  );
}
