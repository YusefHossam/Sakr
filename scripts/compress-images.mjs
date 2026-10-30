// Re-encodes every downloaded product photo as a WebP (max 800px, quality 78) next to the original, points the
// catalog's `localImages` at the WebP files and updates the database. Safe to re-run: existing WebPs are skipped.
// Usage: node scripts/compress-images.mjs
import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import sharp from "sharp";

process.loadEnvFile(".env.local");
const ROOT = path.resolve(import.meta.dirname, "..");
const CATALOG = path.join(ROOT, "data/catalog.json");
const catalog = JSON.parse(await readFile(CATALOG, "utf8"));

const toWebp = (rel) => rel.replace(/\.(png|jpe?g|gif|avif)$/i, ".webp");
const jobs = [];
for (const p of catalog.products) for (const rel of p.localImages ?? []) if (!rel.endsWith(".webp")) jobs.push(rel);

let done = 0;
let before = 0;
let after = 0;
const failed = new Set();
async function work(rel) {
  const src = path.join(ROOT, "public", rel);
  const out = path.join(ROOT, "public", toWebp(rel));
  try {
    const exists = await stat(out).catch(() => null);
    if (!exists) await sharp(src).resize({ width: 800, height: 800, fit: "inside", withoutEnlargement: true }).webp({ quality: 78 }).toFile(out);
    before += (await stat(src)).size;
    after += (await stat(out)).size;
  } catch (err) {
    failed.add(rel);
    console.warn("\n  failed " + rel + ": " + err.message);
  }
  if (++done % 100 === 0) process.stdout.write(`\r${done}/${jobs.length}`);
}
const queue = [...jobs];
await Promise.all(Array.from({ length: 8 }, async () => { while (queue.length) await work(queue.shift()); }));
console.log(`\n${done} images: ${Math.round(before / 1048576)} MB -> ${Math.round(after / 1048576)} MB`);

// Point the catalog and the database at the WebP files.
const updates = [];
for (const p of catalog.products) {
  if (!p.localImages?.length) continue;
  p.localImages = p.localImages.map((rel) => (failed.has(rel) ? rel : toWebp(rel)));
  updates.push({ updateOne: { filter: { slug: p.slug }, update: { $set: { images: p.localImages.map((r) => (r.startsWith("/") ? r : "/" + r)) } } } });
}
await writeFile(CATALOG, JSON.stringify(catalog, null, 2));
await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB, serverSelectionTimeoutMS: 20_000 });
let modified = 0;
for (let i = 0; i < updates.length; i += 500) modified += (await mongoose.connection.db.collection("products").bulkWrite(updates.slice(i, i + 500), { ordered: false })).modifiedCount;
console.log(`✓ ${modified} products now use WebP photos`);
await mongoose.disconnect();
