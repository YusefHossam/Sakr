// Builds the demo catalog (data/catalog.json) from public product feeds of reference brands.
// Demo/testing only: images and copy belong to their brands.
// Usage: node scripts/scrape-catalog.mjs
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const OUT = path.resolve(import.meta.dirname, "../data/catalog.json");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36";

// Some stores localize their feed to EGP for Egyptian visitors, so currency is set per feed as observed.
// Approximate demo rates to EGP.
const TO_EGP = { EGP: 1, USD: 48.5, GBP: 64, EUR: 52.5, AUD: 31.5 };

const SG_BRANDS = { NIKE: "Nike", JORDAN: "Jordan", "OFF-WHITE": "Off-White", "LOUIS VUITTON": "Louis Vuitton", DIOR: "Dior", GUCCI: "Gucci" };
const sg = (collection, opts) => ({ kind: "shopify", base: "https://www.stadiumgoods.com", collection, currency: "EGP", byModel: true, ...opts });

const SOURCES = [
  { brand: "Chrome Hearts", kind: "woo", base: "https://chromeheartswear.com" },
  { brand: "Corteiz", kind: "shopify", base: "https://www.corteiz.com", currency: "GBP" },
  { brand: "Trapstar", kind: "shopify", base: "https://hypelockeruk.com", collection: "trapstar-collection", currency: "EGP" },
  { brand: "Essentials", kind: "shopify", base: "https://www.essentials-egy.com", currency: "EGP", brandFromType: ["BAPE", "AAPE", "Sprayground"] },
  { brand: "Denim Tears", kind: "shopify", base: "https://denimtears.com", currency: "EGP" },
  { brand: "Comme des Garçons", kind: "shopify", base: "https://comme-des-garcons.com.au", currency: "AUD" },
  { brand: "Bexon", kind: "shopify", base: "https://bexon.me", currency: "EGP" },
  { brand: "Purple Brand", kind: "shopify", base: "https://purple-brand.com", currency: "EGP", jeansOnly: true },
  { brand: "Amiri", kind: "shopify", base: "https://amiri.com", currency: "USD", jeansOnly: true, alsoFootwear: true },
  // Rick Owens official store: titles are "<SKU> | <NAME>"; RU/RR/DU prefixes are menswear, RP/RO/DS/LI womenswear.
  { brand: "Rick Owens", kind: "shopify", base: "https://rickowens.eu", currency: "EUR", menSku: /^(RU|RR|DU)\d/i },
  // Sneakers, slides and caps via Stadium Goods (feed is localized to EGP). These are grouped by model so a
  // product page can show every colorway; their images stay on the Shopify CDN instead of being downloaded.
  sg("off-white", { brand: "Off-White", forceBrand: true, allow: ["footwear", "headwear"] }),
  sg("louis-vuitton", { brand: "Louis Vuitton", forceBrand: true, allow: ["footwear", "headwear"] }),
  sg("dior", { brand: "Dior", forceBrand: true, allow: ["footwear", "headwear"] }),
  sg("gucci", { brand: "Gucci", forceBrand: true, allow: ["footwear", "headwear"] }),
  ...["air-jordan-1-mens", "air-jordan-3-mens", "air-jordan-4-mens", "air-jordan-11-mens", "jordan-shoes-air-jordan-5", "jordan-shoes-air-jordan-6", "jordan-shoes-air-jordan-12"]
    .map((c) => sg(c, { brand: "Jordan", vendors: ["JORDAN"], allow: ["footwear"] })),
  ...["nike-shoes-nike-lifestyle-air-force-1", "nike-shoes-dunk", "nike-shoes-nike-sb-sb-dunk-low", "nike-shoes-nike-air-max-air-max-90", "nike-shoes-nike-air-max-air-max-95", "nike-shoes-nike-air-max-air-max-97", "nike-shoes-nike-air-max-plus-tn"]
    .map((c) => sg(c, { brand: "Nike", vendors: ["NIKE"], allow: ["footwear"] })),
  sg("nike-tech", { brand: "Nike", vendors: ["NIKE"], allow: ["hoodies", "jackets", "sweatpants", "shorts", "tracksuits"], titleMatch: /\btech\b/i }),
  sg("mens-slides-slippers", { brand: "Slides", vendors: Object.keys(SG_BRANDS), allow: ["footwear"] }),
  sg("hats-beanies", { brand: "Caps", vendors: Object.keys(SG_BRANDS), allow: ["headwear"] }),
  ...[["Balenciaga", "balenciaga"], ["Lanvin", "lanvin"], ["Asics", "asics"], ["Rick Owens", "rick-owens"], ["Rick Owens", "rick-owens-drkshdw"]]
    .map(([brand, c]) => sg(c, { brand, forceBrand: true, allow: ["footwear"] })),
  { brand: "Gucci", kind: "shopify", base: "https://creme321.com", collection: "gucci", currency: "USD", shoesOnly: true },
];

