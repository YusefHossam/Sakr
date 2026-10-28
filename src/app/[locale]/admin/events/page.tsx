import { Suspense } from "react";
import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { connectDB } from "@/lib/db";
import { OrderEvent } from "@/models/event";

export default async function AdminEvents({ searchParams }: PageProps<"/[locale]/admin/events">) {
  const locale = await getLocale();
  return (
    <div className="flex flex-col gap-8">
      <h1 className="street-heading text-5xl">{locale === "ar" ? "أحداث الأوردرات" : "Order events"}</h1>
      <Suspense fallback={<div className="h-96 animate-pulse bg-smoke" />}>
        <Rows searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Rows({ searchParams }: Pick<PageProps<"/[locale]/admin/events">, "searchParams">) {
  await requireAdmin();
  const [locale, q] = await Promise.all([getLocale(), searchParams]);
  const L = (ar: string, en: string) => (locale === "ar" ? ar : en);
  const order = typeof q.o === "string" ? q.o.replace(/[^A-Za-z0-9-]/g, "").slice(0, 40) : "";
  await connectDB();
  const rows = await OrderEvent.find(order ? { orderNumber: order } : {}).sort({ createdAt: -1 }).limit(300).lean();

  return (
    <>
      <form className="flex max-w-md gap-2" action={`/${locale}/admin/events`}>
        <input name="o" defaultValue={order} dir="ltr" placeholder={L("رقم الأوردر", "Order number")} className="min-h-11 flex-1 border border-ash bg-smoke px-3 text-bone placeholder:text-dust" />
        <button type="submit" className="min-h-11 border border-bone/70 px-5 text-xs tracking-[0.2em] text-bone uppercase hover:bg-bone hover:text-ink">{L("بحث", "Find")}</button>
        {order && <Link href="/admin/events" className="self-center text-xs text-dust underline">{L("الكل", "All")}</Link>}
      </form>
      {rows.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-ash text-xs tracking-wider text-dust uppercase">
                {[L("الوقت", "When"), L("أوردر", "Order"), L("حدث", "Event"), L("مبلغ", "Amount"), L("تفاصيل", "Detail"), L("مين", "By")].map((h) => <th key={h} scope="col" className="px-2 py-2 text-start font-normal">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={String(r._id)} className="border-b border-ash/60 align-top hover:bg-smoke">
                  <td className="px-2 py-2 text-dust" dir="ltr">{new Date(r.createdAt).toISOString().slice(0, 16).replace("T", " ")}</td>
                  <td className="px-2 py-2"><Link href={`/admin/events?o=${r.orderNumber}`} className="text-bone hover:underline" dir="ltr">{r.orderNumber}</Link></td>
                  <td className="px-2 py-2 text-bone" dir="ltr">{r.type}</td>
                  <td className="px-2 py-2 text-steel" dir="ltr">{r.amount ? r.amount.toLocaleString("en") : ""}</td>
                  <td className="px-2 py-2 text-dust" dir="ltr">{r.detail}</td>
                  <td className="px-2 py-2 text-steel">{r.actor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-steel">{L("لسه مفيش أحداث.", "No events yet.")}</p>
      )}
    </>
  );
}
