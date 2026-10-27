import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { ApologyForm } from "@/components/admin/apology-form";
import { Stat } from "@/components/admin/ui";
import { Link } from "@/i18n/navigation";
import { getDashboard } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth/admin";
import { getSettings } from "@/lib/settings";

const egp = (n: number) => `${n.toLocaleString("en")} EGP`;

export default async function AdminHome() {
  const t = await getTranslations("admin.dashboard");
  return (
    <div className="flex flex-col gap-10">
      <h1 className="street-heading text-5xl">{t("title")}</h1>
      <Suspense fallback={<div className="h-96 animate-pulse bg-smoke" />}>
        <Dashboard />
      </Suspense>
    </div>
  );
}

async function Dashboard() {
  await requireAdmin();
  const [t, ts, d, settings] = await Promise.all([getTranslations("admin.dashboard"), getTranslations("order.statuses"), getDashboard(), getSettings()]);
  return (
    <>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={`${t("today")} · ${t("revenue")}`} value={egp(d.today.revenue)} hint={`${d.today.orders} ${t("orders")}`} />
        <Stat label={`${t("month")} · ${t("revenue")}`} value={egp(d.month.revenue)} hint={`${d.month.orders} ${t("orders")}`} />
        <Stat label={`${t("month")} · ${t("profit")}`} value={egp(d.month.profit)} />
        <Stat label={t("avgOrder")} value={egp(d.month.avg)} />
        <Link href="/admin/orders?payment=awaiting_review"><Stat label={t("toReview")} value={d.toReview} hot={d.toReview > 0} /></Link>
        <Link href="/admin/inbox"><Stat label={t("exchanges")} value={d.exchanges} hot={d.exchanges > 0} /></Link>
        <Link href="/admin/inbox"><Stat label={t("reviews")} value={d.reviews} /></Link>
        <Link href="/admin/inbox"><Stat label={t("restock")} value={d.restock} /></Link>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="street-heading text-3xl">{t("late")} · {d.late.length}</h2>
        {d.late.length ? (
          <ul className="flex flex-col divide-y divide-ash border-y border-blood/40">
            {d.late.map((o) => (
              <li key={o.number} className="flex flex-col gap-3 py-4">
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <Link href={`/admin/orders/${o.number}`} className="font-display tracking-widest text-bone" dir="ltr">{o.number}</Link>
                  <span className="text-steel">{o.contact?.name}</span>
                  <span className="text-blood" dir="ltr">{new Date(o.deliveryDate).toISOString().slice(0, 10)}</span>
                  <span className="text-dust">{ts(o.status)}</span>
                </div>
                {o.delay?.couponCode ? (
                  <p className="text-xs text-dust" dir="auto">✓ {o.delay.reason} · {o.delay.couponCode}</p>
                ) : (
                  <ApologyForm number={o.number} percent={settings.apologyPercent} phone={o.contact?.phone ?? ""} />
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-steel">{t("noLate")}</p>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="street-heading text-3xl">{t("recent")}</h2>
        <ul className="flex flex-col divide-y divide-ash border-y border-ash text-sm">
          {d.recent.map((o) => (
            <li key={o.number} className="flex flex-wrap items-center gap-4 py-3">
              <Link href={`/admin/orders/${o.number}`} className="font-display tracking-widest text-bone" dir="ltr">{o.number}</Link>
              <span className="text-steel">{o.contact?.name}</span>
              <span className="text-dust">{ts(o.status)}</span>
              <span className="ms-auto text-bone" dir="ltr">{egp(o.total)}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
