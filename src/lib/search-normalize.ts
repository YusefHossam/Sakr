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

const FOLDED = new Map(Object.entries(WORDS).map(([k, v]) => [fold(k), v]));

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
