import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { connectDB } from "./db";
import { LAST_PIECES_MAX, promoFor, variantPrice, type Promo } from "./pricing";
import { getSettings } from "./settings";
import { canonicalTokens, normalizeQuery } from "./search-normalize";
import { intentFilter, resolveIntent, typeLabel, type Intent } from "./search-intent";
import { buildOutfits, type Outfit } from "./outfit-formulas";
import { moodsOf, pairScore, slotOf, type ReasonKey, type Slot, type StyleItem } from "./style";
import { MOODS, type Mood } from "./moods";
import { SECTION_DEF, sectionHref, type Section } from "./sections";
import { SETTINGS_TAG } from "./tags";
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

const CARD_FIELDS = "slug title brand brandSlug category model colorway price images variants";

type CardSource = {
  slug: string;
  title: string;
  brand: string;
  brandSlug: string;
  category: Category;
  model?: string | null;
  colorway?: string | null;
  price: number;
  images?: string[];
  variants?: { stock: number }[];
};

function toCard(p: CardSource, promos: Promo[]): ProductCard {
  const low = (p.variants ?? []).filter((v) => v.stock >= 1 && v.stock <= LAST_PIECES_MAX).map((v) => v.stock);
  const piecesLeft = low.length ? Math.min(...low) : null;
  const promo = promoFor(p, promos);
  // Cards show the best price any size reaches: a last-pieces size or the running promotion.
  const best = variantPrice(p.price, piecesLeft ?? 0, promo);
  return {
    slug: p.slug,
    title: p.title,
    brand: p.brand,
    category: p.category,
    model: p.model ?? null,
    colorway: p.colorway ?? null,
    price: p.price,
    salePrice: best < p.price ? best : null,
    piecesLeft,
    image: p.images?.[0] ?? null,
  };
}

/** Cards priced with the admin's running promotions (cached readers also tag SETTINGS_TAG). */
async function toCards(docs: CardSource[]): Promise<ProductCard[]> {
  const { promos } = await getSettings();
  return docs.map((d) => toCard(d, promos));
}

/** Navbar data: every category with the brands that carry it, plus all brands. */
export async function getNavData(): Promise<{ categories: NavCategory[]; brands: NavBrand[] }> {
  "use cache";
  cacheTag(CATALOG_TAG, SETTINGS_TAG);
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
  cacheTag(CATALOG_TAG, SETTINGS_TAG);
  cacheLife("minutes");
  await connectDB();
  const filter = { active: true, variants: { $elemMatch: { stock: { $gte: 1, $lte: LAST_PIECES_MAX } } } };
  const [docs, total] = await Promise.all([
    Product.find(filter).sort({ price: -1 }).limit(limit).select(CARD_FIELDS).lean<CardSource[]>(),
    Product.countDocuments(filter),
  ]);
  return { items: await toCards(docs), total };
}

export async function getNewIn(limit = 12): Promise<ProductCard[]> {
  "use cache";
  cacheTag(CATALOG_TAG, SETTINGS_TAG);
  cacheLife("minutes");
  await connectDB();
  // Interleave brands so one brand doesn't fill the whole row.
  const docs = await Product.aggregate<CardSource>([
    { $match: { active: true, "images.0": { $exists: true }, subcategory: { $ne: "mystery" } } },
    { $sort: { publishedAt: -1 } },
    { $group: { _id: "$brandSlug", items: { $push: "$$ROOT" } } },
    { $project: { items: { $slice: ["$items", 2] } } },
    { $unwind: "$items" },
    { $replaceRoot: { newRoot: "$items" } },
    { $sort: { publishedAt: -1 } },
    { $limit: limit },
  ]);
  return toCards(docs);
}

export type ModelSpotlight = { model: string; brand: string; modelKey: string; colorways: ProductCard[] };