const KIDS = /\b(GS|PS|TD|BG|kids?|toddlers?|infants?|baby|preschool|grade school)\b/i;

const EXCLUDE = /\b(women'?s?|woman|ladies|girls?|wmns|dress(es)?|skirts?|blouses?|pinafore|bras?|heels?|bodysuit|corset|flats|eau de|parfum|perfume|fragrance|vinyl|record|bookstand|gift ?card|candle|ashtray|lighter|home)\b|\(W\)/i;

// Order matters: first match wins.
const CATEGORY_RULES = [
  ["sweatpants", /\b(sweat ?pants?|joggers?|track ?pants?|tracksuit bottoms?)\b/i],
  ["hoodies", /\b(hoodies?|hooded|zip[- ]?up|zip hoodie)\b/i],
  ["crewnecks", /\b(crew ?necks?|sweatshirts?|sweaters?|knit(wear)?|jumpers?|cardigans?)\b/i],
  ["jackets", /\b(jackets?|coats?|puffers?|parkas?|varsity|bombers?|windbreakers?|outerwear|gilets?|vests?|shackets?)\b/i],
  ["pants", /\b(jeans?|denim|pants?|trousers?|cargos?|chinos?|bottoms)\b/i],
  ["tees", /\b(t-?shirts?|tees?|tops?|polos?|jerseys?|shirts?|thermals?|rugby|long ?sleeve|l\/s|s\/s|tank)\b/i],
  ["shorts", /\b(shorts?)\b/i],
  ["tracksuits", /\b(tracksuits?|short set)\b/i],
  ["footwear", /\b(sneakers?|trainers?|shoes?|boots?|slides?|sandals?|loafers?)\b/i],
  ["accessories", /\b(chains?|necklaces?|pendants?|bracelets?|rings?|earrings?|jewel(le)?ry|sunglasses|eyewear|glasses|socks?|boxers?|briefs?|underwear|hats?|caps?|beanies?|headwear|bandanas?|durags?|bags?|backpacks?|wallets?|purses?|pouch|belts?|keychains?|scarf|scarves|gloves|accessor(y|ies))\b/i],
];

const ACCESSORY_TYPES = [
  ["chains", /\b(chains?|necklaces?|pendants?)\b/i],
  ["bracelets", /\b(bracelets?)\b/i],
  ["rings", /\b(rings?|earrings?)\b/i],
  ["sunglasses", /\b(sunglasses|eyewear|glasses)\b/i],
  ["socks", /\b(socks?)\b/i],
  ["boxers", /\b(boxers?|briefs?|underwear)\b/i],
  ["headwear", /\b(hats?|caps?|beanies?|headwear|bandanas?|durags?)\b/i],
  ["bags", /\b(bags?|backpacks?|wallets?|purses?|pouch)\b/i],
  ["belts", /\b(belts?)\b/i],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(url, { headers: { "user-agent": UA, accept: "application/json" } });
    if (res.ok) return res.json();
    if (res.status === 404) return null;
    await sleep(1500 * attempt);
  }
  throw new Error(`Failed: ${url}`);
}

