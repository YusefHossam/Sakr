// Turns what people actually type ("7oody", "كوتشي نايك", "polo shirt") into the English words the catalog is
// indexed with. Pure and client-safe; shared by the shop search and the chat assistant.

const WORDS: Record<string, string> = {
  // clothes
  hoodie: "hoodie", hoody: "hoodie", hodi: "hoodie", hoodi: "hoodie", "7oody": "hoodie", "7odi": "hoodie", "7oodi": "hoodie", هودي: "hoodie", هوديز: "hoodie", هودى: "hoodie",
  jacket: "jacket", jaket: "jacket", gaket: "jacket", jakit: "jacket", جاكيت: "jacket", جاكت: "jacket", جواكت: "jacket", puffer: "puffer", بافر: "puffer",
  tshirt: "t-shirt", "t-shirt": "t-shirt", tisherts: "t-shirt", tishert: "t-shirt", tisheart: "t-shirt", tee: "tee", تيشيرت: "t-shirt", تيشرت: "t-shirt", تيشيرتات: "t-shirt",
  polo: "polo", بولو: "polo",
  pants: "pants", pantalon: "pants", bantalon: "pants", bantaloon: "pants", بنطلون: "pants", بنطال: "pants", بناطيل: "pants", jeans: "jeans", جينز: "jeans", denim: "denim", دنيم: "denim",
  shorts: "shorts", short: "shorts", شورت: "shorts", شورتات: "shorts",
  sweatpants: "sweatpants", jogger: "jogger", joggers: "jogger", سويت: "sweatpants", بانتس: "pants", جوجر: "jogger",
  sweater: "sweater", sweatshirt: "sweatshirt", كرونيك: "crewneck", crewneck: "crewneck", كنزة: "sweater", سويتر: "sweater",
  tracksuit: "tracksuit", تراكسوت: "tracksuit", طقم: "tracksuit",
  // shoes
  sneakers: "sneakers", sneaker: "sneakers", koshi: "sneakers", kooshy: "sneakers", kotshi: "sneakers", kotchi: "sneakers", coutchi: "sneakers", cotshy: "sneakers", كوتشي: "sneakers", كوتشى: "sneakers", كوتش: "sneakers", حذاء: "shoes", جزمة: "shoes", شوز: "shoes", shoes: "shoes", shoe: "shoes", boots: "boots", بوت: "boots", بوتس: "boots",
  slide: "slide", slides: "slide", slipper: "slide", slippers: "slide", sandal: "sandal", سلايد: "slide", سلايدز: "slide", شبشب: "slide", صندل: "sandal",
  // accessories
  cap: "cap", kap: "cap", kab: "cap", كاب: "cap", كابات: "cap", hat: "hat", beanie: "beanie", طاقية: "beanie", قبعة: "hat",
  sunglasses: "sunglasses", glasses: "sunglasses", nadara: "sunglasses", nathara: "sunglasses", نضارة: "sunglasses", نضارات: "sunglasses", نظارة: "sunglasses",
  bag: "bag", shanta: "bag", شنطة: "bag", شنط: "bag", backpack: "backpack", wallet: "wallet", محفظة: "wallet",
  chain: "chain", سلسلة: "chain", سلاسل: "chain", bracelet: "bracelet", بريسلت: "bracelet", ring: "ring", خاتم: "ring", belt: "belt", حزام: "belt", socks: "socks", شراب: "socks", شرابات: "socks", boxer: "boxer", بوكسر: "boxer",
  // brands
  nike: "nike", نايك: "nike", نايكي: "nike", adidas: "adidas", اديداس: "adidas", أديداس: "adidas", ادداس: "adidas", zara: "zara", زارا: "zara",
  jordan: "jordan", جوردن: "jordan", "chrome hearts": "chrome hearts", كروم: "chrome", هارتس: "hearts", rick: "rick", ريك: "rick", اوينز: "owens", أوينز: "owens",
  balenciaga: "balenciaga", بالنسياجا: "balenciaga", gucci: "gucci", جوتشي: "gucci", غوتشي: "gucci", dior: "dior", ديور: "dior", louis: "louis", لويس: "louis", فيتون: "vuitton",
  moncler: "moncler", مونكلر: "moncler", موكلير: "moncler", rhude: "rhude", رود: "rhude", stussy: "stussy", ستوسي: "stussy", ستاسي: "stussy", north: "north", نورث: "north", face: "face", فيس: "face",
  palm: "palm", بالم: "palm", angels: "angels", انجلز: "angels", أنجلز: "angels", casablanca: "casablanca", كازابلانكا: "casablanca", كازا: "casablanca",
  asics: "asics", اسيكس: "asics", أسيكس: "asics", off: "off", اوف: "off", وايت: "white", trapstar: "trapstar", ترابستار: "trapstar", corteiz: "corteiz", كورتيز: "corteiz",
  amiri: "amiri", اميري: "amiri", أميري: "amiri", bape: "bape", بيب: "bape", essentials: "essentials", اسنشيال: "essentials", اسينشيال: "essentials", ami: "ami", اي: "", marcelo: "marcelo", مارسيلو: "marcelo", burlon: "burlon",
  // colours
  black: "black", اسود: "black", أسود: "black", aswad: "black", white: "white", ابيض: "white", أبيض: "white", abyad: "white", red: "red", احمر: "red", أحمر: "red", ahmar: "red", blue: "blue", ازرق: "blue", أزرق: "blue", azra2: "blue", green: "green", اخضر: "green", أخضر: "green", grey: "grey", gray: "grey", رمادي: "grey", brown: "brown", بني: "brown", pink: "pink", وردي: "pink",
};

