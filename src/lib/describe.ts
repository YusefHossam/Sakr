// Product descriptions in Arabic and English, written from each product's own data (brand, kind, model, colours,
// sizes and whatever the source page said). Deterministic: the same product always gets the same text.
// Pure and client-safe so seeding scripts can use it too.

type Lang = { ar: string; en: string };

const BRANDS: Record<string, Lang> = {
  "chrome-hearts": { en: "the Los Angeles house known for sterling silver, gothic crosses and hand-finished detail", ar: "الدار الأمريكية من لوس أنجلوس المشهورة بالفضة الاسترلينية والصلبان القوطية والتشطيب اليدوي" },
  corteiz: { en: "the London street label behind the Rules the World crew and its hard-to-get drops", ar: "براند الستريت اللندني صاحب كرو Rules the World ودروباته اللي صعب تلاقيها" },
  trapstar: { en: "the London label that grew out of the city's music scene", ar: "براند لندني طلع من قلب مشهد الموسيقى في المدينة" },
  essentials: { en: "Fear of God's Essentials line: elevated basics in soft, oversized cuts", ar: "خط Essentials من Fear of God: بيسكس راقية بقصّات واسعة وخامات ناعمة" },
  "denim-tears": { en: "Tremaine Emory's label, which tells Black history through denim and prints", ar: "براند تريمين إيموري اللي بيحكي التاريخ الأسود من خلال الدنيم والطباعة" },
  "comme-des-garcons": { en: "Rei Kawakubo's Tokyo and Paris label, famous for rule-breaking silhouettes", ar: "براند ري كواكوبو بين طوكيو وباريس، مشهور بالقصّات اللي بتكسر القواعد" },
  "rick-owens": { en: "the Los Angeles-born, Paris-based label of long, dark, draped shapes", ar: "براند ريك أوينز من لوس أنجلوس لباريس: خطوط طويلة ومعتمة ومنسدلة" },
  amiri: { en: "Mike Amiri's Los Angeles label, mixing rock-and-roll and luxury tailoring", ar: "براند مايك أميري من لوس أنجلوس، بيجمع الروك والتفصيل الفاخر" },
  moncler: { en: "the Alpine outerwear house that made the puffer a luxury piece", ar: "دار الجاكيتات الجبلية اللي حوّلت البافر لقطعة فخمة" },
  ami: { en: "AMI Paris, Alexandre Mattiussi's easy-going Parisian wardrobe", ar: "AMI باريس، دولاب أليكساندر ماتيوسي الباريسي المريح" },
  rhude: { en: "Rhuigi Villaseñor's Los Angeles label of vintage-minded streetwear", ar: "براند رويجي فيلاسينيور من لوس أنجلوس، ستريت بروح الفينتج" },
  "marcelo-burlon": { en: "Marcelo Burlon County of Milan, known for its wings graphics", ar: "Marcelo Burlon County of Milan المشهور بجرافيك الأجنحة" },
  "polo-ralph-lauren": { en: "Polo Ralph Lauren, the classic American wardrobe", ar: "Polo Ralph Lauren، الدولاب الأمريكي الكلاسيك" },
  adidas: { en: "adidas, three stripes and a long terrace-to-street heritage", ar: "أديداس: التلات خطوط وتاريخ طويل من الملاعب للشارع" },
  zara: { en: "Zara, fast-moving fashion with a clean, tailored feel", ar: "زارا: موضة سريعة بإحساس نضيف ومظبوط" },
  casablanca: { en: "Casablanca, Charaf Tajer's Paris label of sunny, silky leisurewear", ar: "Casablanca، براند شرف تاجر الباريسي: ملابس مشمسة وحرير" },
  "palm-angels": { en: "Palm Angels, Francesco Ragazzi's Milan label inspired by LA skate culture", ar: "Palm Angels، براند فرانشيسكو راجازي من ميلانو بروح سكيت لوس أنجلوس" },
  stussy: { en: "Stüssy, the surf-born streetwear original from Laguna Beach", ar: "ستوسي: أصل الستريت وير اللي طلع من سيرف لاجونا بيتش" },
  "the-north-face": { en: "The North Face, outdoor gear that crossed over into streetwear", ar: "The North Face: معدات الجبل اللي دخلت الستريت" },
  nike: { en: "Nike, the swoosh and decades of performance and street design", ar: "نايك: السووش وعقود من التصميم الرياضي والستريت" },
  jordan: { en: "Jordan Brand, built on Michael Jordan's game and the Air Jordan line", ar: "Jordan Brand: بُني على لعب مايكل جوردن وخط Air Jordan" },
  asics: { en: "ASICS, running heritage with retro-technical shapes", ar: "ASICS: تراث الجري بقصّات ريترو تقنية" },
  "off-white": { en: "Off-White, Virgil Abloh's label of quotation marks and industrial details", ar: "Off-White، براند فيرجل أبلوه بعلامات التنصيص والتفاصيل الصناعية" },
  balenciaga: { en: "Balenciaga, the Paris house of oversized, deconstructed shapes", ar: "Balenciaga، دار باريس للقصّات الواسعة والمفككة" },
  "louis-vuitton": { en: "Louis Vuitton, the Paris house of monogram and travel", ar: "Louis Vuitton، دار باريس للمونوجرام والسفر" },
  dior: { en: "Dior, Parisian couture in a modern menswear cut", ar: "Dior، الأزياء الراقية الباريسية بقصّة رجالي عصرية" },
  gucci: { en: "Gucci, the Florentine house of bold, ornate luxury", ar: "Gucci، دار فلورنسا للفخامة الجريئة والمزخرفة" },
  lanvin: { en: "Lanvin, one of Paris's oldest fashion houses", ar: "Lanvin، من أقدم بيوت الموضة في باريس" },
  "purple-brand": { en: "Purple Brand, New York denim built around a slim, sharp fit", ar: "Purple Brand، دنيم نيويوركي بقصّة ضيقة وحادة" },
  bape: { en: "BAPE, A Bathing Ape, Tokyo's camo-and-shark-hoodie streetwear icon", ar: "BAPE، A Bathing Ape، أيقونة ستريت طوكيو بالكامو وهودي القرش" },
  aape: { en: "AAPE, the more relaxed sister line of A Bathing Ape", ar: "AAPE، الخط الأهدى من A Bathing Ape" },
  sprayground: { en: "Sprayground, bags and accessories with loud, graphic designs", ar: "Sprayground: شنط وإكسسوارات بتصاميم جرافيك صارخة" },
  "cactus-jack": { en: "Cactus Jack, Travis Scott's merch and collaborations", ar: "Cactus Jack، ميرش وتعاونات ترافيس سكوت" },
  "heron-preston": { en: "Heron Preston, utilitarian streetwear with a workwear bent", ar: "Heron Preston: ستريت وير بروح ملابس الشغل" },
  diesel: { en: "Diesel, Italian denim with an attitude", ar: "Diesel: دنيم إيطالي بشخصية" },
  "eric-emanuel": { en: "Eric Emanuel, New York basketball shorts turned fashion staple", ar: "Eric Emanuel: شورتات كورة السلة النيويوركية اللي بقت ستايل" },
  "saint-laurent": { en: "Saint Laurent, sharp Parisian rock tailoring", ar: "Saint Laurent: تفصيل روك باريسي حاد" },
  playboy: { en: "Playboy, the bunny-head label in a streetwear context", ar: "Playboy: براند رأس الأرنب بروح الستريت" },
  "alexander-mcqueen": { en: "Alexander McQueen, dramatic British tailoring", ar: "Alexander McQueen: تفصيل بريطاني درامي" },
  "maison-margiela": { en: "Maison Margiela, the Paris house of quiet subversion", ar: "Maison Margiela: دار باريسية للتمرد الهادي" },
  goyard: { en: "Goyard, the Paris trunk-maker known for its chevron canvas", ar: "Goyard: صانع الحقائب الباريسي بقماش الشيفرون" },
};

