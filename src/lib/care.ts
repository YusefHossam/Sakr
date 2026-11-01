// How to clean and keep accessories, by kind of piece and the metal or material its title names. Client-safe.

type Lines = { ar: string[]; en: string[] };

const SILVER: Lines = {
  ar: [
    "الفضة بتسوّد مع الهوا والعرق، وده طبيعي. امسحها بقماشة تلميع فضة بعد كل كام لبسة.",
    "تنضيف أعمق: ميّه دافية وكام نقطة صابون مواعين خفيف، وفرشة سنان ناعمة، واشطفها ونشّفها كويس جدًا.",
    "التفاصيل السودا في قطع كروم هارتس مقصودة: متغطسهاش في سائل تنضيف فضة عشان هيمسح السواد ده.",
    "ممنوع معجون السنان أو البودرة، دول بيخدشوا الفضة.",
  ],
  en: [
    "Silver darkens with air and sweat, which is normal. Wipe it with a silver polishing cloth every few wears.",
    "For a deeper clean: warm water, a few drops of mild dish soap, a soft toothbrush, then rinse and dry completely.",
    "The blackened details on Chrome Hearts pieces are on purpose: never dip them in silver cleaner, it strips that patina.",
    "No toothpaste or powders, they scratch silver.",
  ],
};
const STEEL: Lines = {
  ar: [
    "الستانلس مبيصدّيش ولا بيسوّد. اغسله بميّه دافية وصابون خفيف وفرشة ناعمة، ونشّفه بقماشة مايكروفايبر.",
    "متستخدمش كلور أو منظفات فيها مبيض.",
  ],
  en: [
    "Stainless steel does not rust or tarnish. Wash it in warm water with mild soap and a soft brush, then dry it with a microfibre cloth.",
    "Keep chlorine and bleach cleaners away from it.",
  ],
};
const GOLD: Lines = {
  ar: [
    "الطلا الدهب بيعيش أطول لو بعدته عن الميّه والبرفان والعرق: البسه آخر حاجة واقلعه أول حاجة.",
    "امسحه بقماشة ناعمة ناشفة بعد اللبس. متستخدمش قماشة تلميع فيها مادة كاشطة، هتشيل الطلا.",
  ],
  en: [
    "Gold plating lasts longer away from water, perfume and sweat: put it on last and take it off first.",
    "Wipe it with a soft dry cloth after wearing. Skip polishing cloths with abrasives, they wear the plating off.",
  ],
};
const STONES: Lines = {
  ar: [
    "الحجارة المتلّجة بتلم تراب وزيوت بينها: فرشة سنان ناعمة بميّه وصابون خفيف بين الحجارة، ونشّفها بسشوار على الهوا البارد.",
    "متسيبهاش في الميّه كتير ومتحطهاش في جهاز ألتراسونيك، عشان الحجارة المتلزّقة ممكن تقع.",
  ],
  en: [
    "Iced stones collect dust and oils: brush between them with a soft toothbrush, warm water and mild soap, then dry with a hairdryer on cool.",
    "Don't soak it or use an ultrasonic cleaner: glued stones can come loose.",
  ],
};
const WATCH: Lines = {
  ar: [
    "امسح الساعة والإسورة بقماشة مايكروفايبر بعد كل لبسة.",
    "الإسورة المعدن: فرشة ناعمة بميّه وصابون، وابعد عن جسم الساعة لو مش مكتوب إنها ضد الميّه.",
    "متدوسش على الزراير وهي في الميّه، وخلي الأستيك الجلد بعيد عن الميّه.",
  ],
  en: [
    "Wipe the case and bracelet with a microfibre cloth after each wear.",
    "Metal bracelets: a soft brush with soapy water, keeping away from the case unless the watch is water resistant.",
    "Never press the buttons under water, and keep leather straps dry.",
  ],
};
const LEATHER: Lines = {
  ar: [
    "امسح الجلد أو الكانفاس بقماشة مبلولة ميّه بس، من غير كحول ولا منظفات.",
    "اعمله كريم ترطيب جلد كل كام شهر، وخليه بعيد عن الشمس المباشرة والحرارة.",
    "خزّن الشنطة محشية ورق عشان تحافظ على شكلها، وجوه كيس القماش بتاعها.",
  ],
  en: [
    "Wipe leather or coated canvas with a cloth dampened with plain water, no alcohol or cleaners.",
    "Condition the leather every few months and keep it out of direct sun and heat.",
    "Store bags stuffed with paper to hold their shape, inside their dust bag.",
  ],
};
const SCARF: Lines = {
  ar: [
    "الصوف والكشمير: غسيل إيد بميّه ساقعة وشامبو صوف، متعصرهوش، وانشره مفرود يعني ميتعلقش.",
    "الحرير: دراي كلين بس.",
    "خزّنه متطبق مش متعلق، وحط معاه خشب أرز ضد العتة.",
  ],
  en: [
    "Wool and cashmere: hand wash in cold water with wool shampoo, never wring, and dry flat.",
    "Silk: dry clean only.",
    "Store it folded, not hung, with cedar against moths.",
  ],
};
const GLASSES: Lines = {
  ar: ["اشطف العدسة بميّه الأول عشان التراب ميخدشهاش، وبعدين امسحها بقماشة مايكروفايبر.", "خليها في الجراب بتاعها، ومتسيبهاش في العربية في الشمس."],
  en: ["Rinse the lenses first so grit doesn't scratch them, then dry with a microfibre cloth.", "Keep them in their case and never leave them in a hot car."],
};

/** Care lines for an accessory, or null for clothing (which uses the washing guide). */
export function careFor(subcategory: string | null | undefined, title: string, brandSlug: string, lang: "ar" | "en"): string[] | null {
  const t = title.toLowerCase();
  const out: string[] = [];
  const add = (l: Lines) => out.push(...l[lang]);
  const metal = () => {
    if (/925|sterling|silver/.test(t) || brandSlug === "chrome-hearts") add(SILVER);
    else if (/gold|plated|vermeil|14k|18k|24k/.test(t)) add(GOLD);
    else add(STEEL);
    if (/iced|\bcz\b|vvs|diamond|moissanite|baguette|crystal|rhinestone|arctic/.test(t) || brandSlug === "king-ice") add(STONES);
  };
  switch (subcategory) {
    case "rings":
    case "chains":
    case "bracelets":
      metal();
      break;
    case "watches":
      add(WATCH);
      if (/iced|\bcz\b|vvs|diamond|moissanite|baguette|arctic/.test(t) || brandSlug === "king-ice") add(STONES);
      if (/gold|plated/.test(t)) add(GOLD);
      break;
    case "belts":
    case "bags":
      add(LEATHER);
      if (/buckle|silver|925/.test(t)) metal();
      break;
    case "scarves":
      add(SCARF);
      break;
    case "sunglasses":
      add(GLASSES);
      break;
    default:
      return null;
  }
  return out;
}
