import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { getLocale } from "next-intl/server";
import { PageHeader } from "@/components/shop/page-header";
import { connectDB } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { Order } from "@/models/order";
import { Product } from "@/models/product";

export const metadata: Metadata = { title: "Status" };

const now = () => Date.now(); // outside the component: the render-purity lint only allows clock reads in helpers

type Check = { name: string; ok: boolean; note: string };

export default function StatusPage() {
  return (
    <div className="mx-auto max-w-[900px] px-4 pt-4 md:px-8">
      <Suspense fallback={<div className="h-96 animate-pulse bg-smoke" />}>
        <Content />
      </Suspense>
    </div>
  );
}

/** Public status: only whether things work and how fast, never customer or business numbers. */
async function Content() {
  await connection();
  const ar = (await getLocale()) === "ar";
  const L = (a: string, e: string) => (ar ? a : e);
  const checks: Check[] = [];

  const started = now();
  let dbOk = false;
  try {
    const { connection: db } = await connectDB();
    await db.db!.admin().ping();
    dbOk = true;
  } catch {
    dbOk = false;
  }
  checks.push({ name: L("قاعدة البيانات", "Database"), ok: dbOk, note: dbOk ? `${now() - started} ms` : L("مش بترد", "Not responding") });

  if (dbOk) {
    const shelf = await Product.countDocuments({ active: true, variants: { $elemMatch: { stock: { $gt: 0 } } } }).catch(() => -1);
    checks.push({ name: L("المتجر والكتالوج", "Storefront and catalog"), ok: shelf > 0, note: shelf > 0 ? L("القطع متاحة", "Pieces available") : L("الكتالوج فاضي", "Catalog empty") });
    const recent = await Order.countDocuments({ createdAt: { $gt: new Date(now() - 864e5) } }).catch(() => -1);
    checks.push({ name: L("الأوردرات", "Ordering"), ok: recent >= 0, note: recent >= 0 ? L("بتتسجل عادي", "Accepting orders") : L("فيه مشكلة", "Problem") });
    const settings = await getSettings().catch(() => null);
    checks.push({ name: L("اللايف", "Live drop"), ok: true, note: settings?.live.active ? L("على الهوا الآن", "On air now") : L("مفيش لايف دلوقتي", "Nothing live") });
  }
  checks.push({ name: L("الدفع بالكارت", "Card payments"), ok: !!process.env.PAYMOB_SECRET_KEY, note: process.env.PAYMOB_SECRET_KEY ? L("شغّال", "Enabled") : L("لسه متفعّلش (الدفع بالتحويل والكاش شغّال)", "Not enabled yet (transfer and cash on delivery work)") });
  checks.push({ name: L("المساعد الذكي", "AI stylist"), ok: !!process.env.GEMINI_API_KEY, note: process.env.GEMINI_API_KEY ? L("شغّال", "Enabled") : L("بيشتغل بالقواعد بس", "Rule-based only") });

  const allOk = checks.filter((c) => c.name !== L("الدفع بالكارت", "Card payments")).every((c) => c.ok);

  return (
    <>
      <PageHeader eyebrow="STATUS" title={allOk ? L("كله شغّال", "All systems go") : L("فيه حاجة واقفة", "Something is down")} text={L("حالة الموقع دلوقتي. بتتحدث مع كل فتح للصفحة.", "How the site is doing right now. Checked every time you open this page.")} />
      <ul className="flex flex-col divide-y divide-ash border-y border-ash">
        {checks.map((c) => (
          <li key={c.name} className="flex items-center gap-4 py-4">
            <span className={`size-3 shrink-0 rounded-full ${c.ok ? "bg-emerald-500" : "bg-blood"}`} aria-hidden />
            <span className="text-bone">{c.name}</span>
            <span className="ms-auto text-end text-xs text-steel" dir="auto">{c.ok ? "" : "✕ "}{c.note}</span>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-xs text-dust" dir="ltr">{new Date(now()).toISOString().slice(0, 19).replace("T", " ")} UTC</p>
    </>
  );
}