const KINDS: Record<string, Lang> = {
  hoodies: { en: "hoodie", ar: "هودي" },
  crewnecks: { en: "crewneck", ar: "كرو نيك" },
  jackets: { en: "jacket", ar: "جاكيت" },
  pants: { en: "pair of pants", ar: "بنطلون" },
  sweatpants: { en: "pair of sweatpants", ar: "سويت بانت" },
  tees: { en: "tee", ar: "تيشيرت" },
  shorts: { en: "pair of shorts", ar: "شورت" },
  tracksuits: { en: "tracksuit", ar: "تراكسوت" },
  footwear: { en: "pair of shoes", ar: "شوز" },
  slides: { en: "pair of slides", ar: "سلايدز" },
  accessories: { en: "accessory", ar: "إكسسوار" },
};

const ACCESSORY_KINDS: Record<string, Lang> = {
  chains: { en: "chain", ar: "سلسلة" },
  bracelets: { en: "bracelet", ar: "بريسلت" },
  rings: { en: "ring", ar: "خاتم" },
  sunglasses: { en: "pair of sunglasses", ar: "نضارة" },
  socks: { en: "pair of socks", ar: "شرابات" },
  boxers: { en: "pair of boxers", ar: "بوكسر" },
  headwear: { en: "cap or hat", ar: "كاب" },
  bags: { en: "bag", ar: "شنطة" },
  belts: { en: "belt", ar: "حزام" },
};