/** The model with the most colorways (or a given one), with every colorway. */
export async function getModelSpotlight(modelKey?: string, limit = 40): Promise<ModelSpotlight | null> {
  "use cache";
  cacheTag(CATALOG_TAG, SETTINGS_TAG);
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
  return { model: docs[0].model ?? "", brand: docs[0].brand, modelKey: key, colorways: await toCards(docs) };
}

export const SORTS = ["new", "price-asc", "price-desc"] as const;
export type Sort = (typeof SORTS)[number];

export type ListingQuery = {
  /** One of the seven shop sections, optionally narrowed by one of its types. */
  section?: Section;
  sectionType?: string;
  category?: Category;
  brand?: string;
  /** A mood: only these brands, and none of these categories. */
  brands?: readonly string[];
  excludeCategories?: readonly string[];
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
  cacheTag(CATALOG_TAG, SETTINGS_TAG);
  cacheLife("minutes");
  await connectDB();

  const base: Record<string, unknown> = { active: true };
  const and: Record<string, unknown>[] = [];
  if (query.section) {
    const def = SECTION_DEF[query.section];
    const type = def.types.find((x) => x.key === query.sectionType);
    base.category = { $in: type?.categories ?? def.categories };
    if (type?.subcategory) base.subcategory = type.subcategory;
    if (type?.title) and.push({ title: new RegExp(type.title, "i") });
    if (type?.notTitle) and.push({ title: { $not: new RegExp(type.notTitle, "i") } });
  } else if (query.category) base.category = query.category;
  else if (query.excludeCategories?.length) base.category = { $nin: [...query.excludeCategories] };
  if (query.brands?.length) base.brandSlug = { $in: [...query.brands] };
  if (query.type) base.subcategory = query.type;
  if (query.sale) base.variants = { $elemMatch: { stock: { $gte: 1, $lte: LAST_PIECES_MAX } } };
  let textSearch = false;
  if (query.q) {
    // Brand + kind + colour in any language ("نضارات كروم هارت", "nadarat chrome hearts") become real filters.
    const { brands } = await getNavData();
    const structured = intentFilter(resolveIntent(query.q, brands));
    const withIntent = structured ? { ...base, $and: [...and, ...((structured.$and as Record<string, unknown>[]) ?? [])] } : null;
    if (withIntent && (await Product.countDocuments(withIntent)) > 0) and.push(...((structured!.$and as Record<string, unknown>[]) ?? []));
    else {
      // Otherwise a text search over the English words the catalog is indexed with.
      const english = canonicalTokens(query.q).join(" ") || normalizeQuery(query.q);
      base.$text = { $search: english && english !== query.q.toLowerCase() ? `${english} ${query.q}` : query.q };
      textSearch = true;
    }
  }
  if (and.length) base.$and = and;
  const filter = query.brand ? { ...base, brandSlug: query.brand } : base;

  const page = Math.max(1, query.page ?? 1);
  const sort: Record<string, 1 | -1 | { $meta: "textScore" }> =
    query.sort === "price-asc"
      ? { price: 1 }
      : query.sort === "price-desc"
        ? { price: -1 }
        : textSearch
          ? { score: { $meta: "textScore" } }
          : { publishedAt: -1, _id: 1 };

  const [docs, total] = await Promise.all([
    Product.find(filter)
      .sort(sort)
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .select(CARD_FIELDS)
      .lean<CardSource[]>(),
    Product.countDocuments(filter),
  ]);

  return {
    items: await toCards(docs),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    brands: [],
  };
}

/** Newest colorway slug of a model, for /models/[key]. */
export async function getModelEntry(modelKey: string): Promise<string | null> {
  "use cache";
  cacheTag(CATALOG_TAG, SETTINGS_TAG);
  cacheLife("hours");
  await connectDB();
  const doc = await Product.findOne({ modelKey, active: true }).sort({ publishedAt: -1 }).select("slug").lean<{ slug: string }>();
  return doc?.slug ?? null;
}

