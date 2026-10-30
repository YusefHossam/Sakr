import { canonicalTokens } from "./search-normalize";

export type TypeFilter = { category: string; subcategory?: string };
export type Intent = {
  brandSlugs: string[];
  types: TypeFilter[];
  colours: string[];
  rest: string[];
  tokens: string[];
};

// Canonical English word -> where those products live in the catalog.
const TYPES: Record<string, TypeFilter> = {
  sunglasses: { category: "accessories", subcategory: "sunglasses" },
  chain: { category: "accessories", subcategory: "chains" },
  bracelet: { category: "accessories", subcategory: "bracelets" },
  ring: { category: "accessories", subcategory: "rings" },
  watch: { category: "accessories", subcategory: "watches" },
  cap: { category: "accessories", subcategory: "headwear" },
  hat: { category: "accessories", subcategory: "headwear" },
  beanie: { category: "accessories", subcategory: "headwear" },
  bag: { category: "accessories", subcategory: "bags" },
  backpack: { category: "accessories", subcategory: "bags" },
  belt: { category: "accessories", subcategory: "belts" },
  socks: { category: "accessories", subcategory: "socks" },
  boxer: { category: "accessories", subcategory: "boxers" },
  mask: { category: "accessories", subcategory: "masks" },
  perfume: { category: "accessories", subcategory: "perfumes" },
  hoodie: { category: "hoodies" },
  jacket: { category: "jackets" },
  puffer: { category: "jackets" },
  "t-shirt": { category: "tees" },
  tee: { category: "tees" },
  polo: { category: "tees" },
  pants: { category: "pants" },
  jeans: { category: "pants" },
  denim: { category: "pants" },
  cargo: { category: "pants" },
  shorts: { category: "shorts" },
  sweatpants: { category: "sweatpants" },
  jogger: { category: "sweatpants" },
  crewneck: { category: "crewnecks" },
  sweater: { category: "crewnecks" },
  sweatshirt: { category: "crewnecks" },
  tracksuit: { category: "tracksuits" },
  sneakers: { category: "footwear" },
  shoes: { category: "footwear" },
  boots: { category: "footwear" },
  slide: { category: "slides" },
  slipper: { category: "slides", subcategory: "slippers" },
  sandal: { category: "slides" },
  crocs: { category: "slides", subcategory: "clogs" },
};

const COLOURS = new Set(["black", "white", "red", "blue", "green", "grey", "brown", "pink", "yellow", "navy", "beige", "orange", "purple", "cream", "silver", "gold"]);
const SKIP = new Set(["the", "and", "for", "of", "with", "de", "des", "by"]);

/** Splits a free-text query into brand, kind and colour filters; the rest stays as plain words. */
export function resolveIntent(q: string, brands: { slug: string; name: string }[]): Intent {
  const tokens = canonicalTokens(q).filter((t) => !SKIP.has(t));
  const left = new Set(tokens);
  const brandSlugs: string[] = [];

  // A brand matches when every word of its name was typed (longest names first so "Off-White" beats "White").
  const index = brands
    .map((b) => ({ slug: b.slug, words: b.name.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w && !SKIP.has(w)) }))
    .filter((b) => b.words.length)
    .sort((a, b) => b.words.length - a.words.length);
  for (const b of index) {
    if (b.words.every((w) => left.has(w))) {
      brandSlugs.push(b.slug);
      for (const w of b.words) left.delete(w);
    }
  }

  const types: TypeFilter[] = [];
  for (const t of [...left]) {
    const hit = TYPES[t];
    if (hit && !types.some((x) => x.category === hit.category && x.subcategory === hit.subcategory)) {
      types.push(hit);
      left.delete(t);
    }
  }
  const colours = [...left].filter((t) => COLOURS.has(t));
  for (const c of colours) left.delete(c);
  return { brandSlugs, types, colours, rest: [...left], tokens };
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Mongo filter for an intent, or null when the query named nothing the catalog is organised by. */
export function intentFilter(intent: Intent): Record<string, unknown> | null {
  if (!intent.brandSlugs.length && !intent.types.length) return null;
  const and: Record<string, unknown>[] = [];
  if (intent.brandSlugs.length) and.push({ brandSlug: { $in: intent.brandSlugs } });
  if (intent.types.length) and.push({ $or: intent.types.map((t) => (t.subcategory ? { category: t.category, subcategory: t.subcategory } : { category: t.category })) });
  for (const c of intent.colours) {
    const re = new RegExp(`\\b${escape(c)}`, "i");
    and.push({ $or: [{ title: re }, { colorway: re }, { colors: re }] });
  }
  for (const w of intent.rest) and.push({ $or: [{ title: new RegExp(escape(w), "i") }, { model: new RegExp(escape(w), "i") }] });
  return { $and: and };
}

const CATEGORY_LABELS: Record<string, { ar: string; en: string }> = {
  hoodies: { ar: "هوديز", en: "Hoodies" }, crewnecks: { ar: "كرونيك", en: "Crewnecks" }, jackets: { ar: "جواكت", en: "Jackets" }, pants: { ar: "بناطيل", en: "Pants" },
  sweatpants: { ar: "سويت بانتس", en: "Sweatpants" }, tees: { ar: "تيشيرتات", en: "Tees" }, shorts: { ar: "شورتات", en: "Shorts" }, tracksuits: { ar: "تراكسوت", en: "Tracksuits" },
  footwear: { ar: "كوتشيات", en: "Shoes" }, slides: { ar: "شباشب وسلايدز", en: "Slides" }, accessories: { ar: "إكسسوارات", en: "Accessories" },
};
const SUB_LABELS: Record<string, { ar: string; en: string }> = {
  chains: { ar: "سلاسل", en: "Chains" }, bracelets: { ar: "أساور", en: "Bracelets" }, rings: { ar: "خواتم", en: "Rings" }, sunglasses: { ar: "نضارات", en: "Sunglasses" },
  socks: { ar: "شرابات", en: "Socks" }, boxers: { ar: "بوكسرات", en: "Boxers" }, headwear: { ar: "كابات وطواقي", en: "Headwear" }, bags: { ar: "شنط", en: "Bags" },
  belts: { ar: "أحزمة", en: "Belts" }, slides: { ar: "سلايدز", en: "Slides" }, slippers: { ar: "سليبرز", en: "Slippers" }, clogs: { ar: "كروكس", en: "Crocs & clogs" }, masks: { ar: "ماسكات", en: "Masks" }, watches: { ar: "ساعات", en: "Watches" }, perfumes: { ar: "برفانات", en: "Perfumes" },
};

export function typeLabel(t: TypeFilter): { ar: string; en: string } {
  return (t.subcategory && SUB_LABELS[t.subcategory]) || CATEGORY_LABELS[t.category] || { ar: t.category, en: t.category };
}