const stripHtml = (html) =>
  (html ?? "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&").replace(/&#8217;|&rsquo;/g, "'").replace(/\s+/g, " ").trim().slice(0, 700);

const slugify = (s) => s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-");

function categorize(text) {
  const hit = CATEGORY_RULES.find(([, re]) => re.test(text));
  if (!hit) return null;
  const category = hit[0];
  const sub = category === "accessories" ? ACCESSORY_TYPES.find(([, re]) => re.test(text))?.[0] ?? "other" : null;
  return { category, sub };
}

function shopifyImage(src) {
  const u = new URL(src.startsWith("//") ? `https:${src}` : src);
  u.searchParams.set("width", "900");
  return u.toString();
}

async function fetchShopify(src) {
  const products = [];
  const basePath = src.collection ? `/collections/${src.collection}/products.json` : "/products.json";
  for (let page = 1; page <= 20; page++) {
    const data = await getJson(`${src.base}${basePath}?limit=250&page=${page}`);
    const batch = data?.products ?? [];
    if (!batch.length) break;
    products.push(...batch);
    await sleep(700);
  }
  return products.map((p) => {
    const optionIndex = (re) => p.options?.findIndex((o) => re.test(o.name)) ?? -1;
    const sizeIdx = optionIndex(/size|waist/i);
    const colorIdx = optionIndex(/colou?r/i);
    const valuesAt = (i) => (i < 0 ? [] : [...new Set(p.variants.map((v) => v[`option${i + 1}`]).filter(Boolean))]);
    const prices = p.variants.map((v) => Number(v.price)).filter((n) => n > 0);
    return {
      externalId: String(p.id),
      title: p.title,
      handle: p.handle,
      url: `${src.base}/products/${p.handle}`,
      description: stripHtml(p.body_html),
      rawType: p.product_type ?? "",
      tags: Array.isArray(p.tags) ? p.tags : String(p.tags ?? "").split(",").map((t) => t.trim()).filter(Boolean),
      vendor: p.vendor,
      publishedAt: p.published_at ?? p.created_at ?? null,
      price: prices.length ? Math.min(...prices) : null,
      currency: src.currency,
      sizes: valuesAt(sizeIdx),
      colors: valuesAt(colorIdx),
      variants: p.variants.map((v) => ({
        size: sizeIdx >= 0 ? v[`option${sizeIdx + 1}`] : null,
        color: colorIdx >= 0 ? v[`option${colorIdx + 1}`] : null,
        available: v.available !== false,
      })),
      images: (p.images ?? []).map((i) => shopifyImage(i.src)),
    };
  });
}

async function fetchWoo(src) {
  const products = [];
  for (let page = 1; page <= 30; page++) {
    const batch = await getJson(`${src.base}/wp-json/wc/store/v1/products?per_page=100&page=${page}`);
    if (!batch?.length) break;
    products.push(...batch);
    await sleep(700);
  }
  return products.map((p) => {
    const attr = (re) => p.attributes?.find((a) => re.test(a.name))?.terms?.map((t) => t.name) ?? [];
    const minor = p.prices?.currency_minor_unit ?? 2;
    return {
      externalId: String(p.id),
      title: p.name,
      handle: p.slug,
      url: p.permalink,
      description: stripHtml(p.short_description || p.description),
      rawType: (p.categories ?? []).map((c) => c.name).join(", "),
      tags: (p.tags ?? []).map((t) => t.name),
      vendor: src.brand,
      price: p.prices?.price ? Number(p.prices.price) / 10 ** minor : null,
      currency: p.prices?.currency_code ?? "USD",
      sizes: attr(/size/i),
      colors: attr(/colou?r/i),
      variants: [],
      images: (p.images ?? []).map((i) => i.src),
    };
  });
}

function normalize(src, raw) {
  const text = `${raw.title} ${raw.rawType} ${raw.tags.join(" ")}`;
  if (EXCLUDE.test(text) || /CDG GIRL|TEIBAN KICHU \(CDG GIRL\)/i.test(raw.vendor ?? "")) return null;
  if (!raw.images.length || !raw.price) return null;
  if (src.menSku) {
    if (!src.menSku.test(raw.title)) return null;
    raw.title = raw.title.split("|").pop().trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }

  const vendor = (raw.vendor ?? "").toUpperCase();
  if (src.vendors && !src.vendors.includes(vendor)) return null;
  // Kids' sizes, and women's models written as "Model W" (e.g. D'orsay W "Black").
  if (src.byModel && (KIDS.test(raw.title) || /\sW\s*"/.test(raw.title))) return null;
  if (src.titleMatch && !src.titleMatch.test(raw.title)) return null;

  const cat = categorize(`${raw.title} ${raw.rawType}`) ?? categorize(text);
  if (!cat) return null;
  if (src.shoesOnly && cat.category !== "footwear") return null;
  if (src.allow && !src.allow.includes(cat.category) && !(src.allow.includes("headwear") && cat.sub === "headwear")) return null;
  const isFitJean = /\b(jeans?|denim)\b/i.test(text) && /\b(skinny|flare[sd]?)\b/i.test(text);
  if (src.jeansOnly && !isFitJean && !(src.alsoFootwear && cat.category === "footwear")) return null;

  const brand = src.byModel
    ? (src.forceBrand ? src.brand : SG_BRANDS[vendor] ?? src.brand)
    : src.brandFromType?.find((b) => raw.rawType.toUpperCase() === b.toUpperCase()) ?? src.brand;
  const fit = /\bflare[sd]?\b/i.test(text) ? "flared" : /\bskinny\b/i.test(text) ? "skinny" : null;

  // Stadium Goods titles read: Model "Colorway" SKU.
  const named = src.byModel ? raw.title.match(/^(.*?)\s*"([^"]+)"/) : null;
  const model = src.byModel ? (named?.[1] ?? raw.title).trim() : null;
  const colorway = named?.[2]?.trim() ?? null;
  if (named) raw.title = `${model} "${colorway}"`;

  return {
    id: src.byModel ? `sg-${raw.externalId}` : `${slugify(src.brand)}-${raw.externalId}`,
    slug: `${slugify(brand)}-${slugify(raw.title)}`.slice(0, 90),
    brand,
    model,
    modelKey: model ? slugify(`${brand} ${model}`) : null,
    colorway,
    publishedAt: raw.publishedAt ?? null,
    remoteImages: src.byModel ? true : undefined,
    source: src.base,
    category: cat.category,
    subcategory: cat.sub,
    fit,
    title: raw.title,
    description: raw.description,
    priceOriginal: raw.price,
    currencyOriginal: raw.currency,
    priceEGP: Math.round((raw.price * (TO_EGP[raw.currency] ?? 1)) / 50) * 50,
    sizes: raw.sizes,
    colors: raw.colors,
    variants: raw.variants,
    images: raw.images.slice(0, 6),
    sourceUrl: raw.url,
  };
}

const catalog = [];
for (const src of SOURCES) {
  try {
    const raw = src.kind === "woo" ? await fetchWoo(src) : await fetchShopify(src);
    const items = raw.map((r) => normalize(src, r)).filter(Boolean);
    catalog.push(...items);
    console.log(`${`${src.brand}${src.collection ? ` (${src.collection})` : ""}`.padEnd(48)} fetched ${String(raw.length).padStart(5)}  kept ${String(items.length).padStart(5)}`);
  } catch (err) {
    console.error(`${src.brand}: ${err.message}`);
  }
}

// The same product can sit in several collections (e.g. an Off-White Nike in both off-white and slides).
const byId = new Map();
for (const p of catalog) if (!byId.has(p.id)) byId.set(p.id, p);
catalog.length = 0;
catalog.push(...byId.values());

// Model-grouped products: keep the most-stocked models per brand/category, each with its newest colorways.
const MODELS_PER_BUCKET = 20;
const COLORWAYS_PER_MODEL = 150;
const modelBuckets = new Map();
for (const p of catalog.filter((p) => p.modelKey)) {
  const bucketKey = `${p.brand}|${p.category}|${p.subcategory ?? ""}`;
  if (!modelBuckets.has(bucketKey)) modelBuckets.set(bucketKey, new Map());
  const models = modelBuckets.get(bucketKey);
  if (!models.has(p.modelKey)) models.set(p.modelKey, []);
  models.get(p.modelKey).push(p);
}
const curatedModels = [...modelBuckets.values()].flatMap((models) =>
  [...models.values()]
    .sort((a, b) => b.length - a.length)
    .slice(0, MODELS_PER_BUCKET)
    .flatMap((colorways) =>
      colorways.sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt))).slice(0, COLORWAYS_PER_MODEL),
    ),
);