export type ProductDetail = {
  slug: string;
  title: string;
  brand: string;
  brandSlug: string;
  category: Category;
  subcategory: string | null;
  model: string | null;
  modelKey: string | null;
  colorway: string | null;
  description: string;
  descriptionAr: string;
  price: number;
  /** Open for pre-order: sold before it is in stock, `left` units, shipping on shipsAt. */
  preorder: { enabled: boolean; left: number; shipsAt: string | null };
  images: string[];
  colors: string[];
  variants: { size: string | null; color: string | null; stock: number }[];
  colorways: { slug: string; colorway: string | null; image: string | null }[];
  completeLook: ProductCard[];
  suggestions: ProductCard[];
  /** Running promotion as a fraction; the buy box combines it with last-pieces pricing. */
  promo: number;
};

type DetailSource = Omit<CardSource, "variants"> & {
  brandSlug: string;
  subcategory?: string | null;
  modelKey?: string | null;
  description?: string;
  descriptionAr?: string;
  preorder?: { enabled?: boolean; limit?: number; taken?: number; shipsAt?: Date | null };
  colors?: string[];
  variants?: { size: string | null; color: string | null; stock: number }[];
};

// What pairs with what for "complete the look".
const LOOK_PAIRS: Record<Category, Category[]> = {
  hoodies: ["pants", "footwear", "accessories"],
  crewnecks: ["pants", "footwear", "accessories"],
  jackets: ["hoodies", "pants", "footwear"],
  pants: ["hoodies", "tees", "footwear"],
  sweatpants: ["hoodies", "footwear", "accessories"],
  tees: ["pants", "jackets", "footwear"],
  shorts: ["tees", "footwear", "accessories"],
  tracksuits: ["footwear", "accessories", "tees"],
  footwear: ["hoodies", "pants", "accessories"],
  slides: ["tees", "shorts", "accessories"],
  accessories: ["hoodies", "tees", "footwear"],
};

export async function getProduct(slug: string): Promise<ProductDetail | null> {
  "use cache";
  cacheTag(CATALOG_TAG, SETTINGS_TAG, `product:${slug}`);
  cacheLife("minutes");
  await connectDB();
  const p = await Product.findOne({ slug, active: true })
    .select("slug title brand brandSlug category subcategory model modelKey colorway description descriptionAr price images colors variants preorder")
    .lean<DetailSource>();
  if (!p) return null;

  const [siblings, look, suggestions] = await Promise.all([
    p.modelKey
      ? Product.find({ modelKey: p.modelKey, active: true }).sort({ publishedAt: -1 }).limit(150).select("slug colorway images").lean<{ slug: string; colorway?: string; images?: string[] }[]>()
      : Promise.resolve([]),
    Promise.all(
      LOOK_PAIRS[p.category].map((category) =>
        Product.findOne({ category, active: true, brandSlug: p.brandSlug, "images.0": { $exists: true } })
          .sort({ publishedAt: -1 })
          .select(CARD_FIELDS)
          .lean<CardSource>()
          .then((doc) =>
            doc ??
            Product.findOne({ category, active: true, "images.0": { $exists: true } }).sort({ publishedAt: -1 }).select(CARD_FIELDS).lean<CardSource>(),
          ),
      ),
    ),
    // A pool; the page shows a random handful from it on every visit.
    Product.find({ category: p.category, active: true, slug: { $ne: p.slug }, modelKey: p.modelKey ? { $ne: p.modelKey } : { $exists: true } })
      .sort({ publishedAt: -1 })
      .limit(40)
      .select(CARD_FIELDS)
      .lean<CardSource[]>(),
  ]);

  return {
    slug: p.slug,
    title: p.title,
    brand: p.brand,
    brandSlug: p.brandSlug,
    category: p.category,
    subcategory: p.subcategory ?? null,
    model: p.model ?? null,
    modelKey: p.modelKey ?? null,
    colorway: p.colorway ?? null,
    description: p.description ?? "",
    descriptionAr: p.descriptionAr ?? "",
    price: p.price,
    preorder: {
      enabled: !!p.preorder?.enabled,
      left: p.preorder?.enabled ? Math.max(0, (p.preorder.limit ?? 0) - (p.preorder.taken ?? 0)) : 0,
      shipsAt: p.preorder?.shipsAt ? new Date(p.preorder.shipsAt).toISOString().slice(0, 10) : null,
    },
    images: p.images ?? [],
    colors: p.colors ?? [],
    variants: (p.variants ?? []).map((v) => ({ size: v.size ?? null, color: v.color ?? null, stock: v.stock })),
    colorways: siblings.map((s) => ({ slug: s.slug, colorway: s.colorway ?? null, image: s.images?.[0] ?? null })),
    completeLook: await toCards(look.filter((d): d is CardSource => !!d)),
    suggestions: await toCards(suggestions),
    promo: promoFor(p, (await getSettings()).promos),
  };
}

