// Builds the demo catalog (data/catalog.json) from public product feeds of reference brands.
// Demo/testing only: images and copy belong to their brands.
// Usage: node scripts/scrape-catalog.mjs                       (full rebuild)
//        node scripts/scrape-catalog.mjs --merge --only=zara,moncler   (re-scrape some sources into the existing catalog)
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const OUT = path.resolve(import.meta.dirname, "../data/catalog.json");
const MERGE = process.argv.includes("--merge");
const ONLY = (process.argv.find((a) => a.startsWith("--only="))?.slice(7) ?? "").toLowerCase().split(",").filter(Boolean);
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36";

// Some stores localize their feed to EGP for Egyptian visitors, so currency is set per feed as observed.
// Approximate demo rates to EGP.
const TO_EGP = { EGP: 1, USD: 48.5, GBP: 64, EUR: 52.5, AUD: 31.5 };

const SG_BRANDS = { NIKE: "Nike", JORDAN: "Jordan", "OFF-WHITE": "Off-White", "LOUIS VUITTON": "Louis Vuitton", DIOR: "Dior", GUCCI: "Gucci" };
const sg = (collection, opts) => ({ kind: "shopify", base: "https://www.stadiumgoods.com", collection, currency: "EGP", byModel: true, ...opts });

// essentials-egy.com and bexon.me are multi-brand shops, not brands. Their feeds are split into the real brands:
// Essentials by product_type (null = skip the product), Bexon by the brand named in the product title.
const ESSENTIALS_EGY_TYPES = {
  "fog essentials": "Essentials",
  "ralph lauren": "Polo Ralph Lauren",
  bape: "BAPE",
  aape: "AAPE",
  sprayground: "Sprayground",
  "off white": "Off-White",
  stussy: "Stussy",
  "marcelo burlon": "Marcelo Burlon",
  goyard: "Goyard",
  "ami paris": "AMI",
  "palm angels": "Palm Angels",
  "the north face": "The North Face",
  "north face": "The North Face",
  "comme des garcones": "Comme des Garçons",
  "nike x air jordan": "Jordan",
  "air jordan": "Jordan",
  nike: "Nike",
  "denim tears": "Denim Tears",
  "cactus jack": "Cactus Jack",
  rhude: "Rhude",
  "heron preston": "Heron Preston",
  diesel: "Diesel",
  "eric emanuel": "Eric Emanuel",
  "saint laurent": "Saint Laurent",
  "play boy": "Playboy",
  mcqueen: "Alexander McQueen",
  perfume: null,
  "body mist": null,
};
// Order matters: the first match names the brand.
const TITLE_BRANDS = [
  [/moncler/i, "Moncler"],
  [/chrome ?hearts/i, "Chrome Hearts"],
  [/casablanca/i, "Casablanca"],
  [/maison margiela|margiela/i, "Maison Margiela"],
  [/palm ?angels/i, "Palm Angels"],
  [/\bbape\b|babe baby milo|bathing ape/i, "BAPE"],
  [/\bcdg\b|comme des gar/i, "Comme des Garçons"],
  [/amiri/i, "Amiri"],
  [/\bami\b/i, "AMI"],
  [/rhude/i, "Rhude"],
  [/marcelo|burlon/i, "Marcelo Burlon"],
  [/rick owens/i, "Rick Owens"],
  [/balenciaga/i, "Balenciaga"],
  [/gucci/i, "Gucci"],
  [/louis vuitton|\blv\b/i, "Louis Vuitton"],
  [/\bdior\b/i, "Dior"],
  [/off[- ]?white/i, "Off-White"],
  [/corteiz|crtz/i, "Corteiz"],
  [/trapstar/i, "Trapstar"],
  [/stussy|stüssy/i, "Stussy"],
  [/ralph lauren|polo bear|\bprl\b/i, "Polo Ralph Lauren"],
  [/adidas|yeezy/i, "Adidas"],
  [/denim tears/i, "Denim Tears"],
  [/essentials|fear of god/i, "Essentials"],
  [/north face/i, "The North Face"],
  [/\bnike\b/i, "Nike"],
  [/jordan/i, "Jordan"],
  [/purple/i, "Purple Brand"],
];

