import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { adminButton } from "@/components/admin/ui";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/product";

export default async function AdminProducts({ searchParams }: PageProps<"/[locale]/admin/products">) {
  const t = await getTranslations("admin.products");
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="street-heading text-5xl">{t("title")}</h1>
        <Link href="/admin/products/new" className={adminButton}>+ {t("new")}</Link>
      </div>
      <Suspense fallback={<div className="h-96 animate-pulse bg-smoke" />}>
        <ProductTable searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function ProductTable({ searchParams }: Pick<PageProps<"/[locale]/admin/products">, "searchParams">) {
  await requireAdmin();
  const [t, q] = await Promise.all([getTranslations("admin.products"), searchParams]);
  const term = typeof q.q === "string" ? q.q.trim().slice(0, 60) : "";
  await connectDB();
  const filter = term ? { $or: [{ title: { $regex: escapeRegex(term), $options: "i" } }, { brand: { $regex: escapeRegex(term), $options: "i" } }, { model: { $regex: escapeRegex(term), $options: "i" } }] } : {};
  const [products, total] = await Promise.all([
    Product.find(filter).sort({ updatedAt: -1 }).limit(60).select("slug title brand price active images variants").lean(),
    Product.countDocuments(filter),
  ]);

  return (
    <>
      <form className="flex gap-2">
        <input name="q" defaultValue={term} placeholder={t("search")} aria-label={t("search")} className="min-h-11 flex-1 border border-ash bg-smoke px-4 text-sm text-bone" />
        <button type="submit" className={adminButton}>⌕</button>
      </form>
      <p className="text-xs text-dust" dir="ltr">{total.toLocaleString("en")}</p>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((p) => {
          const stock = p.variants.reduce((s, v) => s + v.stock, 0);
          const low = p.variants.some((v) => v.stock >= 1 && v.stock <= 3);
          return (
            <li key={p.slug}>
              <Link href={`/admin/products/${p.slug}`} className={`flex gap-3 border p-3 hover:border-dust ${p.active ? "border-ash" : "border-dashed border-iron opacity-60"}`}>
                <span className="size-16 shrink-0 bg-tile">
                  {/* eslint-disable-next-line @next/next/no-img-element -- remote CDN thumbnail */}
                  {p.images[0] && <img src={p.images[0]} alt="" className="size-full object-contain p-1 mix-blend-multiply" />}
                </span>
                <span className="flex min-w-0 flex-col gap-0.5 text-xs" dir="ltr">
                  <span className="text-dust">{p.brand}</span>
                  <span className="truncate text-bone">{p.title}</span>
                  <span className="text-steel">{p.price.toLocaleString("en")} EGP · {t("stock")} {stock}{low && <span className="text-blood"> · −85%</span>}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
