import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Section } from "@/components/home/section";
import { BuyBox } from "@/components/product/buy-box";
import { TrackAffinity } from "@/components/home/for-you";
import { Gallery } from "@/components/product/gallery";
import { FitNote } from "@/components/product/fit-note";
import { GoesWith } from "@/components/product/goes-with";
import { SellOutHint } from "@/components/product/sell-out-hint";
import { LiveViewers } from "@/components/product/live-viewers";
import { PersonalBits } from "@/components/product/personal";
import { ProductTabs } from "@/components/product/product-tabs";
import { RandomPicks } from "@/components/product/random-picks";
import { ReviewForm } from "@/components/product/review-form";
import { Link } from "@/i18n/navigation";
import { getProduct } from "@/lib/catalog";
import { getApprovedReviews } from "@/lib/reviews";

export async function generateMetadata({ params }: PageProps<"/[locale]/product/[slug]">): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  if (!product) return {};
  return {
    title: `${product.brand} ${product.title}`,
    description: product.description.slice(0, 160) || undefined,
    openGraph: product.images[0] ? { images: [product.images[0]] } : undefined,
  };
}

export default function ProductPage({ params }: PageProps<"/[locale]/product/[slug]">) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductContent params={params} />
    </Suspense>
  );
}

async function ProductContent({ params }: Pick<PageProps<"/[locale]/product/[slug]">, "params">) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  const [t, tc, reviews, locale] = await Promise.all([getTranslations("product"), getTranslations("categories"), getApprovedReviews(slug), getLocale()]);
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <div className="mx-auto max-w-[1500px] px-4 pt-6 md:px-8">
      <TrackAffinity brand={product.brandSlug} category={product.category} />
      <nav aria-label="Breadcrumb" className="mb-6 text-xs text-dust">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href="/" className="hover:text-bone">{t("breadcrumbHome")}</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href={`/shop/${product.category}`} className="hover:text-bone">{tc(product.category)}</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href={`/brands/${product.brandSlug}`} className="hover:text-bone">{product.brand}</Link></li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-14">
        <Gallery images={product.images} title={product.title} slug={product.slug} />

        <div className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-32 lg:self-start">
          <div className="flex flex-col gap-2" dir="ltr">
            <Link href={`/brands/${product.brandSlug}`} className="self-start text-xs tracking-[0.35em] text-dust uppercase hover:text-bone">
              {product.brand}
            </Link>
            <h1 className="street-heading text-[clamp(1.8rem,3.6vw,3rem)] leading-[0.95]">{product.model ?? product.title}</h1>
            {product.colorway && <p className="text-lg text-steel">{product.colorway}</p>}
            {reviews.length > 0 && (
              <p className="text-xs text-dust">
                <span className="text-bone">{"★".repeat(Math.round(avg))}</span> {avg.toFixed(1)} · {reviews.length}
              </p>
            )}
          </div>
          <LiveViewers slug={product.slug} />
          <Suspense fallback={null}>
            <SellOutHint slug={product.slug} stock={product.variants.reduce((s, v) => s + v.stock, 0)} />
          </Suspense>

          {product.colorways.length > 1 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs tracking-[0.25em] text-dust uppercase">
                {t("colorways")} · {product.colorways.length}
              </p>
              <ul className="flex max-h-[180px] flex-wrap gap-2 overflow-y-auto">
                {product.colorways.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/product/${c.slug}`}
                      title={c.colorway ?? ""}
                      aria-label={c.colorway ?? c.slug}
                      aria-current={c.slug === product.slug ? "page" : undefined}
                      className={`block size-14 overflow-hidden border bg-tile ${c.slug === product.slug ? "border-bone" : "border-ash hover:border-dust"}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- remote CDN thumbnail */}
                      {c.image && <img src={c.image} alt="" loading="lazy" className="size-full object-contain p-1 mix-blend-multiply" />}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <BuyBox product={product} />
          <FitNote brandSlug={product.brandSlug} category={product.category} />
          <Suspense fallback={null}>
            <PersonalBits category={product.category} subcategory={product.subcategory} image={product.images[0] ?? null} title={product.title} />
          </Suspense>
          <ProductTabs category={product.category} description={locale === "ar" ? product.descriptionAr || product.description : product.description} />
        </div>
      </div>

      <Suspense fallback={null}>
        <GoesWith slug={product.slug} />
      </Suspense>

      <Section title={t("reviews")}>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          {reviews.length ? (
            <ul className="flex flex-col divide-y divide-ash">
              {reviews.map((r) => (
                <li key={r.id} className="flex flex-col gap-1 py-4">
                  <p className="text-sm text-bone">
                    <span dir="ltr">{"★".repeat(r.rating)}</span> · {r.name} <span className="text-xs text-dust">{r.date}</span>
                  </p>
                  <p className="text-sm text-steel" dir="auto">{r.text}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-steel">{t("noReviews")}</p>
          )}
          <ReviewForm slug={product.slug} />
        </div>
      </Section>

      {product.suggestions.length > 0 && (
        <Section title={t("alsoLike")}>
          <RandomPicks pool={product.suggestions} />
        </Section>
      )}
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="mx-auto grid max-w-[1500px] gap-10 px-4 pt-12 md:px-8 lg:grid-cols-[1.25fr_1fr]" aria-hidden="true">
      <div className="aspect-square animate-pulse bg-smoke" />
      <div className="flex flex-col gap-4">
        <div className="h-4 w-24 animate-pulse bg-smoke" />
        <div className="h-12 w-3/4 animate-pulse bg-smoke" />
        <div className="h-8 w-32 animate-pulse bg-smoke" />
        <div className="h-40 animate-pulse bg-smoke" />
      </div>
    </div>
  );
}
