// Client-safe. A mood is a taste: it picks brands (and which kinds of pieces) and tints the whole store.
export const MOODS = {
  gang: {
    ar: "جانج",
    en: "Gang",
    tagline: { ar: "ستريت تقيل. اللبس اللي بيمشي قدامك.", en: "Heavy street. The kind that walks in before you." },
    brands: ["corteiz", "trapstar", "chrome-hearts", "denim-tears", "rhude", "heron-preston", "palm-angels", "cactus-jack", "bape", "sprayground"],
    exclude: [] as string[],
  },
  clean: {
    ar: "كلين",
    en: "Clean",
    tagline: { ar: "ألوان هادية وقصّات نضيفة. من غير دوشة.", en: "Quiet colours, clean cuts. No noise." },
    brands: ["essentials", "asics", "comme-des-garcons", "nike", "adidas", "ami", "stussy", "the-north-face", "jordan"],
    exclude: [],
  },
  opium: {
    ar: "أوبيوم",
    en: "Opium",
    tagline: { ar: "أسود، طويل، غامض. دارك من غير اعتذار.", en: "Black, long, mysterious. Dark, no apology." },
    brands: ["rick-owens", "chrome-hearts", "balenciaga", "saint-laurent", "maison-margiela", "amiri", "alexander-mcqueen", "purple-brand", "lanvin"],
    exclude: [],
  },
  "old-money": {
    ar: "أولد موني",
    en: "Old Money",
    tagline: { ar: "فخامة هادية. بولو وكنزات وجاكيتات تتقعد.", en: "Quiet luxury. Polos, knits and jackets that sit right." },
    brands: ["polo-ralph-lauren", "zara", "moncler", "ami", "gucci", "dior", "louis-vuitton", "lanvin", "casablanca"],
    // No hoodies, joggers or slides in this look.
    exclude: ["hoodies", "sweatpants", "tracksuits", "slides"],
  },
} as const;

export type Mood = keyof typeof MOODS;
export const MOOD_KEYS = Object.keys(MOODS) as Mood[];
export const MOOD_STORAGE_KEY = "sakr_mood";
export const isMood = (v: unknown): v is Mood => typeof v === "string" && v in MOODS;
