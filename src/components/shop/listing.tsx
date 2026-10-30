import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { ProductCard } from "@/components/product/product-card";
import { Link } from "@/i18n/navigation";
import { getListing, SORTS, type Listing, type ListingQuery } from "@/lib/catalog";
import type { Mood } from "@/lib/moods";
import { MOODS } from "@/lib/moods";
import type { Category } from "@/models/product";

export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const ACCESSORY_TYPES = ["chains", "bracelets", "rings", "sunglasses", "socks", "boxers", "headwear", "bags", "belts", "masks", "watches", "perfumes"] as const;
const SLIDE_TYPES = ["slides", "slippers", "clogs"] as const;
const TYPES_FOR: Partial<Record<Category, readonly string[]>> = { accessories: ACCESSORY_TYPES, slides: SLIDE_TYPES };

const querySchema = z.object({
  brand: z.string().regex(/^[a-z0-9-]+$/).max(60).optional().catch(undefined),
  type: z.enum([...ACCESSORY_TYPES, ...SLIDE_TYPES]).optional().catch(undefined),
  sale: z.literal("last-pieces").optional().catch(undefined),
  q: z.string().trim().min(1).max(80).optional().catch(undefined),
  sort: z.enum(SORTS).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(500).optional().catch(undefined),
});

type Props = {
  basePath: string;
  searchParams: SearchParams;
  category?: Category;
  /** Fixed brand (brand pages); hides the brand filter. */
  brand?: string;
  /** Mood pages: restricts the grid to the mood's brands and kinds of pieces. */
  mood?: Mood;
};

/** Product grid with brand/type/sale filters, sort and pagination, all driven by the URL. */
export async function ShopListing({ basePath, searchParams, category, brand, mood }: Props) {
  const raw = await searchParams;
  const flat = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  const parsed = querySchema.parse(flat);
  const query: ListingQuery = {
    category,
    brand: brand ?? parsed.brand,
    brands: mood ? MOODS[mood].brands : undefined,
    excludeCategories: mood ? MOODS[mood].exclude : undefined,
    type: category && TYPES_FOR[category]?.includes(parsed.type ?? "") ? parsed.type : undefined,
    sale: parsed.sale === "last-pieces",
    q: parsed.q,
    sort: parsed.sort,
    page: parsed.page,
  };
  const [t, tc, ta, listing] = await Promise.all([
    getTranslations("shop"),
    getTranslations("categories"),
    getTranslations("accessories"),
    getListing(query),
  ]);

  const current = { brand: brand ? undefined : parsed.brand, type: query.type, sale: parsed.sale, q: parsed.q, sort: parsed.sort };
  const href = (patch: Partial<Record<keyof typeof current | "page", string | number | undefined>>) => {
    const next = { ...current, page: undefined, ...patch } as Record<string, string | number | undefined>;
    const qs = new URLSearchParams(Object.entries(next).filter(([, v]) => v !== undefined && v !== "") as [string, string][]);
    const s = qs.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  const chip = (active: boolean) =>
    `whitespace-nowrap border px-3 py-1.5 text-xs tracking-wide transition-colors ${
      active ? "border-bone bg-bone text-ink" : "border-ash text-steel hover:border-dust hover:text-bone"
    }`;
  const anyFilter = current.brand || current.type || current.sale || current.sort;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 border-b border-ash pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-dust">{t("results", { count: listing.total })}</p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-dust">{t("sort")}:</span>
            {([undefined, "price-asc", "price-desc"] as const).map((s) => (
              <Link key={s ?? "new"} href={href({ sort: s })} className={chip(current.sort === s)}>
                {s === "price-asc" ? t("sortPriceAsc") : s === "price-desc" ? t("sortPriceDesc") : t("sortNew")}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          <Link href={href({ sale: current.sale ? undefined : "last-pieces" })} className={`${chip(!!current.sale)} ${current.sale ? "" : "border-blood/60 text-blood"}`}>
            {t("lastPiecesOnly")}
          </Link>
          {category &&
            (TYPES_FOR[category] ?? []).map((type) => (
              <Link key={type} href={href({ type: current.type === type ? undefined : type })} className={chip(current.type === type)}>
                {ta(type)}
              </Link>
            ))}
        </div>

        {!brand && listing.brands.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1" dir="ltr">
            <Link href={href({ brand: undefined })} className={chip(!current.brand)}>
              {t("allBrands")}
            </Link>
            {listing.brands.map((b) => (
              <Link key={b.slug} href={href({ brand: current.brand === b.slug ? undefined : b.slug })} className={chip(current.brand === b.slug)}>
                {b.name} <span className="opacity-60">{b.count}</span>
              </Link>
            ))}
          </div>
        )}

        {anyFilter && (
          <Link href={basePath + (current.q ? `?q=${encodeURIComponent(current.q)}` : "")} className="self-start text-xs text-dust underline underline-offset-4 hover:text-bone">
            {t("clear")}
          </Link>
        )}
      </div>

      {listing.items.length ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {listing.items.map((p, i) => (
            <ProductCard key={p.slug} product={p} priority={i < 5} transition />
          ))}
        </div>
      ) : (
        <p className="py-24 text-center text-steel">{t("empty")}</p>
      )}

      <Pagination listing={listing} href={(page) => href({ page })} labels={{ prev: t("prev"), next: t("next"), page: t("page", { page: listing.page, pages: listing.pages }) }} />
      {category && <span className="sr-only">{tc(category)}</span>}
    </div>
  );
}

function Pagination({ listing, href, labels }: { listing: Listing; href: (page: number) => string; labels: { prev: string; next: string; page: string } }) {
  if (listing.pages < 2) return null;
  const btn = "border border-ash px-5 py-2.5 text-sm text-steel transition-colors hover:border-bone hover:text-bone";
  return (
    <nav aria-label={labels.page} className="flex items-center justify-center gap-4">
      {listing.page > 1 && (
        <Link href={href(listing.page - 1)} className={btn}>
          {labels.prev}
        </Link>
      )}
      <span className="text-xs text-dust">{labels.page}</span>
      {listing.page < listing.pages && (
        <Link href={href(listing.page + 1)} className={btn}>
          {labels.next}
        </Link>
      )}
    </nav>
  );
}

export function ListingSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" aria-hidden="true">
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <div className="aspect-square animate-pulse bg-smoke" />
          <div className="h-3 w-1/3 animate-pulse bg-smoke" />
          <div className="h-3 w-2/3 animate-pulse bg-smoke" />
        </div>
      ))}
    </div>
  );
}
