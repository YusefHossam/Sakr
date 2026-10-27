// Loads data/catalog.json into MongoDB (products + brands). Replaces whatever catalog is there.
// Demo stock is generated from each variant's availability with a fixed seed, so reruns give the same numbers.
// Usage: npm run seed:catalog
import { readFile } from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import { Product, CATEGORIES } from "../src/models/product.ts";
import { Brand } from "../src/models/brand.ts";

process.loadEnvFile(".env.local");

type RawVariant = { size: string | null; color: string | null; available: boolean };
type RawProduct = {
  id: string;
  slug: string;
  brand: string;
  model: string | null;
  modelKey: string | null;
  colorway: string | null;
  publishedAt: string | null;
  source: string;
  category: (typeof CATEGORIES)[number];
  subcategory: string | null;
  fit: "skinny" | "flared" | null;
  title: string;
  description: string;
  priceOriginal: number;
  currencyOriginal: string;
  priceEGP: number;
  sizes: string[];
  colors: string[];
  variants: RawVariant[];
  images: string[];
  localImages?: string[];
  sourceUrl: string;
};

const BATCH = 500;
const COST_RATIO = 0.55; // demo cost price, so profit reports have numbers

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-");

// Deterministic pseudo-random in [0, 1) per key (FNV-1a hash → mulberry32 step).
function rand(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  h = Math.imul(h ^ (h >>> 15), h | 1);
  h ^= h + Math.imul(h ^ (h >>> 7), h | 61);
  return ((h ^ (h >>> 14)) >>> 0) / 4294967296;
}

// Share of products that get one nearly-sold-out variant (these trigger the last-pieces discount).
const LOW_STOCK_SHARE = 0.06;

function toVariants(p: RawProduct) {
  const raw: RawVariant[] = p.variants.length
    ? p.variants
    : (p.sizes.length ? p.sizes : [null]).map((size) => ({ size, color: p.colors[0] ?? null, available: true }));
  const available = raw.filter((v) => v.available);
  const lowVariant =
    available.length && rand(`${p.id}:low`) < LOW_STOCK_SHARE
      ? available[Math.floor(rand(`${p.id}:which`) * available.length)]
      : null;
  return raw.map((v) => ({
    size: v.size,
    color: v.color,
    stock: !v.available
      ? 0
      : v === lowVariant
        ? 1 + Math.floor(rand(`${p.id}:qty`) * 3)
        : 4 + Math.floor(rand(`${p.id}:${v.size}:${v.color}`) * 20),
  }));
}

const catalog: { products: RawProduct[] } = JSON.parse(
  await readFile(path.resolve(import.meta.dirname, "../data/catalog.json"), "utf8"),
);

const docs = catalog.products.map((p) => ({
  slug: p.slug,
  title: p.title,
  description: p.description,
  brand: p.brand,
  brandSlug: slugify(p.brand),
  category: p.category,
  subcategory: p.subcategory,
  fit: p.fit,
  model: p.model,
  modelKey: p.modelKey,
  colorway: p.colorway,
  price: p.priceEGP,
  costPrice: Math.round((p.priceEGP * COST_RATIO) / 10) * 10,
  images: p.localImages?.length ? p.localImages : p.images,
  sizes: p.sizes,
  colors: p.colors,
  variants: toVariants(p),
  source: {
    site: new URL(p.source).hostname,
    url: p.sourceUrl,
    externalId: p.id,
    priceOriginal: p.priceOriginal,
    currencyOriginal: p.currencyOriginal,
  },
  active: true,
  publishedAt: p.publishedAt ? new Date(p.publishedAt) : null,
}));

const brands = new Map<string, { name: string; slug: string; categories: Set<string>; productCount: number; models: Set<string> }>();
for (const d of docs) {
  const b = brands.get(d.brandSlug) ?? { name: d.brand, slug: d.brandSlug, categories: new Set(), productCount: 0, models: new Set() };
  b.categories.add(d.category);
  b.productCount++;
  if (d.modelKey) b.models.add(d.modelKey);
  brands.set(d.brandSlug, b);
}

await mongoose.connect(process.env.MONGODB_URI!, { dbName: process.env.MONGODB_DB, serverSelectionTimeoutMS: 15_000 });
console.log(`Connected to ${mongoose.connection.name}`);

try {
  await Product.deleteMany({});
  for (let i = 0; i < docs.length; i += BATCH) {
    await Product.insertMany(docs.slice(i, i + BATCH), { ordered: false });
    process.stdout.write(`\rproducts ${Math.min(i + BATCH, docs.length)}/${docs.length}`);
  }
  console.log();

  await Brand.deleteMany({});
  await Brand.insertMany(
    [...brands.values()].map((b) => ({
      name: b.name,
      slug: b.slug,
      categories: [...b.categories].sort(),
      productCount: b.productCount,
      modelCount: b.models.size,
    })),
  );

  await Promise.all([Product.syncIndexes(), Brand.syncIndexes()]);

  const [products, brandCount, models, lowStock] = await Promise.all([
    Product.countDocuments(),
    Brand.countDocuments(),
    Product.distinct("modelKey", { modelKey: { $ne: null } }),
    Product.countDocuments({ variants: { $elemMatch: { stock: { $gte: 1, $lte: 3 } } } }),
  ]);
  console.log(`✓ ${products} products, ${brandCount} brands, ${models.length} models, ${lowStock} products with a last-pieces variant`);
} finally {
  await mongoose.disconnect();
}
