// Outfits built from researched formulas instead of "one of each slot". Each mood has a few proven recipes
// (what kind of top, bottom and shoe, whether a jacket belongs, which accessory, which colours), and the
// engine only fills a recipe with pieces that match it. Client-safe and pure.
//
// Sources the recipes follow (Oct 2026): drip = oversized/graphic top, relaxed denim or cargo, statement
// sneaker, one accessory; clean = tonal neutrals, matching sets, muted sneakers, almost no accessories;
// opium = near all-black, fitted top over flared or wide legs, boots or chunky soles, one piece of silver;
// old money = knit polos, quarter zips and oxford shirts with chinos or tailored trousers and loafers, in
// navy, cream, beige and brown, no loud colours or logos.

import type { Mood } from "./moods";
import { byRank, isNeutral, legOf, pairScore, shoeOf, slotOf, type ReasonKey, type StyleItem } from "./style";

type Text = { ar: string; en: string };
type Test = (p: StyleItem) => boolean;
type Palette = "free" | "neutral" | "dark" | "tonal";
type Formula = { id: string; mood: Mood; name: Text; top: Test; bottom: Test; shoes: Test; outer?: Test; acc?: string[]; palette: Palette };

export type Outfit = { items: StyleItem[]; total: number; score: number; why: ReasonKey[]; formula: Text; mood: Mood };

// ---------- What a piece is ----------

const words = (p: StyleItem) => `${p.model ?? ""} ${p.title}`.toLowerCase();
const has = (re: RegExp): Test => (p) => re.test(words(p));
const all = (...tests: Test[]): Test => (p) => tests.every((t) => t(p));
const any = (...tests: Test[]): Test => (p) => tests.some((t) => t(p));
const not = (t: Test): Test => (p) => !t(p);
const cat = (...cats: string[]): Test => (p) => cats.includes(p.category);

const isPolo = all(cat("tees", "crewnecks"), has(/\bpolo\b/));
const isShirt = all(cat("tees"), has(/\b(oxford|button|linen shirt|shirt)\b/), not(has(/t-?shirt|tee\b/)));
const isKnit = all(cat("crewnecks", "tees"), has(/knit|sweater|cardigan|quarter|half.?zip|1\/4 zip|cable|cashmere|merino|wool/));
const isTee = all(cat("tees"), not(isPolo), not(isShirt), not(has(/tank|vest|jersey|singlet|\bset\b|shorts/)));
const isPlainTee = all(isTee, not(has(/graphic|print|logo|photo|slogan|x |travis|mcdonald|playstation|homecoming|series|wrestling|tour|band|cartoon|anime/)));
const isHoodie = all(cat("hoodies"), not(has(/puffer|jacket|vest|coat|gilet|\bset\b/)));
const isSweatshirt = all(cat("crewnecks"), not(isKnit), not(has(/shirt jacket|chore|overshirt|denim shirt|jacket|vest|\bset\b/)));
const notGear = not(has(/shirt|net\b|base ?layer|thermal|long ?john|underwear|sunglass|glasses|cap\b|hat\b|bag\b|belt\b|wallet|socks/));
const isJeans = all(cat("pants"), notGear, has(/jean|denim/));
const isCargo = all(cat("pants"), has(/cargo|parachute/));
const isTrousers = all(cat("pants"), notGear, not(isJeans), not(isCargo), not(has(/sweat|jogg|track|nylon|parachute|sport|fleece|essentials|training|tricot|stripes|warm ?up|basketball|nba|dame|team|athletic|tiro|travel|soccer|football/)));
const isTailored = all(isTrousers, has(/chino|trouser|pleat|tailor|wool|linen|suit|slack|formal/));
const isSweatpants = cat("sweatpants");
const isShorts = all(cat("shorts"), not(has(/swim|basketball|mesh|running/)));
const leg = (...legs: string[]): Test => (p) => legs.includes(legOf(p) ?? "");
const isFlared = leg("flared");
const shoe = (...kinds: string[]): Test => (p) => kinds.includes(shoeOf(p) ?? "");
const isOwnerPick = (p: StyleItem) => (p.brandSlug === "balenciaga" && /\btrack\b/.test(words(p))) || (p.brandSlug === "lanvin" && /\bcurb\b/.test(words(p)));
// Never part of a fit: winter novelty boots, slippers, slides, clogs.
const fitShoe = all(cat("footwear"), not(has(/ugg|moon ?boot|snow|winter|sherpa|nuptse|traction|puffer|slipper|mule|clog|crocs|sandal|slide|tasman|tazz|kids|toddler|gore-?tex|trail|hiking|golf|cleat|football|soccer|running|wave|velvet|slip-on|trouser|pant|jean|short|shirt|hoodie/)));
// Shoes by recipe.
const OPIUM_BRANDS = new Set(["rick-owens", "balenciaga", "maison-margiela", "alexander-mcqueen", "saint-laurent", "lanvin", "amiri", "chrome-hearts", "dior"]);
const opiumShoe = any(isOwnerPick, shoe("boot"), (p) => OPIUM_BRANDS.has(p.brandSlug), has(/tabi|ramones|geobasket|dr.? ?martens|combat|platform|derby/));
const cleanShoe = all(not(isOwnerPick), not(has(/off-white|out of office|murakami|travis|cactus|sb dunk|x /)), shoe("low", "regular"));
const quietLeather = all(shoe("low"), has(/stan smith|common projects|achilles|court|leather/), not(has(/dunk|jordan|air max|force|kobe|tartan|velvet|samba|gazelle|superstar|handball|campus|spezial|x /)));
const oldMoneyShoe = any(shoe("dress"), quietLeather);
const oldMoneyTop = (t: Test) => all(t, not(has(/hood|track|zip-up|full zip|graphic|print|logo|monogram|sport/)));
const jacket = (re: RegExp): Test => all(cat("jackets"), has(re));

