// Downloads up to 3 images per product from data/catalog.json into public/products/<id>/
// and records the local paths on each product as `localImages`. Safe to re-run: existing files are skipped.
// Usage: node scripts/download-images.mjs
import { mkdir, readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const CATALOG = path.join(ROOT, "data/catalog.json");
const PER_PRODUCT = 3;
const CONCURRENCY = 8;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36";

const catalog = JSON.parse(await readFile(CATALOG, "utf8"));
// Model-grouped sneakers/caps (remoteImages) are served from the Shopify CDN and not downloaded.
const jobs = catalog.products.filter((p) => !p.remoteImages).flatMap((p) =>
  p.images.slice(0, PER_PRODUCT).map((url, i) => {
    const ext = (new URL(url).pathname.match(/\.(jpe?g|png|webp|avif)$/i)?.[1] ?? "jpg").toLowerCase();
    return { product: p, url, rel: `/products/${p.id}/${i + 1}.${ext}` };
  }),
);

const exists = (file) => stat(file).then(() => true, () => false);
let done = 0, failed = 0;

async function run(job) {
  const file = path.join(ROOT, "public", job.rel);
  if (!(await exists(file))) {
    const res = await fetch(job.url, { headers: { "user-agent": UA } });
    if (!res.ok) throw new Error(`${res.status} ${job.url}`);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, Buffer.from(await res.arrayBuffer()));
  }
  (job.product.localImages ??= []).push(job.rel);
}

const queue = [...jobs];
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) {
      const job = queue.shift();
      try {
        await run(job);
      } catch (err) {
        failed++;
        console.error(err.message);
      }
      if (++done % 200 === 0) console.log(`${done}/${jobs.length}`);
    }
  }),
);

for (const p of catalog.products) p.localImages?.sort();
catalog.products = catalog.products.filter((p) => p.remoteImages || p.localImages?.length);
catalog.count = catalog.products.length;
await writeFile(CATALOG, JSON.stringify(catalog, null, 2));
console.log(`Done: ${done - failed} images saved, ${failed} failed, ${catalog.count} products with images.`);
