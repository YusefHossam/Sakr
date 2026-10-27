import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { connectDB } from "./db";
import { LAST_PIECES_DISCOUNT, LAST_PIECES_MAX } from "./pricing";
import { Brand } from "@/models/brand";
import { CATEGORIES, Product, type Category } from "@/models/product";

export const CATALOG_TAG = "catalog";

/** What a product card needs; plain JSON so it can cross into client components. */
export type ProductCard = {
  slug: string;
  title: string;
  brand: string;
  category: Category;
  model: string | null;
  colorway: string | null;
  price: number;
  salePrice: number | null;
  piecesLeft: number | null;
  image: string | null;
};

export type NavCategory = { category: Category; brands: { name: string; slug: string }[] };
export type NavBrand = { name: string; slug: string; productCount: number };

const CARD_FIELDS = "slug title brand category model colorway price images variants";

type CardSource = {
  slug: string;
  title: string;
  brand: string;
  category: Category;
  model?: string | null;
  colorway?: string | null;
  price: number;
  images?: string[];
  variants?: { stock: number }[];
};

function toCard(p: CardSource): ProductCard {
  const low = (p.variants ?? []).filter((v) => v.stock >= 1 && v.stock <= LAST_PIECES_MAX).map((v) => v.stock);
  const piecesLeft = low.length ? Math.min(...low) : null;
  return {
    slug: p.slug,
    title: p.title,
    brand: p.brand,
    category: p.category,
    model: p.model ?? null,
    colorway: p.colorway ?? null,
    price: p.price,
    salePrice: piecesLeft ? Math.round(p.price * (1 - LAST_PIECES_DISCOUNT)) : null,
    piecesLeft,
    image: p.images?.[0] ?? null,
  };
}

/** Navbar data: every category with the brands that carry it, plus all brands. */
export async function getNavData(): Promise<{ categories: NavCategory[]; brands: NavBrand[] }> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  await connectDB();
  const brands = await Brand.find().sort({ productCount: -1 }).select("name slug categories productCount").lean();
  return {
    categories: CATEGORIES.map((category) => ({
      category,
      brands: brands.filter((b) => b.categories.includes(category)).map((b) => ({ name: b.name, slug: b.slug })),
    })),
    brands: brands.map((b) => ({ name: b.name, slug: b.slug, productCount: b.productCount })),
  };
}

/** Products with at least one size/color at three pieces or fewer (85% off). */
export async function getLastPieces(limit = 12): Promise<{ items: ProductCard[]; total: number }> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("minutes");
  await connectDB();
  const filter = { active: true, variants: { $elemMatch: { stock: { $gte: 1, $lte: LAST_PIECES_MAX } } } };
  const [docs, total] = await Promise.all([
    Product.find(filter).sort({ price: -1 }).limit(limit).select(CARD_FIELDS).lean<CardSource[]>(),
    Product.countDocuments(filter),
  ]);
  return { items: docs.map(toCard), total };
}

export async function getNewIn(limit = 12): Promise<ProductCard[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("minutes");
  await connectDB();
  // Interleave brands so one brand doesn't fill the whole row.
  const docs = await Product.aggregate<CardSource>([
    { $match: { active: true, "images.0": { $exists: true } } },
    { $sort: { publishedAt: -1 } },
    { $group: { _id: "$brandSlug", items: { $push: "$$ROOT" } } },
    { $project: { items: { $slice: ["$items", 2] } } },
    { $unwind: "$items" },
    { $replaceRoot: { newRoot: "$items" } },
    { $sort: { publishedAt: -1 } },
    { $limit: limit },
  ]);
  return docs.map(toCard);
}

export type ModelSpotlight = { model: string; brand: string; modelKey: string; colorways: ProductCard[] };

