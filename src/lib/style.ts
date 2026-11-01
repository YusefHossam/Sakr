// What goes with what. Pure and client-safe.
//
// Rules come from three places, in this order of weight:
//  1. SAKR picks: pairings the owner stands behind (Balenciaga Track and Lanvin Curb on flared / skinny denim).
//  2. Proportion: an oversized piece wants a slimmer one; flared legs want a shoe with presence.
//  3. Taste: the same mood (Drip, Clean, Opium, Old Money) and colours that either calm or match each other.
// See docs/STYLE_GUIDE.md for where each rule comes from and how sure we are of it.
import { MOOD_KEYS, MOODS, type Mood } from "./moods";

export type StyleItem = {
  slug: string;
  title: string;
  brand: string;
  brandSlug: string;
  category: string;
  subcategory?: string | null;
  model?: string | null;
  fit?: "skinny" | "flared" | null;
  colors?: string[];
  price: number;
  image?: string | null;
};

export type Slot = "top" | "bottom" | "shoes" | "outer" | "acc" | "set";
export type Leg = "flared" | "skinny" | "baggy" | "straight" | "short";
export type Shoe = "chunky" | "low" | "high" | "boot" | "slide" | "dress" | "regular";
export type Volume = "oversized" | "regular" | "slim";

export function slotOf(category: string): Slot | null {
  if (category === "footwear" || category === "slides") return "shoes";
  if (["pants", "sweatpants", "shorts"].includes(category)) return "bottom";
  if (["hoodies", "crewnecks", "tees"].includes(category)) return "top";
  if (category === "jackets") return "outer";
  if (category === "tracksuits") return "set";
  if (category === "accessories") return "acc";
  return null;
}

const OVERSIZED = new Set(["corteiz", "essentials", "rhude", "balenciaga", "denim-tears", "cactus-jack", "rick-owens", "casablanca"]);
const SLIM = new Set(["amiri", "purple-brand", "palm-angels", "saint-laurent", "off-white"]);
const text = (p: StyleItem) => `${p.model ?? ""} ${p.title}`.toLowerCase();

export function volumeOf(p: StyleItem): Volume {
  const t = text(p);
  if (/oversized|boxy|relaxed|wide/.test(t)) return "oversized";
  if (/slim|fitted|skinny|tapered/.test(t)) return "slim";
  if (OVERSIZED.has(p.brandSlug)) return "oversized";
  if (SLIM.has(p.brandSlug)) return "slim";
  return "regular";
}

export function legOf(p: StyleItem): Leg | null {
  if (slotOf(p.category) !== "bottom") return null;
  if (p.category === "shorts") return "short";
  if (p.fit === "flared") return "flared";
  if (p.fit === "skinny") return "skinny";
  const t = text(p);
  if (/flare|bootcut/.test(t)) return "flared";
  if (/skinny/.test(t)) return "skinny";
  if (/baggy|wide|loose|cargo|barrel|balloon|relaxed|parachute/.test(t) || p.category === "sweatpants") return "baggy";
  return "straight";
}

const CHUNKY = /\b(track(\.2)?|triple s|curb|tn|air max (95|97|plus)|kayano|gel-?(1130|nyc|kahana|quantum)|nmd|ultraboost|speed|runner|sk8|defender|bumper|monster|chunky)\b/;
const LOW = /\b(samba|gazelle|campus|stan smith|superstar|handball|spezial|dunk low|air force 1|af1|jordan 1 (retro )?low|court|sb dunk|ballet)\b/;
const HIGH = /\b(high|hi|ramones|geobasket|jordan 1 retro high)\b/;

export function shoeOf(p: StyleItem): Shoe | null {
  if (p.category === "slides") return "slide";
  if (p.category !== "footwear") return null;
  const t = text(p);
  if (/\bboots?\b/.test(t)) return "boot";
  if (/\b(loafers?|derbys?|oxfords?|penny|court shoe)\b/.test(t)) return "dress";
  if (CHUNKY.test(t)) return "chunky";
  if (HIGH.test(t)) return "high";
  if (LOW.test(t)) return "low";
  return "regular";
}

const NEUTRAL = /\b(black|white|grey|gray|charcoal|beige|cream|ecru|ivory|navy|tan|khaki|stone|sand|off-white|noir|blanc|brown|ebony|silver)\b/;
const LOUD = /\b(red|orange|yellow|pink|purple|green|royal|neon|multi|rainbow|camo|blue|teal|gold|fuchsia|magenta|lime|aqua|turquoise)\b/;

function colourWords(p: StyleItem): string {
  return `${p.title} ${(p.colors ?? []).join(" ")}`.toLowerCase();
}
export const isNeutral = (p: StyleItem) => NEUTRAL.test(colourWords(p)) && !LOUD.test(colourWords(p));
const loudColour = (p: StyleItem) => colourWords(p).match(LOUD)?.[1] ?? null;

export function moodsOf(brandSlug: string): Mood[] {
  return MOOD_KEYS.filter((m) => (MOODS[m].brands as readonly string[]).includes(brandSlug));
}

export type ReasonKey = "pick-track" | "pick-curb" | "balance" | "flare-chunky" | "flare-presence" | "low-clean" | "mood" | "neutral" | "colour-match" | "clash";
export type Pair = { score: number; why: ReasonKey[] };

// Most telling first: the owner's picks, then proportion, then taste.
const REASON_RANK: ReasonKey[] = ["pick-track", "pick-curb", "flare-chunky", "flare-presence", "balance", "low-clean", "colour-match", "mood", "neutral", "clash"];
export const byRank = (a: ReasonKey, b: ReasonKey) => REASON_RANK.indexOf(a) - REASON_RANK.indexOf(b);