const DARK = /\b(black|noir|charcoal|anthracite|onyx|ebony|jet|washed black|dark grey|dark gray|graphite|smoke|grey|gray)\b/;
const dark = (p: StyleItem) => DARK.test(`${p.title} ${(p.colors ?? []).join(" ")}`.toLowerCase()) && !/\b(white|cream|beige|pink|red|yellow|blue|green|orange|gold)\b/.test(p.title.toLowerCase());
const FAMILY: [string, RegExp][] = [
  ["black", /black|noir|onyx|ebony|jet/],
  ["grey", /grey|gray|charcoal|heather|ash|smoke|graphite|silver/],
  ["white", /white|blanc|ivory|ecru|off-white/],
  ["cream", /cream|beige|sand|stone|oat|bone|khaki|tan|camel|taupe/],
  ["brown", /brown|chocolate|mocha|coffee|chestnut|cognac/],
  ["navy", /navy|midnight|indigo/],
  ["green", /green|olive|khaki green|sage|forest/],
  ["blue", /blue|denim/],
  ["red", /red|burgundy|maroon|wine/],
];
const family = (p: StyleItem) => {
  const t = `${p.title} ${(p.colors ?? []).join(" ")}`.toLowerCase();
  return FAMILY.find(([, re]) => re.test(t))?.[0] ?? null;
};
const LOUD = /\b(red|orange|yellow|pink|purple|neon|lime|fuchsia|magenta|turquoise|teal|multi\w*|rainbow|camo|tie-?dye|floral|leopard|tiger)\b/;
const loud = (p: StyleItem) => LOUD.test(`${p.title} ${(p.colors ?? []).join(" ")}`.toLowerCase());

// ---------- The recipes ----------