/** The model with the most colorways (or a given one), with every colorway. */
export async function getModelSpotlight(modelKey?: string, limit = 40): Promise<ModelSpotlight | null> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  await connectDB();
  let key = modelKey;
  if (!key) {
    const [top] = await Product.aggregate<{ _id: string }>([
      { $match: { modelKey: { $ne: null }, category: "footwear" } },
      { $group: { _id: "$modelKey", n: { $sum: 1 } } },
      { $sort: { n: -1 } },
      { $limit: 1 },
    ]);
    key = top?._id;
  }
  if (!key) return null;
  const docs = await Product.find({ modelKey: key, active: true })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .select(CARD_FIELDS)
    .lean<CardSource[]>();
  if (!docs.length) return null;
  return { model: docs[0].model ?? "", brand: docs[0].brand, modelKey: key, colorways: docs.map(toCard) };
}

export const SORTS = ["new", "price-asc", "price-desc"] as const;
export type Sort = (typeof SORTS)[number];

export type ListingQuery = {
  category?: Category;
  brand?: string;
  type?: string;
  sale?: boolean;
  q?: string;
  sort?: Sort;
  page?: number;
};

export type Listing = {
  items: ProductCard[];
  total: number;
  page: number;
  pages: number;
  brands: { slug: string; name: string; count: number }[];
};

export const PAGE_SIZE = 24;

/** Filtered, sorted, paginated products plus the brand facet for the current filter. */
export async function getListing(query: ListingQuery): Promise<Listing> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("minutes");
  await connectDB();

  const base: Record<string, unknown> = { active: true };
  if (query.category) base.category = query.category;
  if (query.type) base.subcategory = query.type;
  if (query.sale) base.variants = { $elemMatch: { stock: { $gte: 1, $lte: LAST_PIECES_MAX } } };
  if (query.q) base.$text = { $search: query.q };
  const filter = query.brand ? { ...base, brandSlug: query.brand } : base;

  const page = Math.max(1, query.page ?? 1);
  const sort: Record<string, 1 | -1 | { $meta: "textScore" }> =
    query.sort === "price-asc"
      ? { price: 1 }
      : query.sort === "price-desc"
        ? { price: -1 }
        : query.q
          ? { score: { $meta: "textScore" } }
          : { publishedAt: -1, _id: 1 };

  const [docs, total, facet] = await Promise.all([
    Product.find(filter)
      .sort(sort)
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .select(CARD_FIELDS)
      .lean<CardSource[]>(),
    Product.countDocuments(filter),
    Product.aggregate<{ _id: string; name: string; count: number }>([
      { $match: base },
      { $group: { _id: "$brandSlug", name: { $first: "$brand" }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  return {
    items: docs.map(toCard),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    brands: facet.map((b) => ({ slug: b._id, name: b.name, count: b.count })),
  };
}

/** Newest colorway slug of a model, for /models/[key]. */
export async function getModelEntry(modelKey: string): Promise<string | null> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  await connectDB();
  const doc = await Product.findOne({ modelKey, active: true }).sort({ publishedAt: -1 }).select("slug").lean<{ slug: string }>();
  return doc?.slug ?? null;
}

/** First images of a brand's newest pieces, for banners. */
export async function getBrandImages(brandSlug: string, limit = 4): Promise<string[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  await connectDB();
  const docs = await Product.find({ brandSlug, active: true, "images.0": { $exists: true } })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .select("images")
    .lean<{ images: string[] }[]>();
  return docs.map((d) => d.images[0]);
}

/** A spread of product images for the hero poster wall. */
export async function getHeroImages(limit = 36): Promise<string[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  await connectDB();
  const docs = await Product.aggregate<{ image: string }>([
    { $match: { active: true, "images.0": { $exists: true }, category: { $in: ["hoodies", "jackets", "footwear", "tees"] } } },
    { $group: { _id: "$brandSlug", images: { $push: { $first: "$images" } } } },
    { $project: { images: { $slice: ["$images", 3] } } },
    { $unwind: "$images" },
    { $project: { _id: 0, image: "$images" } },
    { $limit: limit },
  ]);
  return docs.map((d) => d.image);
}
