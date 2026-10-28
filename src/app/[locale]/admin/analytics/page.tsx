import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { Stat } from "@/components/admin/ui";
import { REPORT_TZ } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth/admin";
import { connectDB } from "@/lib/db";
import { Order, ORDER_STATUSES } from "@/models/order";
import { User } from "@/models/user";

const egp = (n: number) => `${Math.round(n).toLocaleString("en")} EGP`;
const DAYS = 30;
// Clock reads live outside the component so render stays pure (this page is request-time only).
const daysAgo = (n: number) => new Date(Date.now() - n * 864e5);
const SOLD = { status: { $nin: ["cancelled", "awaiting_payment"] as (typeof ORDER_STATUSES)[number][] } };

export default async function AdminAnalytics() {
  const locale = await getLocale();
  return (
    <div className="flex flex-col gap-10">
      <h1 className="street-heading text-5xl">{locale === "ar" ? "التحليلات" : "Analytics"}</h1>
      <Suspense fallback={<div className="h-96 animate-pulse bg-smoke" />}>
        <Body />
      </Suspense>
    </div>
  );
}

function Bars({ rows, format }: { rows: { label: string; value: number }[]; format: (n: number) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="flex flex-col gap-2 text-sm">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-3">
          <span className="truncate text-steel" dir="auto">{r.label}</span>
          <span className="h-2 bg-ash"><span className="block h-full bg-bone" style={{ width: `${(r.value / max) * 100}%` }} /></span>
          <span className="text-bone" dir="ltr">{format(r.value)}</span>
        </li>
      ))}
    </ul>
  );
}

async function Body() {
  await requireAdmin();
  const [locale, ts] = await Promise.all([getLocale(), getTranslations("order.statuses")]);
  const L = (ar: string, en: string) => (locale === "ar" ? ar : en);
  await connectDB();
  const since = daysAgo(DAYS);
  const day = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: REPORT_TZ } };
  const [daily, brands, products, governorates, payments, statuses, newCustomers, customers, levels, couponUse] = await Promise.all([
    Order.aggregate<{ _id: string; revenue: number; orders: number }>([{ $match: { ...SOLD, createdAt: { $gte: since } } }, { $group: { _id: day, revenue: { $sum: "$total" }, orders: { $sum: 1 } } }]),
    Order.aggregate<{ _id: string; revenue: number }>([{ $match: SOLD }, { $unwind: "$items" }, { $group: { _id: "$items.brand", revenue: { $sum: { $multiply: ["$items.unitPrice", "$items.qty"] } } } }, { $sort: { revenue: -1 } }, { $limit: 8 }]),
    Order.aggregate<{ _id: string; qty: number }>([{ $match: SOLD }, { $unwind: "$items" }, { $group: { _id: "$items.title", qty: { $sum: "$items.qty" } } }, { $sort: { qty: -1 } }, { $limit: 8 }]),
    Order.aggregate<{ _id: string; orders: number }>([{ $match: SOLD }, { $group: { _id: { $ifNull: ["$address.governorate", "$address.country"] }, orders: { $sum: 1 } } }, { $sort: { orders: -1 } }, { $limit: 8 }]),
    Order.aggregate<{ _id: string; revenue: number }>([{ $match: SOLD }, { $group: { _id: "$payment.method", revenue: { $sum: "$total" } } }, { $sort: { revenue: -1 } }]),
    Order.aggregate<{ _id: string; n: number }>([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
    User.countDocuments({ createdAt: { $gte: since } }),
    User.countDocuments({ role: "customer" }),
    User.aggregate<{ _id: string; n: number }>([{ $group: { _id: { $cond: [{ $gte: ["$totalSpent", 50_000] }, "legend", { $cond: [{ $gte: ["$totalSpent", 15_000] }, "og", "rookie"] }] }, n: { $sum: 1 } } }]),
    Order.countDocuments({ ...SOLD, couponCode: { $ne: null }, createdAt: { $gte: since } }),
  ]);

  // One slot per day, zero-filled, in Cairo dates.
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: REPORT_TZ, year: "numeric", month: "2-digit", day: "2-digit" });
  const byDay = new Map(daily.map((d) => [d._id, d]));
  const series = Array.from({ length: DAYS }, (_, i) => {
    const key = fmt.format(daysAgo(DAYS - 1 - i));
    return { key, revenue: byDay.get(key)?.revenue ?? 0, orders: byDay.get(key)?.orders ?? 0 };
  });
  const revenue = series.reduce((s, d) => s + d.revenue, 0);
  const orders = series.reduce((s, d) => s + d.orders, 0);
  const max = Math.max(1, ...series.map((d) => d.revenue));
  const statusCount = new Map(statuses.map((s) => [s._id, s.n]));

  return (
    <>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={L(`إيراد آخر ${DAYS} يوم`, `Revenue, last ${DAYS} days`)} value={egp(revenue)} />
        <Stat label={L("أوردرات", "Orders")} value={orders} hint={orders ? `${L("متوسط", "avg")} ${egp(revenue / orders)}` : undefined} />
        <Stat label={L("عملاء جداد", "New customers")} value={newCustomers} hint={`${customers} ${L("إجمالي", "total")}`} />
        <Stat label={L("أوردرات بكوبون", "Orders with a coupon")} value={couponUse} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="street-heading text-2xl">{L("الإيراد اليومي", "Daily revenue")}</h2>
        <div className="flex h-44 items-end gap-1 border-b border-ash" dir="ltr" role="img" aria-label={L("الإيراد اليومي", "Daily revenue")}>
          {series.map((d) => (
            <div key={d.key} className="group relative flex h-full flex-1 items-end" title={`${d.key} · ${egp(d.revenue)} · ${d.orders}`}>
              <span className="block w-full bg-bone/80 transition-colors group-hover:bg-chrome" style={{ height: `${(d.revenue / max) * 100}%`, minHeight: d.revenue ? 2 : 0 }} />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[11px] text-dust" dir="ltr"><span>{series[0].key}</span><span>{series[DAYS - 1].key}</span></div>
      </section>

      <section className="grid gap-10 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h2 className="street-heading text-2xl">{L("أقوى البراندات", "Top brands")}</h2>
          <Bars rows={brands.map((b) => ({ label: b._id, value: b.revenue }))} format={egp} />
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="street-heading text-2xl">{L("الأكتر مبيعًا", "Best sellers")}</h2>
          <Bars rows={products.map((p) => ({ label: p._id, value: p.qty }))} format={(n) => `${n}×`} />
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="street-heading text-2xl">{L("المحافظات", "Where orders go")}</h2>
          <Bars rows={governorates.map((g) => ({ label: String(g._id ?? "—"), value: g.orders }))} format={(n) => String(n)} />
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="street-heading text-2xl">{L("طرق الدفع", "Payment methods")}</h2>
          <Bars rows={payments.map((p) => ({ label: p._id ?? "—", value: p.revenue }))} format={egp} />
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="street-heading text-2xl">{L("حالة الأوردرات", "Order funnel")}</h2>
          <Bars rows={ORDER_STATUSES.map((s) => ({ label: ts(s), value: statusCount.get(s) ?? 0 }))} format={(n) => String(n)} />
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="street-heading text-2xl">{L("مستويات العملاء", "Customer levels")}</h2>
          <Bars rows={["rookie", "og", "legend"].map((l) => ({ label: l.toUpperCase(), value: levels.find((x) => x._id === l)?.n ?? 0 }))} format={(n) => String(n)} />
        </div>
      </section>
    </>
  );
}
