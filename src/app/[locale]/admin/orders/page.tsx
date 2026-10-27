import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { connectDB } from "@/lib/db";
import { Order, ORDER_STATUSES } from "@/models/order";

export default async function AdminOrders({ searchParams }: PageProps<"/[locale]/admin/orders">) {
  const t = await getTranslations("admin.orders");
  return (
    <div className="flex flex-col gap-8">
      <h1 className="street-heading text-5xl">{t("title")}</h1>
      <Suspense fallback={<div className="h-96 animate-pulse bg-smoke" />}>
        <OrdersTable searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function OrdersTable({ searchParams }: Pick<PageProps<"/[locale]/admin/orders">, "searchParams">) {
  await requireAdmin();
  const [t, ts, tp, q] = await Promise.all([getTranslations("admin.orders"), getTranslations("order.statuses"), getTranslations("order.payments"), searchParams]);
  const status = typeof q.status === "string" && (ORDER_STATUSES as readonly string[]).includes(q.status) ? (q.status as (typeof ORDER_STATUSES)[number]) : null;
  const payment = q.payment === "awaiting_review" ? "awaiting_review" : null;
  await connectDB();
  const orders = await Order.find({ ...(status ? { status } : {}), ...(payment ? { "payment.status": payment } : {}) })
    .sort({ createdAt: -1 })
    .limit(200)
    .select("number contact.name total status payment createdAt deliveryDate")
    .lean<{ number: string; contact?: { name: string }; total: number; status: string; payment?: { method: string; status: string }; createdAt: Date; deliveryDate: Date }[]>();
  const chip = (active: boolean) => `whitespace-nowrap border px-3 py-1.5 text-xs ${active ? "border-bone bg-bone text-ink" : "border-ash text-steel hover:text-bone"}`;

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Link href="/admin/orders" className={chip(!status && !payment)}>{t("all")}</Link>
        <Link href="/admin/orders?payment=awaiting_review" className={chip(!!payment)}>{tp("awaiting_review")}</Link>
        {ORDER_STATUSES.map((s) => (
          <Link key={s} href={`/admin/orders?status=${s}`} className={chip(status === s)}>{ts(s)}</Link>
        ))}
      </div>
      {orders.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-ash text-start text-xs tracking-wider text-dust uppercase">
                {[t("number"), t("customer"), t("total"), t("payment"), t("status"), t("date"), t("delivery")].map((h) => (
                  <th key={h} scope="col" className="px-2 py-2 text-start font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.number} className="border-b border-ash/60 hover:bg-smoke">
                  <td className="px-2 py-3"><Link href={`/admin/orders/${o.number}`} className="font-display tracking-widest text-bone" dir="ltr">{o.number}</Link></td>
                  <td className="px-2 py-3 text-steel">{o.contact?.name}</td>
                  <td className="px-2 py-3 text-bone" dir="ltr">{o.total.toLocaleString("en")}</td>
                  <td className={`px-2 py-3 ${o.payment?.status === "awaiting_review" ? "text-blood" : "text-steel"}`}>{o.payment?.method} · {tp(o.payment?.status ?? "pending")}</td>
                  <td className="px-2 py-3 text-steel">{ts(o.status)}</td>
                  <td className="px-2 py-3 text-dust" dir="ltr">{new Date(o.createdAt).toISOString().slice(0, 10)}</td>
                  <td className="px-2 py-3 text-dust" dir="ltr">{new Date(o.deliveryDate).toISOString().slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-steel">{t("none")}</p>
      )}
    </>
  );
}