const FORMULAS: Formula[] = [
  // Drip
  { id: "drip-denim", mood: "drip", name: { ar: "تيشيرت جرافيك + جينز واسع + كوتشي تقيل", en: "Graphic tee + relaxed denim + statement sneaker" },
    top: isTee, bottom: all(isJeans, leg("baggy", "straight", "flared")), shoes: all(fitShoe, any(shoe("chunky", "high", "regular"), isOwnerPick)), acc: ["chains", "headwear", "watches"], palette: "free" },
  { id: "drip-cargo", mood: "drip", name: { ar: "هودي + كارجو أو جينز واسع + كوتشي تقيل", en: "Hoodie + cargo or baggy denim + chunky sneaker" },
    top: isHoodie, bottom: any(isCargo, all(isJeans, leg("baggy"))), shoes: all(fitShoe, any(shoe("chunky", "high"), isOwnerPick)), acc: ["headwear", "chains", "watches"], palette: "free" },
  { id: "drip-layer", mood: "drip", name: { ar: "تيشيرت + جاكيت فارسيتي أو جلد + جينز + كوتشي", en: "Tee + varsity or leather jacket + denim + sneaker" },
    top: isTee, bottom: all(any(isJeans, isCargo), leg("baggy", "straight", "flared")), shoes: all(fitShoe, any(shoe("chunky", "high", "low", "regular"), isOwnerPick)),
    outer: jacket(/varsity|bomber|leather|biker|denim|trucker|work jacket|coach/), palette: "free" },
  { id: "drip-summer", mood: "drip", name: { ar: "تيشيرت + شورت + كوتشي (صيفي)", en: "Tee + shorts + sneaker (summer)" },
    top: isTee, bottom: isShorts, shoes: all(fitShoe, shoe("low", "high", "regular", "chunky")), acc: ["headwear", "sunglasses", "chains"], palette: "free" },

  // Clean
  { id: "clean-set", mood: "clean", name: { ar: "طقم هودي وسويت بانتس بنفس اللون + كوتشي هادي", en: "Tonal hoodie and sweatpants set + muted sneaker" },
    top: all(any(isHoodie, isSweatshirt), not(has(/x |graphic|print|nba|team/))), bottom: all(isSweatpants, not(has(/\bset\b|hoodie|nba|warriors|lakers|team|warm ?up|tiro|travel|track/))), shoes: all(fitShoe, cleanShoe), acc: ["headwear", "watches"], palette: "tonal" },
  { id: "clean-tee", mood: "clean", name: { ar: "تيشيرت سادة + بنطلون مستقيم + كوتشي واطي", en: "Plain tee + straight trousers + low sneaker" },
    top: isPlainTee, bottom: all(any(isTrousers, all(isJeans, leg("straight"))), not(has(/big|baggy|loose|carpenter|wide|beach/))), shoes: all(fitShoe, cleanShoe), acc: ["watches"], palette: "neutral" },
  { id: "clean-crew", mood: "clean", name: { ar: "سويتشيرت + جينز مستقيم + كوتشي واطي", en: "Crewneck + straight jeans + low sneaker" },
    top: all(isSweatshirt, not(has(/x |graphic|print/))), bottom: all(isJeans, leg("straight"), not(has(/big|baggy|carpenter|loose/))), shoes: all(fitShoe, cleanShoe), palette: "neutral" },

  // Opium
  { id: "opium-flare", mood: "opium", name: { ar: "توب أسود ضيق + فلير + بوت أو شوز تقيل", en: "Fitted black top + flares + boots or chunky soles" },
    top: any(isTee, isSweatshirt), bottom: any(isFlared, all(isJeans, leg("straight", "skinny"))), shoes: all(fitShoe, opiumShoe), acc: ["rings", "chains"], palette: "dark" },
  { id: "opium-leather", mood: "opium", name: { ar: "تيشيرت أسود + جاكيت جلد + فلير + بوت", en: "Black tee + leather jacket + flares + boots" },
    top: isTee, bottom: any(isFlared, isJeans), shoes: all(fitShoe, opiumShoe), outer: jacket(/leather|biker|suede/), palette: "dark" },
  { id: "opium-hoodie", mood: "opium", name: { ar: "هودي أسود + فلير + Curb أو Track", en: "Black hoodie + flares + Curb or Track" },
    top: isHoodie, bottom: any(isFlared, all(isJeans, leg("straight", "skinny"))), shoes: all(fitShoe, opiumShoe), acc: ["rings"], palette: "dark" },

  // Old money
  { id: "om-polo", mood: "old-money", name: { ar: "بولو تريكو + تشينو أو بنطلون قماش + لوفر", en: "Knit polo + chinos or tailored trousers + loafers" },
    top: oldMoneyTop(isPolo), bottom: any(isTailored, isTrousers), shoes: all(fitShoe, oldMoneyShoe), acc: ["watches", "belts"], palette: "neutral" },
  { id: "om-knit", mood: "old-money", name: { ar: "كوارتر زيب أو كنزة + بنطلون قماش + لوفر", en: "Quarter-zip or knit + trousers + loafers" },
    top: oldMoneyTop(isKnit), bottom: any(isTailored, isTrousers, all(isJeans, leg("straight"), dark)), shoes: all(fitShoe, oldMoneyShoe), acc: ["watches"], palette: "neutral" },
  { id: "om-oxford", mood: "old-money", name: { ar: "قميص أكسفورد + تشينو + لوفر", en: "Oxford shirt + chinos + loafers" },
    top: oldMoneyTop(isShirt), bottom: any(isTailored, isTrousers), shoes: all(fitShoe, oldMoneyShoe), acc: ["watches", "belts"], palette: "neutral" },
  { id: "om-leather", mood: "old-money", name: { ar: "قميص أو كنزة + جاكيت جلد أو شامواه + بنطلون قماش + جزمة جلد", en: "Shirt or knit + leather or suede jacket + trousers + leather shoes" },
    top: oldMoneyTop(any(isShirt, isKnit, isPolo)), bottom: any(isTailored, isTrousers), shoes: all(fitShoe, oldMoneyShoe),
    outer: all(jacket(/leather|suede|shearling|harrington|car coat|blouson/), not(has(/biker|studded|varsity|puffer|graphic|logo|faux fur/))), acc: ["watches", "belts", "scarves"], palette: "neutral" },

  // Streetwear
  { id: "street-hoodie", mood: "streetwear", name: { ar: "هودي + بنطلون باجي + كوتشي تقيل", en: "Hoodie + baggy pants + big sneaker" },
    top: isHoodie, bottom: any(isCargo, all(isJeans, leg("baggy")), all(isSweatpants, not(has(/slim|skinny|taper|tech fleece|jogger|track/)))), shoes: all(fitShoe, shoe("chunky", "high", "regular")), acc: ["headwear"], palette: "free" },
  { id: "street-zip", mood: "streetwear", name: { ar: "زيب هودي + جينز باجي + جوردن أو دانك", en: "Zip hoodie + baggy jeans + Jordans or Dunks" },
    top: all(isHoodie, has(/zip/)), bottom: all(isJeans, leg("baggy"), not(has(/slim|skinny|taper/))), shoes: all(fitShoe, has(/jordan|dunk|air force|af1|samba|campus|990|550|9060/)), acc: ["headwear", "chains", "watches"], palette: "free" },
  { id: "street-tee", mood: "streetwear", name: { ar: "تيشيرت أوفرسايز + كارجو + كوتشي", en: "Oversized tee + cargo + sneaker" },
    top: isTee, bottom: any(isCargo, all(isJeans, leg("baggy"))), shoes: all(fitShoe, shoe("chunky", "high", "low", "regular")), acc: ["headwear", "chains", "watches"], palette: "free" },

  // Casual
  { id: "casual-tee", mood: "casual", name: { ar: "تيشيرت أو بولو + جينز مستقيم + كوتشي نضيف", en: "Tee or polo + straight jeans + clean sneaker" },
    top: any(isPlainTee, isPolo), bottom: all(isJeans, leg("straight"), not(has(/big|baggy|loose|carpenter|wide/))), shoes: all(fitShoe, shoe("low", "regular")), acc: ["watches", "headwear"], palette: "free" },
  { id: "casual-shirt", mood: "casual", name: { ar: "قميص + تشينو + كوتشي أبيض", en: "Shirt + chinos + white sneaker" },
    top: isShirt, bottom: any(isTailored, isTrousers), shoes: all(fitShoe, shoe("low"), has(/white|blanc|cream/)), acc: ["watches"], palette: "neutral" },
  { id: "casual-layer", mood: "casual", name: { ar: "تيشيرت + أوفر شيرت أو جاكيت جينز + جينز + كوتشي", en: "Tee + overshirt or denim jacket + jeans + sneaker" },
    top: isPlainTee, bottom: all(isJeans, leg("straight"), not(has(/big|baggy|carpenter|loose/))), shoes: all(fitShoe, shoe("low", "regular")),
    outer: jacket(/overshirt|shacket|denim|trucker|chore|harrington|coach|field/), palette: "free" },
];

