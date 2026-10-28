import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { BulkTools, RestockButton } from "@/components/admin/more-forms";
import { Stat } from "@/components/admin/ui";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { connectDB } from "@/lib/db";
import { CATEGORIES, Product } from "@/models/product";

export default async function AdminCatalog() {
  const locale = await getLocale();
  return (
    <div className="flex flex-col gap-10">
      <h1 className="street-heading text-5xl">{locale === "ar" ? "الكتالوج" : "Catalog"}</h1>
      <Suspense fallback={<div className="h-96 animate-pulse bg-smoke" />}>
        <Body />
      </Suspense>
    </div>
  );
}

type Row = { _id: string; name?: string; total: number; active: number };

async function Body() {
  await requireAdmin();
  const [locale, tc] = await Promise.all([getLocale(), getTranslations("categories")]);
  const L = (ar: string, en: string) => (locale === "ar" ? ar : en);
  await connectDB();
  const [brands, categories, outOfStock, almost, totals] = await Promise.all([
    Product.aggregate<Row>([{ $group: { _id: "$brandSlug", name: { $first: "$brand" }, total: { $sum: 1 }, active: { $sum: { $cond: ["$active", 1, 0] } } } }, { $sort: { total: -1 } }]),
    Product.aggregate<Row>([{ $group: { _id: "$category", total: { $sum: 1 }, active: { $sum: { $cond: ["$active", 1, 0] } } } }, { $sort: { total: -1 } }]),
    Product.countDocuments({ active: true, variants: { $not: { $elemMatch: { stock: { $gt: 0 } } } } }),
    Product.find({ active: true, variants: { $elemMatch: { stock: { $gt: 0 } }, $not: { $elemMatch: { stock: { $gt: 3 } } } } })
      .sort({ updatedAt: -1 })
      .limit(40)
      .select("slug title brand variants")
      .lean<{ slug: string; title: string; brand: string; variants: { stock: number }[] }[]>(),
    Product.aggregate<{ total: number; active: number }>([{ $group: { _id: null, total: { $sum: 1 }, active: { $sum: { $cond: ["$active", 1, 0] } } } }]),
  ]);
  const t = totals[0] ?? { total: 0, active: 0 };
  const catName = (c: string) => ((CATEGORIES as readonly string[]).includes(c) ? tc(c as (typeof CATEGORIES)[number]) : c);

  return (
    <>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={L("كل المنتجات", "All products")} value={t.total.toLocaleString("en")} />
        <Stat label={L("ظاهرة", "Visible")} value={t.active.toLocaleString("en")} />
        <Stat label={L("مخفية", "Hidden")} value={(t.total - t.active).toLocaleString("en")} />
        <Stat label={L("خلصت من المخزون", "Out of stock")} value={outOfStock.toLocaleString("en")} hot={outOfStock > 0} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="street-heading text-3xl">{L("أدوات جماعية", "Bulk tools")}</h2>
        <p className="text-xs text-steel">{L("بتشتغل على براند أو قسم أو المتجر كله. كل عملية بتتسجل في سجل العمليات.", "Works on a brand, a category or the whole store. Every run is written to the audit log.")}</p>
        <BulkTools
          brands={brands.map((b) => ({ value: b._id, label: `${b.name ?? b._id} (${b.total})` }))}
          categories={categories.map((c) => ({ value: c._id, label: `${catName(c._id)} (${c.total})` }))}
        />
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h2 className="street-heading text-2xl">{L("البراندات", "Brands")} · {brands.length}</h2>
          <div className="max-h-[420px] overflow-y-auto border border-ash">
            <table className="w-full text-sm">
              <tbody>
                {brands.map((b) => (
                  <tr key={b._id} className="border-b border-ash/60 hover:bg-smoke">
                    <td className="px-3 py-2"><Link href={`/brands/${b._id}`} className="text-bone">{b.name}</Link></td>
                    <td className="px-3 py-2 text-steel" dir="ltr">{b.active}/{b.total}</td>
                    <td className="px-3 py-2 text-xs text-blood">{b.active < b.total ? `${b.total - b.active} ${L("مخفي", "hidden")}` : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="street-heading text-2xl">{L("الأقسام", "Categories")}</h2>
          <div className="border border-ash">
            <table className="w-full text-sm">
              <tbody>
                {categories.map((c) => (
                  <tr key={c._id} className="border-b border-ash/60 hover:bg-smoke">
                    <td className="px-3 py-2"><Link href={`/shop/${c._id}`} className="text-bone">{catName(c._id)}</Link></td>
                    <td className="px-3 py-2 text-steel" dir="ltr">{c.active}/{c.total}</td>
                    <td className="px-3 py-2 text-xs text-blood">{c.active < c.total ? `${c.total - c.active} ${L("مخفي", "hidden")}` : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="street-heading text-2xl">{L("على وشك الخلاص", "Almost sold out")} · {almost.length}</h2>
        {almost.length ? (
          <ul className="flex flex-col divide-y divide-ash border-y border-ash text-sm">
            {almost.map((p) => (
              <li key={p.slug} className="flex flex-wrap items-center gap-4 py-3">
                <Link href={`/admin/products/${p.slug}`} className="min-w-0 flex-1 text-bone" dir="ltr">{p.brand} · {p.title}</Link>
                <span className="text-blood" dir="ltr">{p.variants.reduce((s, v) => s + v.stock, 0)} {L("قطعة", "left")}</span>
                <RestockButton slug={p.slug} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-steel">{L("مفيش حاجة على وشك الخلاص.", "Nothing is running low.")}</p>
        )}
      </section>
    </>
  );
}