const CARE: Record<string, Lang> = {
  shoes: { en: "Wipe clean with a damp cloth and keep away from direct heat.", ar: "امسحه بقماشة مبلولة وبعّده عن الحرارة المباشرة." },
  tops: { en: "Wash cold, inside out, and dry flat to protect the print and the fit.", ar: "اغسله بمياه باردة ومقلوب وانشّفه مفرود عشان الطباعة والقصّة." },
  bottoms: { en: "Wash cold with similar colours and skip the tumble dryer.", ar: "اغسله بمياه باردة مع ألوان قريبة من بعض وماتحطوش في النشافة." },
  accessory: { en: "Keep dry and store it on its own so it doesn't scratch.", ar: "خليه ناشف وخزّنه لوحده عشان مايتخدش." },
};

const TOPS = ["hoodies", "crewnecks", "jackets", "tees", "tracksuits"];
const BOTTOMS = ["pants", "sweatpants", "shorts"];

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};

export type Describable = {
  slug: string;
  brand: string;
  brandSlug: string;
  title: string;
  category: string;
  subcategory?: string | null;
  model?: string | null;
  colorway?: string | null;
  colors?: string[];
  sizes?: string[];
  description?: string | null;
};

const clean = (s: string) => s.replace(/\s+/g, " ").trim();

/** The source page's own text, when it has something real to say (not a placeholder or a menu dump). */
function sourceDetail(text: string | null | undefined): string {
  const t = clean(text ?? "");
  if (t.length < 40 || /^\s*(shop|buy|view|add to|sold out)/i.test(t)) return "";
  const cut = t.length > 320 ? `${t.slice(0, 320).replace(/\s\S*$/, "")}…` : t;
  return cut;
}

export function describeProduct(p: Describable): { en: string; ar: string } {
  const h = hash(p.slug);
  const blurb = BRANDS[p.brandSlug];
  const kind = p.category === "accessories" ? ACCESSORY_KINDS[p.subcategory ?? ""] ?? KINDS.accessories : KINDS[p.category] ?? KINDS.accessories;
  const name = p.model ? `${p.model}${p.colorway ? ` "${p.colorway}"` : ""}` : p.title;
  const colors = [...new Set((p.colors ?? []).map(clean).filter(Boolean))].slice(0, 4);
  const sizes = (p.sizes ?? []).filter(Boolean);
  const sizeRange = sizes.length > 1 ? `${sizes[0]} – ${sizes[sizes.length - 1]}` : sizes[0] ?? "";
  const care = CARE[p.category === "footwear" || p.category === "slides" ? "shoes" : TOPS.includes(p.category) ? "tops" : BOTTOMS.includes(p.category) ? "bottoms" : "accessory"];
  const detail = sourceDetail(p.description);

  const openEn = [
    `${name} by ${p.brand}${blurb ? `, ${blurb.en}` : ""}.`,
    `A ${p.brand} ${kind.en}${blurb ? ` from ${blurb.en}` : ""}: ${name}.`,
    `${p.brand}'s ${name}${blurb ? ` comes from ${blurb.en}` : ""}.`,
  ][h % 3];
  const openAr = [
    `${name} من ${p.brand}${blurb ? `، ${blurb.ar}` : ""}.`,
    `${kind.ar} ${p.brand}${blurb ? ` من ${blurb.ar}` : ""}: ${name}.`,
    `${name}${blurb ? ` جاي من ${blurb.ar}` : ` من ${p.brand}`}.`,
  ][h % 3];

  const en = [
    openEn,
    colors.length ? `Colour: ${colors.join(", ")}.` : "",
    sizeRange ? `Sizes ${sizeRange}.` : "",
    detail ? `Details: ${detail}` : "",
    care.en,
    "Exchange within 14 days if it's unworn with tags.",
  ].filter(Boolean).join(" ");

  const ar = [
    openAr,
    colors.length ? `اللون: ${colors.join("، ")}.` : "",
    sizeRange ? `المقاسات ${sizeRange}.` : "",
    care.ar,
    "الاستبدال خلال ١٤ يوم لو القطعة ما اتلبستش وعليها التاجات.",
  ].filter(Boolean).join(" ");

  return { en, ar };
}
