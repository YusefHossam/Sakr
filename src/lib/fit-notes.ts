// General sizing guidance per brand (how each label usually cuts). Shown on the product page next to the sizes.
// This is a hand-written guide; it can be replaced by return/review data once there is enough of it.
type Lang = { ar: string; en: string };

const NOTES: Record<string, Lang> = {
  nike: { en: "Usually true to size. Wide feet or a roomy fit: half a size up.", ar: "غالبًا على المقاس. لو رجلك عريضة أو عايزه مريح: نص مقاس أكبر." },
  jordan: { en: "True to size, but the toe box is narrow. Wide feet: go half a size up.", ar: "على المقاس، بس الأمام ضيق. لو رجلك عريضة: نص مقاس أكبر." },
  adidas: { en: "Samba, Gazelle and Campus run narrow and small: half a size up.", ar: "سامبا وجازيل وكامبوس بيطلعوا ضيقين وصغيرين: خد نص مقاس أكبر." },
  asics: { en: "Narrow, snug fit. Half a size up if your feet are wide.", ar: "قصّة ضيقة. لو رجلك عريضة خد نص مقاس أكبر." },
  "rick-owens": { en: "Long, generous cuts. Size down one for a closer fit.", ar: "قصّات طويلة وواسعة. للقصّة القريبة من الجسم: مقاس أصغر." },
  "chrome-hearts": { en: "Boxy and true to size.", ar: "قصّة مربعة وعلى المقاس." },
  corteiz: { en: "Cut oversized. Your usual size for the intended look; size down for a fitted one.", ar: "القصّة أوفر سايز. مقاسك العادي للشكل المقصود، ومقاس أصغر للقصّة الضيقة." },
  essentials: { en: "Very oversized. If you're between sizes, size down.", ar: "أوفر سايز جدًا. لو بين مقاسين: خد الأصغر." },
  amiri: { en: "Slim cut. Size up for a relaxed fit.", ar: "قصّة سلِم. خد مقاس أكبر للراحة." },
  "purple-brand": { en: "Slim and snug. If you're between sizes, size up.", ar: "ضيق ومظبوط على الجسم. لو بين مقاسين: الأكبر." },
  "polo-ralph-lauren": { en: "Classic fit, true to size.", ar: "قصّة كلاسيك وعلى المقاس." },
  zara: { en: "Slim European cut. Between sizes: go up.", ar: "قصّة أوروبي سلِم. لو بين مقاسين: الأكبر." },
  moncler: { en: "Cut for layering. True to size; size up if you'll wear a thick knit under it.", ar: "متفصّل للتلبيس فوق حاجة. على المقاس، ومقاس أكبر لو هتلبس تحته كنزة تقيلة." },
  ami: { en: "Relaxed and true to size.", ar: "مريح وعلى المقاس." },
  rhude: { en: "Boxy and roomy. Size down for a closer fit.", ar: "مربع وواسع. مقاس أصغر لقصّة أقرب." },
  stussy: { en: "Relaxed, true to size.", ar: "مريح وعلى المقاس." },
  "the-north-face": { en: "True to size. Nuptse puffers run roomy.", ar: "على المقاس. جاكيتات Nuptse واسعة." },
  "palm-angels": { en: "Slim-leaning. Between sizes: go up.", ar: "مايل للسلِم. لو بين مقاسين: الأكبر." },
  casablanca: { en: "Relaxed and boxy, true to size.", ar: "مريح ومربع وعلى المقاس." },
  balenciaga: { en: "Very oversized. Size down one.", ar: "أوفر سايز جدًا. خد مقاس أصغر." },
  "denim-tears": { en: "Oversized. Size down for a closer fit.", ar: "أوفر سايز. مقاس أصغر لقصّة أقرب." },
  trapstar: { en: "True to size with a slightly fitted cut.", ar: "على المقاس بقصّة مظبوطة شوية." },
  "off-white": { en: "Slim cut. True to size; size up for loose.", ar: "قصّة سلِم. على المقاس، ومقاس أكبر للواسع." },
  "comme-des-garcons": { en: "Relaxed, true to size.", ar: "مريح وعلى المقاس." },
  bape: { en: "Boxy, with Japanese sizing that runs small. Size up.", ar: "مربع ومقاساته اليابانية صغيرة. خد مقاس أكبر." },
  aape: { en: "Relaxed. Japanese sizing runs small: size up.", ar: "مريح. المقاسات اليابانية صغيرة: خد الأكبر." },
  dior: { en: "European luxury sizing tends to run snug. Between sizes: go up.", ar: "مقاسات الفخامة الأوروبية بتميل للضيق. لو بين مقاسين: الأكبر." },
  gucci: { en: "European luxury sizing tends to run snug. Between sizes: go up.", ar: "مقاسات الفخامة الأوروبية بتميل للضيق. لو بين مقاسين: الأكبر." },
  "louis-vuitton": { en: "European luxury sizing tends to run snug. Between sizes: go up.", ar: "مقاسات الفخامة الأوروبية بتميل للضيق. لو بين مقاسين: الأكبر." },
  lanvin: { en: "European luxury sizing tends to run snug. Between sizes: go up.", ar: "مقاسات الفخامة الأوروبية بتميل للضيق. لو بين مقاسين: الأكبر." },
  "saint-laurent": { en: "Slim Parisian cut. Size up for a relaxed fit.", ar: "قصّة باريسية سلِم. مقاس أكبر للراحة." },
};

export function fitNote(brandSlug: string, locale: "ar" | "en"): string | null {
  return NOTES[brandSlug]?.[locale] ?? null;
}