const SOURCES = [
  { brand: "Chrome Hearts", kind: "woo", base: "https://chromeheartswear.com" },
  { brand: "Corteiz", kind: "shopify", base: "https://www.corteiz.com", currency: "GBP" },
  { brand: "Trapstar", kind: "shopify", base: "https://hypelockeruk.com", collection: "trapstar-collection", currency: "EGP" },
  { brand: "Essentials", kind: "shopify", base: "https://www.essentials-egy.com", currency: "EGP", brandByType: ESSENTIALS_EGY_TYPES, remoteImages: true },
  { brand: "Denim Tears", kind: "shopify", base: "https://denimtears.com", currency: "EGP" },
  { brand: "Comme des Garçons", kind: "shopify", base: "https://comme-des-garcons.com.au", currency: "AUD" },
  { brand: "Bexon", kind: "shopify", base: "https://bexon.me", currency: "EGP", brandByTitle: TITLE_BRANDS, titleSkip: /partial payment|gift ?card|shipping/i, remoteImages: true },
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
  sg("mens-slides-slippers", { brand: "Slides", vendors: Object.keys(SG_BRANDS), allow: ["slides"] }),
  sg("hats-beanies", { brand: "Caps", vendors: Object.keys(SG_BRANDS), allow: ["headwear"] }),
  ...[["Balenciaga", "balenciaga"], ["Lanvin", "lanvin"], ["Asics", "asics"], ["Rick Owens", "rick-owens"], ["Rick Owens", "rick-owens-drkshdw"]]
    .map(([brand, c]) => sg(c, { brand, forceBrand: true, allow: ["footwear"] })),
  { brand: "Gucci", kind: "shopify", base: "https://creme321.com", collection: "gucci", currency: "USD", shoesOnly: true },

  // Round 12: more depth for brands the user asked to be fuller.
  sg("casablanca", { brand: "Casablanca", forceBrand: true, vendors: ["CASABLANCA"] }),
  sg("palm-angels", { brand: "Palm Angels", forceBrand: true, vendors: ["PALM ANGELS"] }),
  sg("stussy", { brand: "Stussy", forceBrand: true, vendors: ["STUSSY"] }),
  sg("the-north-face", { brand: "The North Face", forceBrand: true, vendors: ["THE NORTH FACE"] }),
  { brand: "Casablanca", kind: "shopify", base: "https://casablancaparis.com", currency: "USD", remoteImages: true },
  { brand: "Stussy", kind: "shopify", base: "https://www.stussy.com", currency: "USD", remoteImages: true },

  // Brands added in round 11 (clothes and shoes via Stadium Goods, Zara straight from its Egypt storefront).
  sg("moncler", { brand: "Moncler", forceBrand: true, vendors: ["MONCLER"] }),
  sg("polo-ralph-lauren", { brand: "Polo Ralph Lauren", forceBrand: true, vendors: ["POLO RALPH LAUREN"] }),
  sg("marcelo-burlon", { brand: "Marcelo Burlon", forceBrand: true, vendors: ["MARCELO BURLON", "MARCELO BURLON COUNTY OF MILAN"] }),
  sg("streetwear-other-brands-rhude", { brand: "Rhude", forceBrand: true, vendors: ["RHUDE"] }),
  sg("ami-paris", { brand: "AMI", forceBrand: true, vendors: ["AMI PARIS"] }),
  ...["adidas-shoes-samba", "adidas-shoes-gazelle", "adidas-shoes-campus", "adidas-shoes-superstar", "adidas-shoes-stan-smith", "adidas-shoes-handball-spezial", "yeezy-350", "yeezy-700", "adidas-x-fear-of-god"]
    .map((c) => sg(c, { brand: "Adidas", forceBrand: true, vendors: ["ADIDAS", "YEEZY"], allow: ["footwear"] })),
  sg("yeezy-slides", { brand: "Adidas", forceBrand: true, vendors: ["ADIDAS", "YEEZY"], allow: ["slides"] }),
  sg("adidas-apparel", { brand: "Adidas", forceBrand: true, vendors: ["ADIDAS"], allow: ["hoodies", "jackets", "sweatpants", "shorts", "tracksuits", "tees", "pants", "crewnecks"] }),
  {
    brand: "Zara",
    kind: "zara",
    base: "https://www.zara.com",
    currency: "EGP",
    remoteImages: true,
    lists: [
      ["man-jackets-l640", "jackets"], ["man-outerwear-padded-l722", "jackets"], ["man-outerwear-coats-l719", "jackets"], ["man-jackets-bombers-l645", "jackets"],
      ["man-sweatshirts-hoodies-l1525", "hoodies"],
      ["man-sweatshirts-crew-neck-l4465", "crewnecks"], ["man-knitwear-sweaters-l701", "crewnecks"],
      ["man-jeans-l659", "pants"], ["man-trousers-l838", "pants"], ["man-trousers-cargo-l1780", "pants"],
      ["man-sweatpants-l19246", "sweatpants"], ["man-trousers-joggers-l849", "sweatpants"],
      ["man-tshirts-l855", "tees"], ["man-polos-l733", "tees"],
      ["man-bermudas-l592", "shorts"],
      ["man-tracksuits-l17522", "tracksuits"],
      ["man-sneakers-l7460", "footwear"],
      ["man-accessories-socks-l555", "accessories"], ["man-underwear-l875", "accessories"], ["man-accessories-l537", null],
    ],
  },
];

