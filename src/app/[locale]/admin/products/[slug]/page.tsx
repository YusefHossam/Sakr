import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PreorderForm } from "@/components/admin/more-forms";
import { ProductEditor } from "@/components/admin/product-forms";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { connectDB } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { Product } from "@/models/product";

export default function AdminProduct({ params }: PageProps<"/[locale]/admin/products/[slug]">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse bg-smoke" />}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: Pick<PageProps<"/[locale]/admin/products/[slug]">, "params">) {
  await requireAdmin();
  const { slug } = await params;
  await connectDB();
  const [p, settings] = await Promise.all([Product.findOne({ slug }).lean(), getSettings()]);
  if (!p) notFound();
  const promo = settings.promos.find((x) => x.scope === "product" && x.key === slug)?.percent ?? 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex gap-5">
        <span className="size-28 shrink-0 bg-tile">
          {/* eslint-disable-next-line @next/next/no-img-element -- remote CDN image */}
          {p.images[0] && <img src={p.images[0]} alt="" className="size-full object-contain p-2 mix-blend-multiply" />}
        </span>
        <div className="flex flex-col gap-1" dir="ltr">
          <p className="text-xs tracking-[0.3em] text-dust uppercase">{p.brand}</p>
          <h1 className="street-heading text-3xl">{p.title}</h1>
          <Link href={`/product/${p.slug}`} className="text-xs text-steel underline underline-offset-4">/product/{p.slug}</Link>
        </div>
      </div>
      <PreorderForm
        slug={p.slug}
        enabled={!!p.preorder?.enabled}
        limit={p.preorder?.limit ?? 50}
        taken={p.preorder?.taken ?? 0}
        shipsAt={p.preorder?.shipsAt ? new Date(p.preorder.shipsAt).toISOString().slice(0, 10) : ""}
      />
      <ProductEditor
        slug={p.slug}
        initial={{
          price: p.price,
          costPrice: p.costPrice ?? 0,
          active: p.active,
          promoPercent: promo,
          variants: p.variants.map((v) => ({ size: v.size ?? null, color: v.color ?? null, stock: v.stock })),
        }}
      />
    </div>
  );
}