// ---------- Filling a recipe ----------

const JUNK = /\b(table|chair|helinox|mug|sticker|poster|lighter|keychain|towel|blanket|pillow|skate ?board|deck|net|cooler|umbrella|candle|incense|book)\b/i;
const PACK = /\b(\d ?pk|\d-?pack|pack of|multipack|bundle)\b/i;

function paletteOk(palette: Palette, picked: StyleItem[], p: StyleItem): boolean {
  const slot = slotOf(p.category);
  switch (palette) {
    case "neutral":
      return slot === "acc" || (!loud(p) && isNeutral(p)) || (!loud(p) && family(p) !== null && ["black", "grey", "white", "cream", "brown", "navy", "green"].includes(family(p)!));
    case "dark":
      // Silver jewellery and the owner's Curb/Track colourways are the only light allowed in an opium fit.
      return slot === "acc" || isOwnerPick(p) || dark(p);
    case "tonal": {
      if (slot === "acc") return true;
      if (loud(p)) return false;
      const other = picked.find((x) => (slot === "top" ? slotOf(x.category) === "bottom" : slot === "bottom" ? slotOf(x.category) === "top" : false));
      if (slot === "top" || slot === "bottom") {
        const fam = family(p);
        if (!fam) return false;
        return !other || family(other) === fam;
      }
      return isNeutral(p) || !loud(p);
    }
    default: {
      // Free: at most one loud colour in the whole fit.
      if (!loud(p)) return true;
      return !picked.some(loud);
    }
  }
}

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
};

