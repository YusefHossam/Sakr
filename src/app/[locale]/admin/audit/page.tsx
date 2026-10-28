import { Suspense } from "react";
import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { connectDB } from "@/lib/db";
import { AuditLog } from "@/models/audit";
import { ExportLink } from "@/components/admin/export-link";

export default async function AdminAudit({ searchParams }: PageProps<"/[locale]/admin/audit">) {
  const locale = await getLocale();
  return (
    <div className="flex flex-col gap-8">
      <h1 className="street-heading text-5xl">{locale === "ar" ? "سجل العمليات" : "Audit log"}</h1>
      <Suspense fallback={<div className="h-96 animate-pulse bg-smoke" />}>
        <Log searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Log({ searchParams }: Pick<PageProps<"/[locale]/admin/audit">, "searchParams">) {
  await requireAdmin();
  const [locale, q] = await Promise.all([getLocale(), searchParams]);
  const L = (ar: string, en: string) => (locale === "ar" ? ar : en);
  const area = typeof q.a === "string" ? q.a.replace(/[^a-zA-Z.-]/g, "").slice(0, 30) : "";
  await connectDB();
  const rows = await AuditLog.find(area ? { action: new RegExp(`^${area}`, "i") } : {}).sort({ createdAt: -1 }).limit(300).lean();
  const AREAS: [string, string][] = [["", L("الكل", "All")], ["order", L("أوردرات", "Orders")], ["setOrder", L("حالات", "Status")], ["customer", L("عملاء", "Customers")], ["bulk", L("جماعي", "Bulk")], ["product", L("منتجات", "Products")], ["save", L("إعدادات", "Settings")]];
  const chip = (on: boolean) => `whitespace-nowrap border px-3 py-1.5 text-xs ${on ? "border-bone bg-bone text-ink" : "border-ash text-steel hover:text-bone"}`;

  return (
    <>
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {AREAS.map(([key, name]) => <Link key={key} href={`/admin/audit${key ? `?a=${key}` : ""}`} className={chip(area === key)}>{name}</Link>)}
        <ExportLink type="audit" />
      </div>
      {rows.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-ash text-xs tracking-wider text-dust uppercase">
                {[L("الوقت", "When"), L("مين", "Who"), L("إيه", "Action"), L("على", "Target"), L("تفاصيل", "Detail")].map((h) => <th key={h} scope="col" className="px-2 py-2 text-start font-normal">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={String(r._id)} className="border-b border-ash/60 align-top hover:bg-smoke">
                  <td className="px-2 py-2 text-dust" dir="ltr">{new Date(r.createdAt).toISOString().slice(0, 16).replace("T", " ")}</td>
                  <td className="px-2 py-2 text-steel">{r.adminName}</td>
                  <td className="px-2 py-2 text-bone" dir="ltr">{r.action}</td>
                  <td className="max-w-[18rem] truncate px-2 py-2 text-steel" dir="ltr">{r.target}</td>
                  <td className="px-2 py-2 text-dust" dir="ltr">{r.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-steel">{L("لسه مفيش عمليات متسجلة.", "Nothing logged yet.")}</p>
      )}
    </>
  );
}