const isTrack = (p: StyleItem) => p.brandSlug === "balenciaga" && /\btrack\b/.test(text(p)) && p.category === "footwear";
const isCurb = (p: StyleItem) => p.brandSlug === "lanvin" && /\bcurb\b/.test(text(p));

function bottomShoe(leg: Leg, shoe: Shoe, shoeItem: StyleItem, add: (n: number, why?: ReasonKey) => void) {
  // SAKR picks first.
  if (isTrack(shoeItem) && (leg === "flared" || leg === "skinny")) add(3, "pick-track");
  if (isCurb(shoeItem) && leg === "flared") add(3, "pick-curb");
  if (isCurb(shoeItem) && leg === "straight") add(1);
  switch (shoe) {
    case "slide":
      add(leg === "short" ? 2 : -2);
      break;
    case "dress":
      if (leg === "short" || leg === "baggy") add(-2);
      else if (leg === "flared") add(-1);
      else add(1);
      break;
    case "chunky":
      if (leg === "flared") add(3, "flare-chunky");
      else if (leg === "baggy") add(2);
      else if (leg === "skinny") add(1);
      else if (leg === "straight") add(1);
      break;
    case "high":
      if (leg === "flared") add(2, "flare-presence");
      else add(1);
      break;
    case "boot":
      if (leg === "flared") add(2, "flare-presence");
      else if (leg === "short") add(-1);
      break;
    case "low":
      if (leg === "flared") add(-1);
      else add(2, "low-clean");
      break;
    default:
      add(0);
  }
}

/** How well two pieces work together. Symmetric. */
export function pairScore(a: StyleItem, b: StyleItem): Pair {
  let score = 0;
  const why: ReasonKey[] = [];
  const add = (n: number, key?: ReasonKey) => {
    score += n;
    if (key && n > 0 && !why.includes(key)) why.push(key);
  };
  const sa = slotOf(a.category);
  const sb = slotOf(b.category);
  if (!sa || !sb || a.slug === b.slug) return { score: -10, why };

  // Mood: shared tastes help, opposite tastes (Drip next to Old Money) hurt.
  const ma = moodsOf(a.brandSlug), mb = moodsOf(b.brandSlug);
  const shared = ma.filter((m) => mb.includes(m));
  if (shared.length) add(2 * shared.length, "mood");
  else if (ma.length && mb.length) add(ma.includes("drip") && mb.includes("old-money") || ma.includes("old-money") && mb.includes("drip") ? -3 : -1);

  // Colour: a neutral calms anything; two loud colours fight unless they are the same.
  const na = isNeutral(a), nb = isNeutral(b);
  const la = loudColour(a), lb = loudColour(b);
  if (na && nb) add(1, "neutral");
  else if (na || nb) add(1, "neutral");
  else if (la && lb) {
    if (la === lb) add(1, "colour-match");
    else add(-3, "clash");
  }

  // Proportion between a top and a bottom.
  const pair = (x: StyleItem, y: StyleItem, sx: Slot, sy: Slot) => (sx === "top" && sy === "bottom" ? [x, y] : sx === "bottom" && sy === "top" ? [y, x] : null);
  const tb = pair(a, b, sa, sb);
  if (tb) {
    const vol = volumeOf(tb[0]);
    const leg = legOf(tb[1]);
    if (vol === "oversized" && (leg === "skinny" || leg === "straight" || leg === "short")) add(2, "balance");
    else if (vol === "oversized" && leg === "baggy") add(-2);
    else if (vol === "slim" && (leg === "baggy" || leg === "flared")) add(1, "balance");
    else if (vol === "slim" && leg === "skinny") add(-1);
  }

  // Heavy outerwear over shorts is a weather mismatch.
  const heavy = sa === "outer" ? a : sb === "outer" ? b : null;
  const lower = sa === "bottom" ? a : sb === "bottom" ? b : null;
  if (heavy && lower && /\b(coat|trench|parka|puffer|down)\b/i.test(heavy.title) && legOf(lower) === "short") add(-4);

  // A bottom with a shoe.
  const bs = sa === "bottom" && sb === "shoes" ? [a, b] : sa === "shoes" && sb === "bottom" ? [b, a] : null;
  if (bs) {
    const leg = legOf(bs[0]);
    const shoe = shoeOf(bs[1]);
    if (leg && shoe) bottomShoe(leg, shoe, bs[1], add);
  }
  return { score, why: why.sort(byRank) };
}

// Whole outfits are built from researched recipes in outfit-formulas.ts.

export const REASON_TEXT: Record<ReasonKey, { ar: string; en: string }> = {
  "pick-track": { ar: "SAKR Pick: Balenciaga Track على السكيني والفليرد موت", en: "SAKR pick: Balenciaga Track kills on skinny and flared" },
  "pick-curb": { ar: "SAKR Pick: ألوان Lanvin Curb على الفليرد موت", en: "SAKR pick: Lanvin Curb colours on flared are a killer" },
  balance: { ar: "قطعة واسعة مع قطعة ضيقة = توازن", en: "A big piece with a slimmer one keeps the proportions right" },
  "flare-chunky": { ar: "الفليرد محتاج شوز تقيل يوازنه", en: "Flared legs need a chunky shoe to balance them" },
  "flare-presence": { ar: "الفليرد مع شوز عالي أو بوت بيطلع صح", en: "Flares work with a high-top or a boot" },
  "low-clean": { ar: "شوز واطي مع الرجل دي = شكل نضيف", en: "A low shoe keeps this leg clean" },
  mood: { ar: "نفس المود", en: "Same mood" },
  neutral: { ar: "ألوان هادية بتركّب على أي حاجة", en: "Neutral colours go with anything" },
  "colour-match": { ar: "نفس اللون", en: "Matching colour" },
  clash: { ar: "", en: "" },
};