type Opts = { count: number; seed: string; budget?: number | null; mood?: Mood | null; used?: Set<string>; /** Extra pull toward some pieces (e.g. black when the customer asked for black). */ bias?: (p: StyleItem) => number };

/** Whole fits that follow the mood's recipes. Each fit has 3 to 5 pieces, never two of the same brand more than twice. */
export function buildOutfits(pool: StyleItem[], { count, seed, budget = null, mood = null, used = new Set(), bias = () => 0 }: Opts): Outfit[] {
  const formulas = FORMULAS.filter((f) => !mood || f.mood === mood);
  // Not clothing at all (tables, nets, stickers that sources file under tees or pants) never enters a fit.
  const usable = pool.filter((p) => !PACK.test(p.title) && !JUNK.test(p.title));
  const outfits: Outfit[] = [];
  const start = Math.floor(hash(seed) * formulas.length);

  for (let n = 0, tries = 0; outfits.length < count && tries < count * formulas.length * 2; tries++, n++) {
    const f = formulas[(start + n) % formulas.length];
    const picked: StyleItem[] = [];
    const spent = () => picked.reduce((s, p) => s + p.price, 0);
    const brandCount = (b: string) => picked.filter((x) => x.brandSlug === b).length;
    const choose = (test: Test, slot: string, fit: (p: StyleItem) => number, share: number) => {
      const cap = budget ? (budget - spent()) * share : Infinity;
      const choices = usable.filter((p) => test(p) && !used.has(p.slug) && p.price <= cap && brandCount(p.brandSlug) < 2 && paletteOk(f.palette, picked, p));
      if (!choices.length) return null;
      const best = choices.map((p) => ({ p, v: fit(p) + bias(p) + hash(`${seed}:${n}:${slot}:${p.slug}`) * 2.5 })).sort((a, b) => b.v - a.v)[0].p;
      picked.push(best);
      return best;
    };

    // Shoes first (they decide the leg), then the bottom that suits them, then the top, then extras.
    const shoes = choose(f.shoes, "shoes", (p) => (isOwnerPick(p) ? 1 : 0) + (f.mood === "old-money" && shoeOf(p) === "dress" ? 4 : 0) + (f.mood === "opium" && shoeOf(p) === "boot" ? 1 : 0), 0.45);
    if (!shoes) continue;
    const bottom = choose(f.bottom, "bottom", (p) => pairScore(p, shoes).score, 0.5);
    if (!bottom || pairScore(bottom, shoes).score < 0) {
      for (const p of picked) used.delete(p.slug);
      continue;
    }
    const top = choose(f.top, "top", (p) => pairScore(p, bottom).score + pairScore(p, shoes).score * 0.5, 0.8);
    if (!top) continue;
    if (f.outer && !choose(f.outer, "outer", (p) => pairScore(p, top).score + pairScore(p, bottom).score, 1)) continue;
    // One accessory, and only in about half the fits: restraint is part of every recipe.
    // Old money wears a plain dress watch, not a sports or novelty one; boxes and cases are never worn.
    const wearable = (p: StyleItem) => !/\b(box|case|stand|pouch|strap only)\b/i.test(p.title) && ((f.mood !== "old-money" && f.mood !== "clean" && f.mood !== "casual") || (!/g-?shock|camo|digital|off-white|proto|smart|kids|x |iced|diamond|bust|bling|baguette|arctic/i.test(p.title) && !["king-ice", "stussy", "supreme", "bape", "aape", "sp5der", "godspeed-new-york", "chrome-hearts", "off-white", "pleasures"].includes(p.brandSlug) && !/studded|hawaiian|8 ball|pink|neon|peanuts|snoopy|mickey|disney|marvel|cartoon|simpsons/i.test(p.title) && !["adidas", "nike", "jordan", "puma"].includes(p.brandSlug)));
    if (f.acc && hash(`${seed}:${n}:acc`) < 0.55) choose((p) => p.category === "accessories" && f.acc!.includes(p.subcategory ?? "") && wearable(p), "acc", (p) => pairScore(p, top).score, 1);

    let score = 0;
    const why: ReasonKey[] = [];
    for (let i = 0; i < picked.length; i++)
      for (let j = i + 1; j < picked.length; j++) {
        const r = pairScore(picked[i], picked[j]);
        score += r.score;
        for (const k of r.why) if (!why.includes(k) && k !== "mood") why.push(k);
      }
    for (const p of picked) used.add(p.slug);
    outfits.push({ items: picked, total: spent(), score, why: why.sort(byRank), formula: f.name, mood: f.mood });
  }
  return outfits;
}

/** Recipe names, for showing which formula a fit follows. */
export const FORMULA_COUNT = FORMULAS.length;