// More ways people actually type: Arabic spellings, Franco-Arab (Arabic in Latin letters) and common misspellings.
const EXTRA: Record<string, string> = {
  // brands
  هارت: "hearts", هارتز: "hearts", hartz: "hearts", harts: "hearts", hearts: "hearts", kroom: "chrome", krom: "chrome", chrom: "chrome", كروم: "chrome", كرووم: "chrome",
  كورتيس: "corteiz", ترابستر: "trapstar", بالنسياغا: "balenciaga", بلنسياجا: "balenciaga", بالانسياجا: "balenciaga", لانفان: "lanvin", لانفين: "lanvin", قوتشي: "gucci", جوتشى: "gucci",
  سوبريم: "supreme", سبريم: "supreme", اوف: "off", ستيوسي: "stussy", ستوسى: "stussy", اسيكس: "asics", بوما: "puma", بيوما: "puma", ريبوك: "reebok", لاكوست: "lacoste", لاكوستي: "lacoste",
  اوكلي: "oakley", اوكلى: "oakley", كاسيو: "casio", سواتش: "swatch", تيمكس: "timex", بلايبوي: "playboy", ديزل: "diesel", جويارد: "goyard", ماركيلا: "margiela", مارجيلا: "margiela",
  kith: "kith", كيث: "kith", فيليب: "philipp", فليب: "philipp", philip: "philipp", philipp: "philipp", بلين: "plein", plein: "plein", دسكوارد: "dsquared2", ديسكويرد: "dsquared2", دسكويرد: "dsquared2", dsquared: "dsquared2", d2: "dsquared2", بالمان: "balmain", بلمان: "balmain", فيرزاتشي: "versace", فرزاتشي: "versace", فيرساتشي: "versace", فرساتشي: "versace", lv: "louis vuitton", ميدوسا: "medusa", كيبول: "keepall", keepall: "keepall", bape: "bape", بيب: "bape", arcteryx: "arcteryx", ارك: "arcteryx", سبايدر: "sp5der", spider: "sp5der", psd: "psd", بي: "", اس: "", دي: "",
  // kinds
  nadarat: "sunglasses", nadarah: "sunglasses", nazarat: "sunglasses", nadara: "sunglasses", نظارات: "sunglasses", نضاره: "sunglasses", "نظاره": "sunglasses", sunglass: "sunglasses", shades: "sunglasses", عويينات: "sunglasses",
  watch: "watch", watches: "watch", sa3a: "watch", saa3a: "watch", sa3at: "watch", saa3at: "watch", ساعة: "watch", ساعه: "watch", ساعات: "watch",
  salsala: "chain", selsela: "chain", salasel: "chain", سلسله: "chain", chains: "chain", necklace: "chain", قلادة: "chain", عقد: "chain",
  khatem: "ring", rings: "ring", خواتم: "ring", خاتم: "ring", aswera: "bracelet", asawer: "bracelet", bracelets: "bracelet", اسورة: "bracelet", اسوره: "bracelet", اساور: "bracelet", سوار: "bracelet",
  slipper: "slipper", slippers: "slipper", shebsheb: "slide", shabsheb: "slide", شباشب: "slide", سلبر: "slipper", سليبر: "slipper", سليبرز: "slipper", اسلبرات: "slipper", اسليبرات: "slipper", sliper: "slipper", slipers: "slipper", clog: "crocs", clogs: "crocs", crocs: "crocs", croc: "crocs", كروكس: "crocs", كروكز: "crocs",
  boxers: "boxer", بوكسرات: "boxer", بوكسرز: "boxer", boxr: "boxer", underwear: "boxer", brief: "boxer", سليب: "boxer", ملابس: "", داخلية: "boxer",
  scarf: "scarf", scarves: "scarf", shawl: "scarf", stole: "scarf", سكارف: "scarf", سكارفات: "scarf", اسكارف: "scarf", اسكرف: "scarf", اسكرفات: "scarf", اسكارفات: "scarf", شال: "scarf", كوفية: "scarf", وشاح: "scarf", "iced": "iced", ايسد: "iced", متلجة: "iced", مرصعة: "iced", الماظ: "iced", ألماظ: "iced", diamond: "iced",
  mask: "mask", masks: "mask", ماسك: "mask", ماسكات: "mask", قناع: "mask",
  perfume: "perfume", perfumes: "perfume", fragrance: "perfume", cologne: "perfume", "3etr": "perfume", atr: "perfume", عطر: "perfume", برفان: "perfume", برفيوم: "perfume", عطور: "perfume", برفانات: "perfume",
  caps: "cap", kabat: "cap", tar2a: "beanie", taqia: "beanie", beanies: "beanie", hats: "hat", شنطه: "bag", shonat: "bag", bags: "bag", حقيبة: "bag", backpacks: "backpack", belts: "belt", hezam: "belt", احزمة: "belt", احزمه: "belt",
  gazma: "shoes", gezma: "shoes", جزم: "shoes", koshy: "sneakers", kotsh: "sneakers", كوتشيات: "sneakers", trainers: "sneakers", sneakerz: "sneakers",
  hoodies: "hoodie", jackets: "jacket", pantalons: "pants", pant: "pants", trousers: "pants", tshirts: "t-shirt", shirts: "t-shirt", shirt: "t-shirt", تيشرتات: "t-shirt", قميص: "t-shirt", cargo: "cargo", كارجو: "cargo", flare: "flared", flared: "flared", فلير: "flared", skinny: "skinny", سكيني: "skinny", baggy: "baggy", باجي: "baggy", wide: "baggy",
  // colours
  asfar: "yellow", اصفر: "yellow", أصفر: "yellow", yellow: "yellow", akhdar: "green", akhdr: "green", rommadi: "grey", ramady: "grey", bonny: "brown", bunni: "brown", kohly: "navy", كحلي: "navy", navy: "navy", beige: "beige", بيج: "beige", orange: "orange", برتقالي: "orange", purple: "purple", بنفسجي: "purple", banafsegy: "purple", cream: "cream", كريمي: "cream", offwhite: "off white", silver: "silver", فضي: "silver", gold: "gold", دهبي: "gold", ذهبي: "gold", dahaby: "gold", fedy: "silver",
};

