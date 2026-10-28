// Writes Arabic + English descriptions for every product in the database, without a full reseed.
// English keeps the source page's own details (taken from data/catalog.json, so it is safe to run repeatedly).
// Usage: node scripts/generate-descriptions.ts
import { readFile } from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import { describeProduct } from "../src/lib/describe.ts";
import { Product } from "../src/models/product.ts";

process.loadEnvFile(".env.local");

type Raw = { slug: string; brand: string; title: string; category: string; subcategory: string | null; model: string | null; colorway: string | null; colors: string[]; sizes: string[]; description: string };
const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-");

const { products }: { products: Raw[] } = JSON.parse(await readFile(path.resolve(import.meta.dirname, "../data/catalog.json"), "utf8"));
await mongoose.connect(process.env.MONGODB_URI!, { dbName: process.env.MONGODB_DB, serverSelectionTimeoutMS: 20_000 });

const ops = products.map((p) => {
  const text = describeProduct({ ...p, brandSlug: slugify(p.brand) });
  return { updateOne: { filter: { slug: p.slug }, update: { $set: { description: text.en, descriptionAr: text.ar } } } };
});
let modified = 0;
for (let i = 0; i < ops.length; i += 500) {
  const res = await Product.bulkWrite(ops.slice(i, i + 500), { ordered: false });
  modified += res.modifiedCount;
  process.stdout.write(`\r${Math.min(i + 500, ops.length)}/${ops.length}`);
}
console.log(`\n✓ ${modified} products described`);
await mongoose.disconnect();