const KIDS = /\b(GS|PS|TD|BG|kids?|toddlers?|infants?|baby|preschool|grade school)\b/i;

const EXCLUDE = /\b(women'?s?|woman|ladies|girls?|wmns|dress(es)?|skirts?|blouses?|pinafore|bras?|heels?|bodysuit|corset|flats|eau de|parfum|perfume|fragrance|vinyl|record|bookstand|gift ?card|candle|ashtray|lighter|home)\b|\(W\)/i;

// Slides and shoes are decided before the clothing rules, so "High-Top Sneakers" is never a top and a slide is
// never a shoe. Order matters: first match wins.
const SLIDES = /\b(slides?|sliders?|slippers?|sandals?|flip[- ]?flops?|clogs?|mules?)\b/i;
const SHOES = /\b(sneakers?|sneaks|trainers?|shoes?|boots?(?! ?cut)|loafers?|derbys?|runners?)\b/i;
const HIGH_LOW_TOP = /\b(high|low|mid)[- ]?tops?\b/gi;
const CLOTHING = /\b(hoodies?|t-?shirts?|tees?|jackets?|coats?|puffers?|pants|trousers|shorts|sweatshirts?|sweaters?|jeans|tracksuits?|joggers?)\b/i;
const CATEGORY_RULES = [
  ["slides", SLIDES],
  ["footwear", SHOES],
  ["accessories", /(caps?|hats?|beanies?|backpacks?|bags?|wallets?|belts?)/i],
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
  text = text.replace(HIGH_LOW_TOP, " ");
  // "Sneaker print tee" is a tee: a clothing word beats a shoe word.
  const clothed = CLOTHING.test(text);
  const hit = CATEGORY_RULES.find(([name, re]) => !(clothed && (name === "slides" || name === "footwear")) && re.test(text));
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

// Zara's storefront JSON: prices come in cents, photos are on static.zara.net, and sizes are not in the listing.
async function fetchZara(src) {
  const products = new Map();
  for (const [slug, category] of src.lists) {
    let seen = 0;
    for (let page = 1; page <= 4; page++) {
      const data = await getJson(`${src.base}/eg/en/${slug}.html?ajax=true&page=${page}`);
      const items = (data?.productGroups ?? []).flatMap((g) => g.elements ?? []).flatMap((e) => e.commercialComponents ?? []).filter((c) => c.type === "Product" && c.price);
      if (items.length <= seen) break;
      seen = items.length;
      for (const c of items) if (!products.has(c.id)) products.set(c.id, { c, category });
      if (data.paginationInfo?.isLastPage) break;
      await sleep(800);
    }
    console.log(`  zara ${slug.padEnd(34)} ${String(seen).padStart(3)} items`);
  }
  return [...products.values()].map(({ c, category }) => {
    const colors = c.detail?.colors ?? [];
    const photo = (m) => m.url.replace("{width}", "750");
    const hasUrl = (m) => m.type === "image" && typeof m.url === "string";
    const images = colors.flatMap((col) => (col.xmedia ?? []).filter(hasUrl).map(photo));
    const title = c.name.toLowerCase().replace(/\b\w/g, (ch) => ch.toUpperCase());
    return {
      externalId: String(c.id),
      title,
      handle: slugify(title),
      url: `${src.base}/eg/en/-p${String(c.reference ?? "").slice(0, 8)}.html`,
      description: stripHtml(c.description),
      rawType: `${c.familyName ?? ""} ${c.subfamilyName ?? ""}`,
      tags: [],
      vendor: "Zara",
      publishedAt: c.detail?.colors?.[0]?.xmedia?.[0]?.timestamp ? new Date(Number(c.detail.colors[0].xmedia[0].timestamp)).toISOString() : null,
      price: c.price / 100,
      currency: src.currency,
      zaraCategory: category,
      sizes: category === "footwear" ? ["40", "41", "42", "43", "44", "45"] : category === "accessories" ? [] : ["S", "M", "L", "XL"],
      colors: colors.map((col) => col.name).filter(Boolean),
      variants: [],
      images,
    };
  });
}

function normalize(src, raw) {
  const text = `${raw.title} ${raw.rawType} ${raw.tags.join(" ")}`;
  if (EXCLUDE.test(text) || /CDG GIRL|TEIBAN KICHU \(CDG GIRL\)/i.test(raw.vendor ?? "")) return null;
  if (!raw.images.length || !raw.price) return null;
  if (src.titleSkip?.test(raw.title)) return null;
  if (src.menSku) {
    if (!src.menSku.test(raw.title)) return null;
    raw.title = raw.title.split("|").pop().trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }

  const vendor = (raw.vendor ?? "").toUpperCase();
  if (src.vendors && !src.vendors.includes(vendor)) return null;
  // Kids' sizes, and women's models written as "Model W" (e.g. D'orsay W "Black").
  if (src.byModel && (KIDS.test(raw.title) || /\sW\s*"/.test(raw.title))) return null;
  if (src.titleMatch && !src.titleMatch.test(raw.title)) return null;

  let cat = categorize(`${raw.title} ${raw.rawType}`) ?? categorize(text);
  // A shoe collection holds shoes whatever the colorway is called ("Top 3", "Tee Dye"); only slides move out.
  if (src.byModel && src.allow?.length === 1 && ["footwear", "slides"].includes(src.allow[0])) {
    cat = { category: SLIDES.test(raw.title) ? "slides" : "footwear", sub: null };
  }
  if (raw.zaraCategory) cat = { category: raw.zaraCategory, sub: raw.zaraCategory === "accessories" ? categorize(text)?.sub ?? "other" : null };
  if (!cat) return null;
  if (src.shoesOnly && cat.category !== "footwear") return null;
  if (src.allow && !src.allow.includes(cat.category) && !(src.allow.includes("headwear") && cat.sub === "headwear")) return null;
  const isFitJean = /\b(jeans?|denim)\b/i.test(text) && /\b(skinny|flare[sd]?)\b/i.test(text);
  if (src.jeansOnly && !isFitJean && !(src.alsoFootwear && cat.category === "footwear")) return null;

  let brand = src.brand;
  if (src.byModel) brand = src.forceBrand ? src.brand : SG_BRANDS[vendor] ?? src.brand;
  else if (src.brandByType) {
    const type = raw.rawType.trim().toLowerCase();
    brand = type in src.brandByType ? src.brandByType[type] : TITLE_BRANDS.find(([re]) => re.test(raw.title))?.[1] ?? null;
    // The shop files other labels (e.g. Casablanca) under Fog essentials; only genuine Essentials stays.
    if (brand === "Essentials" && !/essentials|fear of god|\bfog\b/i.test(raw.title)) brand = TITLE_BRANDS.find(([re]) => re.test(raw.title))?.[1] ?? null;
    if (!brand) return null;
  } else if (src.brandByTitle) {
    brand = src.brandByTitle.find(([re]) => re.test(raw.title))?.[1] ?? null;
    if (!brand) return null;
  }
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
    remoteImages: src.byModel || src.remoteImages ? true : undefined,
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

const wanted = (src) => !ONLY.length || ONLY.some((t) => `${src.brand} ${src.collection ?? ""} ${src.base}`.toLowerCase().includes(t));
const catalog = [];
for (const src of SOURCES.filter(wanted)) {
  try {
    const fetchers = { woo: fetchWoo, zara: fetchZara, shopify: fetchShopify };
    const raw = await fetchers[src.kind](src);
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

// --merge: keep the existing catalog, drop what the re-scraped multi-brand shops held before, and fix categories
// of what stays (shoes filed under tops, slides filed under shoes).
let existing = [];
if (MERGE) {
  const rescraped = new Set(SOURCES.filter(wanted).filter((s) => !s.byModel).map((s) => s.base));
  const all = JSON.parse(await readFile(OUT, "utf8")).products;
  existing = all.filter((p) => !rescraped.has(p.source));
  let fixed = 0;
  for (const p of existing) {
    const t = p.title.replace(HIGH_LOW_TOP, " ");
    const before = p.category;
    if (!CLOTHING.test(t) && p.category !== "accessories") {
      if (SLIDES.test(t)) p.category = "slides";
      else if (!["footwear", "slides"].includes(p.category) && SHOES.test(t)) p.category = "footwear";
    }
    if (p.category !== before) { p.subcategory = null; fixed++; }
  }
  const have = new Set(existing.map((p) => p.id));
  catalog.splice(0, catalog.length, ...catalog.filter((p) => !have.has(p.id)));
  console.log(`Merging into ${existing.length} existing products (dropped ${all.length - existing.length} from re-scraped shops, re-filed ${fixed})`);
}
const countBy = (items, keyOf) => items.reduce((m, p) => m.set(keyOf(p), (m.get(keyOf(p)) ?? 0) + 1), new Map());
const modelKeyOf = (p) => `${p.brand}|${p.category}|${p.subcategory ?? ""}`;
const groupKeyOf = (p) => (p.category === "accessories" ? `${p.brand}|acc|${p.subcategory}` : `${p.brand}|${p.category}`);
const existingModels = new Map();
for (const p of existing.filter((p) => p.modelKey)) {
  if (!existingModels.has(modelKeyOf(p))) existingModels.set(modelKeyOf(p), new Set());
  existingModels.get(modelKeyOf(p)).add(p.modelKey);
}
const existingGroups = countBy(existing.filter((p) => !p.modelKey), groupKeyOf);

// Model-grouped products: keep the most-stocked models per brand/category, each with its newest colorways.
const MODELS_PER_BUCKET = 20;
const COLORWAYS_PER_MODEL = 150;
const modelBuckets = new Map();
for (const p of catalog.filter((p) => p.modelKey)) {
  const bucketKey = modelKeyOf(p);
  if (!modelBuckets.has(bucketKey)) modelBuckets.set(bucketKey, new Map());
  const models = modelBuckets.get(bucketKey);
  if (!models.has(p.modelKey)) models.set(p.modelKey, []);
  models.get(p.modelKey).push(p);
}
const curatedModels = [...modelBuckets.entries()].flatMap(([bucketKey, models]) =>
  [...models.values()]
    .sort((a, b) => b.length - a.length)
    .slice(0, Math.max(0, MODELS_PER_BUCKET - (existingModels.get(bucketKey)?.size ?? 0)))
    .flatMap((colorways) =>
      colorways.sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt))).slice(0, COLORWAYS_PER_MODEL),
    ),
);

// Everything else: the best-photographed items per brand/category (accessories per type).
const MAX_PER_GROUP = 20;
const MAX_PER_ACCESSORY_TYPE = 8;
const groups = new Map();
for (const p of catalog.filter((p) => !p.modelKey)) {
  if (!groups.has(groupKeyOf(p))) groups.set(groupKeyOf(p), []);
  groups.get(groupKeyOf(p)).push(p);
}
const score = (p) => Math.min(p.images.length, 4) * 2 + (p.variants.some((v) => v.available) ? 1 : 0) + (p.sizes.length ? 1 : 0);
const curated = [...groups.entries()].flatMap(([key, items]) =>
  items.sort((a, b) => score(b) - score(a)).slice(0, Math.max(0, (key.includes("|acc|") ? MAX_PER_ACCESSORY_TYPE : MAX_PER_GROUP) - (existingGroups.get(key) ?? 0))),
);
console.log(`Curated ${curated.length + curatedModels.length} of ${catalog.length} products (${curatedModels.length} as model colorways)`);
catalog.length = 0;
catalog.push(...existing, ...curated, ...curatedModels);

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