const ARABIC_MARKS = /[ً-ٰٟـ]/g;

/** Lowercase, strip Arabic diacritics and unify letter variants so "أسود" and "اسود" compare equal. */
function fold(token: string): string {
  return token
    .toLowerCase()
    .replace(ARABIC_MARKS, "")
    .replace(/[إأآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/^[^\p{L}\p{N}-]+|[^\p{L}\p{N}-]+$/gu, "");
}

const FOLDED = new Map(Object.entries({ ...WORDS, ...EXTRA }).map(([k, v]) => [fold(k), v]));
const VOCAB = [...FOLDED.keys()].filter((k) => k.length >= 4);

function distance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length];
}

/** Canonical English word for one typed word, forgiving a typo or two ("hodie", "sunglases", "كروم"). Null when unknown. */
export function canonicalWord(raw: string): string | null {
  const token = fold(raw);
  if (!token) return null;
  const exact = FOLDED.get(token);
  if (exact !== undefined) return exact || null;
  if (token.length < 4) return token;
  const allow = token.length >= 8 ? 2 : 1;
  let best: string | null = null;
  let bestD = allow + 1;
  for (const k of VOCAB) {
    const d = distance(token, k, allow);
    if (d < bestD) {
      bestD = d;
      best = k;
    }
  }
  if (best) return FOLDED.get(best) || null;
  return token;
}

/** Every word of a query as canonical English, with typos forgiven. */
export function canonicalTokens(q: string): string[] {
  const out: string[] = [];
  for (const raw of q.split(/\s+/)) {
    const c = canonicalWord(raw);
    if (c) out.push(...c.split(" "));
  }
  return [...new Set(out)];
}

/** English search terms for a free-text query. Unknown words pass through untouched. */
export function normalizeQuery(q: string): string {
  const out: string[] = [];
  for (const raw of q.split(/\s+/)) {
    const token = fold(raw);
    if (!token) continue;
    const hit = FOLDED.get(token);
    if (hit === undefined) out.push(token);
    else if (hit) out.push(hit);
  }
  return [...new Set(out)].join(" ");
}

/** The catalog words a query mentions (kinds, brands, colours). Empty when it is a general question. */
export function matchedTerms(q: string): string[] {
  const out: string[] = [];
  for (const raw of q.split(/\s+/)) {
    const hit = FOLDED.get(fold(raw));
    if (hit) out.push(hit);
  }
  return [...new Set(out)];
}