/** First images of a brand's newest pieces, for banners. */
export async function getBrandImages(brandSlug: string, limit = 4): Promise<string[]> {
  "use cache";
  cacheTag(CATALOG_TAG, SETTINGS_TAG);
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
  cacheTag(CATALOG_TAG, SETTINGS_TAG);
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


// ---------- Style: what goes with what ----------

const STYLE_FIELDS = "slug title brand brandSlug category subcategory model fit colors price images variants";
const STYLE_LITE = "slug title brand brandSlug category subcategory model fit colors price";
type StyleDoc = Omit<StyleItem, "image"> & { images?: string[]; variants?: { stock: number }[]; modelKey?: string | null; description?: string };
const toStyle = (d: StyleDoc): StyleItem => ({ slug: d.slug, title: d.title, brand: d.brand, brandSlug: d.brandSlug, category: d.category, subcategory: d.subcategory ?? null, model: d.model ?? null, fit: d.fit ?? null, colors: d.colors ?? [], price: d.price, image: d.images?.[0] ?? null });

/** Pieces to pair with a given one: which categories are worth looking at. */
const TARGETS: Record<Slot, Slot[]> = { top: ["bottom", "shoes", "outer"], bottom: ["top", "shoes"], shoes: ["bottom", "top"], outer: ["top", "bottom", "shoes"], acc: ["top", "shoes"], set: ["shoes", "acc"] };
const SLOT_CATEGORIES: Record<Slot, string[]> = { top: ["hoodies", "crewnecks", "tees"], bottom: ["pants", "sweatpants", "shorts"], shoes: ["footwear"], outer: ["jackets"], acc: ["accessories"], set: ["tracksuits"] };

export type GoesWith = { card: ProductCard; why: ReasonKey[]; score: number };

/** The best pieces to wear with this one, chosen by the style engine rather than at random. */
export async function getGoesWith(slug: string): Promise<GoesWith[]> {
  "use cache";
  cacheTag(CATALOG_TAG, SETTINGS_TAG);
  cacheLife("hours");
  await connectDB();
  const doc = await Product.findOne({ slug, active: true }).select(STYLE_FIELDS).lean<StyleDoc>();
  if (!doc) return [];
  const anchor = toStyle(doc);
  const slot = slotOf(anchor.category);
  if (!slot) return [];

  const moods = moodsOf(anchor.brandSlug);
  const brandPool = moods.length ? [...new Set(moods.flatMap((m) => MOODS[m].brands))] : null;
  const picks: GoesWith[] = [];
  const stocked = { variants: { $elemMatch: { stock: { $gt: 0 } } }, "images.0": { $exists: true }, active: true };

  // Scoring needs only these light fields; the few winners are fetched in full afterwards (much less to transfer).
  const lite = Object.fromEntries(STYLE_LITE.split(" ").map((f) => [f, 1]));
  const perTarget = await Promise.all(
    TARGETS[slot].map(async (target) => {
      const categories = SLOT_CATEGORIES[target];
      const base = { ...stocked, category: { $in: categories }, ...(brandPool ? { brandSlug: { $in: brandPool } } : {}) };
      const queries: Promise<StyleDoc[]>[] = [Product.aggregate<StyleDoc>([{ $match: base }, { $sample: { size: 90 } }, { $project: lite }])];
      // The owner's pairings must always be reachable: flared / skinny denim finds Track and Curb, and they find the denim.
      const leg = anchor.fit === "flared" || anchor.fit === "skinny";
      if (target === "shoes" && leg) queries.push(Product.find({ ...stocked, category: "footwear", brandSlug: { $in: ["balenciaga", "lanvin"] }, title: /\b(track|curb)\b/i }).select(STYLE_LITE).limit(30).lean<StyleDoc[]>());
      if (target === "bottom" && /\b(track|curb)\b/i.test(anchor.title) && ["balenciaga", "lanvin"].includes(anchor.brandSlug))
        queries.push(Product.find({ ...stocked, category: "pants", fit: { $in: ["flared", "skinny"] } }).select(STYLE_LITE).limit(40).lean<StyleDoc[]>());
      const pool = (await Promise.all(queries)).flat();
      const seen = new Set<string>();
      const scored = pool
        .filter((d) => !seen.has(d.slug) && seen.add(d.slug))
        .map((d) => ({ doc: d, pair: pairScore(anchor, toStyle(d)) }))
        .filter((x) => x.pair.score > 0)
        .sort((x, y) => y.pair.score - x.pair.score);
      const take = target === "outer" ? 1 : 2;
      const fresh: typeof scored = [];
      for (const x of scored) {
        // One piece per brand+model, so a row of colourways of the same shoe does not fill the section.
        if (!fresh.some((f) => (f.doc.model ?? f.doc.slug) === (x.doc.model ?? x.doc.slug) && f.doc.brandSlug === x.doc.brandSlug)) fresh.push(x);
        if (fresh.length >= take) break;
      }
      return fresh;
    }),
  );
  const chosen = perTarget.flat();
  const full = new Map((await Product.find({ slug: { $in: chosen.map((c) => c.doc.slug) } }).select(CARD_FIELDS).lean<CardSource[]>()).map((d) => [d.slug, d]));
  const kept = chosen.filter((c) => full.has(c.doc.slug));
  const cards = await toCards(kept.map((c) => full.get(c.doc.slug)!));
  kept.forEach((c, i) => picks.push({ card: cards[i], why: c.pair.why, score: c.pair.score }));
  return picks;
}

export type Fit = { outfit: Outfit; cards: ProductCard[] };

/** Ready-made fits for a mood: whole outfits the engine thinks work, refreshed daily. */
export async function getFits(mood: Mood, day: string, count = 6): Promise<Fit[]> {
  "use cache";
  cacheTag(CATALOG_TAG, SETTINGS_TAG);
  cacheLife("hours");
  await connectDB();
  const m = MOODS[mood];
  const base = { active: true, "images.0": { $exists: true }, variants: { $elemMatch: { stock: { $gt: 3 } } }, brandSlug: { $in: [...m.brands] }, category: { $nin: [...m.exclude] } };
  // Clothes come from the mood's brands; shoes and accessories from any brand, so a recipe can always find
  // its loafer, boot or watch.
  const lite = Object.fromEntries(STYLE_LITE.split(" ").map((f) => [f, 1]));
  const stocked = { active: true, "images.0": { $exists: true }, variants: { $elemMatch: { stock: { $gt: 3 } } } };
  // Loafers, dress shoes and boots are few and some recipes depend on them, so all of them join the pool.
  const dressy = new RegExp(["loafer", "derby", "oxford", "moccasin", "penny", "horsebit", "boots?", "tabi", "ramones"].join("|"), "i");
  const [clothes, extras, special] = await Promise.all([
    Product.aggregate<StyleDoc>([{ $match: { ...base, category: { $nin: [...m.exclude, "footwear", "slides", "accessories"] } } }, { $sample: { size: 900 } }, { $project: lite }]),
    Product.aggregate<StyleDoc>([{ $match: { ...stocked, category: { $in: ["footwear", "accessories"] } } }, { $sample: { size: 600 } }, { $project: lite }]),
    Product.find({ ...stocked, category: "footwear", title: dressy }).select(STYLE_LITE).limit(400).lean<StyleDoc[]>(),
  ]);
  const seen = new Set<string>();
  const pool = [...clothes, ...extras, ...special].filter((d) => !seen.has(d.slug) && seen.add(d.slug)).map(toStyle);
  const outfits = buildOutfits(pool, { count, seed: `${mood}:${day}`, mood });
  const docs = new Map<string, StyleDoc>();
  const slugs = outfits.flatMap((o) => o.items.map((i) => i.slug));
  for (const d of await Product.find({ slug: { $in: slugs } }).select(CARD_FIELDS).lean<StyleDoc[]>()) docs.set(d.slug, d);
  return Promise.all(
    outfits.map(async (outfit) => ({ outfit, cards: await toCards(outfit.items.map((i) => docs.get(i.slug)).filter((d): d is StyleDoc => !!d) as unknown as CardSource[]) })),
  );
}

/** Cards for a list of slugs, in the order given (used by the duel leaderboard). */
export async function getCardsBySlugs(slugs: string[]): Promise<ProductCard[]> {
  await connectDB();
  const docs = await Product.find({ slug: { $in: slugs }, active: true }).select(CARD_FIELDS).lean<CardSource[]>();
  const cards = await toCards(docs);
  const order = new Map(slugs.map((x, i) => [x, i]));
  return cards.sort((a, b) => (order.get(a.slug) ?? 0) - (order.get(b.slug) ?? 0));
}

export type Suggestions = {
  brands: { name: string; slug: string }[];
  types: { label: { ar: string; en: string }; href: string }[];
  products: ProductCard[];
};

/** Live search suggestions: what the query seems to mean (brands, kinds) plus a few matching products. */
export async function getSuggestions(q: string): Promise<Suggestions> {
  await connectDB();
  const { brands } = await getNavData();
  const intent: Intent = resolveIntent(q, brands);
  const lower = q.trim().toLowerCase();
  const typed = canonicalTokens(q);
  const last = typed[typed.length - 1] ?? lower;

  // Brands: recognised by the intent, or the last typed word is the start of a brand name.
  const picked = new Map<string, { name: string; slug: string }>();
  for (const slug of intent.brandSlugs) {
    const b = brands.find((x) => x.slug === slug);
    if (b) picked.set(slug, { name: b.name, slug });
  }
  if (last.length >= 2)
    for (const b of brands) if (b.name.toLowerCase().split(/[^a-z0-9]+/).some((w) => w.startsWith(last))) picked.set(b.slug, { name: b.name, slug: b.slug });

  const types = intent.types.map((t) => ({
    label: typeLabel(t),
    href: sectionHref(t.category, t.subcategory),
  }));

  const filter = intentFilter(intent);
  let docs: CardSource[] = [];
  if (filter) docs = await Product.find({ active: true, ...filter }).sort({ publishedAt: -1 }).limit(6).select(CARD_FIELDS).lean<CardSource[]>();
  if (!docs.length && q.trim().length >= 2) {
    const english = typed.join(" ");
    docs = await Product.find({ active: true, $text: { $search: english || q } }, { score: { $meta: "textScore" } })
      .sort({ score: { $meta: "textScore" } })
      .limit(6)
      .select(CARD_FIELDS)
      .lean<CardSource[]>();
  }
  // A half-typed brand ("chr") still shows that brand's latest pieces.
  if (!docs.length && picked.size) {
    docs = await Product.find({ active: true, brandSlug: { $in: [...picked.keys()] } }).sort({ publishedAt: -1 }).limit(6).select(CARD_FIELDS).lean<CardSource[]>();
  }
  return { brands: [...picked.values()].slice(0, 4), types: types.slice(0, 3), products: await toCards(docs) };
}
