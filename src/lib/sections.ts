// Client-safe. The seven shop sections customers see. The database keeps its finer categories; a section groups
// them, and its types narrow it down (by category, subcategory or a word in the title).

export const SECTIONS = ["tees", "hoodies", "jackets", "pants", "shorts", "shoes", "accessories"] as const;
export type Section = (typeof SECTIONS)[number];
export const isSection = (s: string): s is Section => (SECTIONS as readonly string[]).includes(s);

type Label = { ar: string; en: string };
/** One filter inside a section. `title` / `notTitle` are regex sources matched against the product title. */
export type SectionType = { key: string; label: Label; categories?: string[]; subcategory?: string; title?: string; notTitle?: string };
type SectionDef = { label: Label; categories: string[]; types: SectionType[] };

const ACCESSORY: [string, Label][] = [
  ["chains", { ar: "سلاسل", en: "Chains" }],
  ["watches", { ar: "ساعات", en: "Watches" }],
  ["sunglasses", { ar: "نضارات", en: "Sunglasses" }],
  ["rings", { ar: "خواتم", en: "Rings" }],
  ["bracelets", { ar: "أساور", en: "Bracelets" }],
  ["headwear", { ar: "كابات وطواقي", en: "Caps & hats" }],
  ["boxers", { ar: "بوكسرات", en: "Boxers" }],
  ["socks", { ar: "شرابات", en: "Socks" }],
  ["bags", { ar: "شنط", en: "Bags" }],
  ["scarves", { ar: "سكارفات", en: "Scarves" }],
  ["belts", { ar: "أحزمة", en: "Belts" }],
  ["masks", { ar: "ماسكات", en: "Masks" }],
  ["perfumes", { ar: "برفانات", en: "Perfumes" }],
];

export const SECTION_DEF: Record<Section, SectionDef> = {
  tees: { label: { ar: "تيشيرتات", en: "Tees" }, categories: ["tees"], types: [
    { key: "tshirts", label: { ar: "تيشيرتات", en: "T-shirts" }, notTitle: "\\bpolo\\b|\\bshirt\\b(?!.*t-?shirt)" },
    { key: "polos", label: { ar: "بولو", en: "Polos" }, title: "\\bpolo\\b" },
    { key: "longsleeve", label: { ar: "كم طويل", en: "Long sleeve" }, title: "long ?sleeve|\\bl/s\\b|\\bls\\b" },
  ] },
  hoodies: { label: { ar: "هوديز وسويتشيرت", en: "Hoodies & sweatshirts" }, categories: ["hoodies", "crewnecks"], types: [
    { key: "hoodies", label: { ar: "هوديز", en: "Hoodies" }, categories: ["hoodies"] },
    { key: "sweatshirts", label: { ar: "سويتشيرت وكنزات", en: "Sweatshirts & knits" }, categories: ["crewnecks"] },
  ] },
  jackets: { label: { ar: "جواكت", en: "Jackets" }, categories: ["jackets"], types: [
    { key: "puffers", label: { ar: "بافر", en: "Puffers" }, title: "puffer|down|nuptse|padded|quilted" },
    { key: "leather", label: { ar: "جلد", en: "Leather" }, title: "leather|biker" },
    { key: "denim", label: { ar: "جينز", en: "Denim" }, title: "denim|jean" },
    { key: "varsity", label: { ar: "فارسيتي وبومبر", en: "Varsity & bomber" }, title: "varsity|bomber" },
  ] },
  pants: { label: { ar: "بناطيل", en: "Pants" }, categories: ["pants", "sweatpants", "tracksuits"], types: [
    { key: "jeans", label: { ar: "جينز", en: "Jeans" }, categories: ["pants"], title: "jean|denim" },
    { key: "cargo", label: { ar: "كارجو", en: "Cargo" }, categories: ["pants"], title: "cargo" },
    { key: "trousers", label: { ar: "بنطلونات", en: "Trousers" }, categories: ["pants"], notTitle: "jean|denim|cargo" },
    { key: "sweatpants", label: { ar: "سويت بانتس", en: "Sweatpants" }, categories: ["sweatpants", "tracksuits"] },
  ] },
  shorts: { label: { ar: "شورتات", en: "Shorts" }, categories: ["shorts"], types: [] },
  shoes: { label: { ar: "شوزات", en: "Shoes" }, categories: ["footwear", "slides"], types: [
    { key: "sneakers", label: { ar: "كوتشيات", en: "Sneakers" }, categories: ["footwear"], notTitle: "\\bboots?\\b|loafer|derby|oxford|ugg" },
    { key: "boots", label: { ar: "بوتات", en: "Boots" }, categories: ["footwear"], title: "\\bboots?\\b|ugg" },
    { key: "loafers", label: { ar: "لوفر وجزم", en: "Loafers" }, categories: ["footwear"], title: "loafer|derby|oxford" },
    { key: "slides", label: { ar: "سلايدز", en: "Slides" }, categories: ["slides"], subcategory: "slides" },
    { key: "slippers", label: { ar: "سليبرز", en: "Slippers" }, categories: ["slides"], subcategory: "slippers" },
    { key: "clogs", label: { ar: "كروكس", en: "Crocs" }, categories: ["slides"], subcategory: "clogs" },
  ] },
  accessories: { label: { ar: "إكسسوارات", en: "Accessories" }, categories: ["accessories"], types: ACCESSORY.map(([key, label]) => ({ key, label, subcategory: key })) },
};

/** The section a database category belongs to. */
export const sectionOf = (category: string): Section => SECTIONS.find((s) => SECTION_DEF[s].categories.includes(category)) ?? "accessories";

/** Where a database category (and subcategory) lives in the shop, e.g. for search suggestions. */
export function sectionHref(category: string, subcategory?: string | null): string {
  const section = SECTIONS.find((s) => SECTION_DEF[s].categories.includes(category)) ?? "accessories";
  const type = SECTION_DEF[section].types.find((t) => (subcategory ? t.subcategory === subcategory : t.categories?.length === 1 && t.categories[0] === category && !t.title && !t.notTitle));
  return type ? `/shop/${section}?type=${type.key}` : `/shop/${section}`;
}

/** Old category URLs (/shop/footwear, /shop/crewnecks …) and where they live now. */
export const LEGACY_CATEGORY: Record<string, string> = {
  crewnecks: "/shop/hoodies?type=sweatshirts",
  sweatpants: "/shop/pants?type=sweatpants",
  tracksuits: "/shop/pants?type=sweatpants",
  footwear: "/shop/shoes",
  slides: "/shop/shoes?type=slides",
};