// Everything else: the best-photographed items per brand/category (accessories per type).
const MAX_PER_GROUP = 20;
const MAX_PER_ACCESSORY_TYPE = 8;
const groups = new Map();
for (const p of catalog.filter((p) => !p.modelKey)) {
  const key = p.category === "accessories" ? `${p.brand}|acc|${p.subcategory}` : `${p.brand}|${p.category}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(p);
}
const score = (p) => Math.min(p.images.length, 4) * 2 + (p.variants.some((v) => v.available) ? 1 : 0) + (p.sizes.length ? 1 : 0);
const curated = [...groups.entries()].flatMap(([key, items]) =>
  items.sort((a, b) => score(b) - score(a)).slice(0, key.includes("|acc|") ? MAX_PER_ACCESSORY_TYPE : MAX_PER_GROUP),
);
console.log(`Curated ${curated.length + curatedModels.length} of ${catalog.length} products (${curatedModels.length} as model colorways)`);
catalog.length = 0;
catalog.push(...curated, ...curatedModels);

// De-duplicate slugs.
const seen = new Map();
for (const p of catalog) {
  const n = seen.get(p.slug) ?? 0;
  seen.set(p.slug, n + 1);
  if (n) p.slug = `${p.slug}-${n + 1}`;
}

await mkdir(path.dirname(OUT), { recursive: true });
await writeFile(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), count: catalog.length, products: catalog }, null, 2));
console.log(`\nWrote ${catalog.length} products to ${OUT}`);
