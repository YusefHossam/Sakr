import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { Bullets, InfoPage, InfoSection } from "@/components/shop/info-page";
import { Link } from "@/i18n/navigation";
import { SAME_DAY } from "@/lib/delivery";
import { GOVERNORATES } from "@/lib/shipping";
import { EXCHANGE_DAYS } from "@/models/exchange";

const SLUGS = ["exchange", "shipping", "privacy", "terms"] as const;
type Slug = (typeof SLUGS)[number];
const isSlug = (s: string): s is Slug => (SLUGS as readonly string[]).includes(s);
const TITLES: Record<Slug, { ar: string; en: string }> = {
  exchange: { ar: "سياسة الاستبدال", en: "Exchange policy" },
  shipping: { ar: "سياسة الشحن", en: "Shipping policy" },
  privacy: { ar: "سياسة الخصوصية", en: "Privacy policy" },
  terms: { ar: "الشروط والأحكام", en: "Terms and conditions" },
};

export function generateStaticParams() {
  return SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/policies/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return isSlug(slug) ? { title: TITLES[slug].en } : {};
}

const hour = (h: number, ar: boolean) => (ar ? `${h > 12 ? h - 12 : h} ${h >= 12 ? "الضهر" : "الصبح"}` : `${h}:00`);

export default async function PolicyPage({ params }: PageProps<"/[locale]/policies/[slug]">) {
  const [{ slug }, locale] = await Promise.all([params, getLocale()]);
  if (!isSlug(slug)) notFound();
  const ar = locale === "ar";
  const title = TITLES[slug][ar ? "ar" : "en"];
  const updated = ar ? "آخر تحديث: نوفمبر 2026" : "Last updated: November 2026";

  if (slug === "exchange")
    return (
      <InfoPage eyebrow={ar ? "السياسات" : "POLICIES"} title={title} intro={updated}>
        <InfoSection title={ar ? "تقدر تبدّل إمتى" : "When you can exchange"}>
          <Bullets
            items={
              ar
                ? [`خلال ${EXCHANGE_DAYS} يوم من يوم الاستلام.`, "القطعة متلبستش، ولسه بالتيكت والكرتونة بتاعتها.", "التبديل بمقاس تاني من نفس القطعة، أو بكريدت في محفظتك لو المقاس خلص.", "مرة واحدة للأوردر."]
                : [`Within ${EXCHANGE_DAYS} days of delivery.`, "Unworn, with the tags and original box.", "For another size of the same piece, or wallet credit if that size is gone.", "Once per order."]
            }
          />
        </InfoSection>
        <InfoSection title={ar ? "حاجات مش بتتبدل" : "Not exchangeable"}>
          <Bullets items={ar ? ["البوكسرات والملابس الداخلية والشرابات، عشان النضافة.", "صناديق المستري بوكس.", "أي قطعة عليها آثار لبس أو برفان أو غسيل."] : ["Boxers, underwear and socks, for hygiene.", "Mystery boxes.", "Anything worn, washed or with perfume on it."]} />
        </InfoSection>
        <InfoSection title={ar ? "إزاي تطلب استبدال" : "How to request one"}>
          <p>
            {ar ? "من " : "From "}
            <Link href="/account" className="underline underline-offset-4">{ar ? "حسابي" : "your account"}</Link>
            {ar ? "، جنب الأوردر المتسلّم دوس «استبدال» واختار السبب. هنكلمك خلال يوم شغل نرتب المندوب. لو العيب مننا (قطعة فيها عيب أو مقاس غلط اتبعت) الشحن علينا، غير كده مصاريف شحن الاستبدال عليك." : ", press “Exchange” next to a delivered order and pick a reason. We'll contact you within a working day to arrange the courier. If the fault is ours (a defect or the wrong item) we pay the shipping; otherwise the exchange shipping is on you."}
          </p>
        </InfoSection>
      </InfoPage>
    );

  if (slug === "shipping") {
    const fees = Object.values(GOVERNORATES).sort((a, b) => a.fee - b.fee);
    return (
      <InfoPage eyebrow={ar ? "السياسات" : "POLICIES"} title={title} intro={updated}>
        <InfoSection title={ar ? "مدة التوصيل" : "Delivery time"}>
          <Bullets
            items={
              ar
                ? ["من يومين لـ 5 أيام شغل حسب المحافظة (الجمعة إجازة).", `شحن نفس اليوم في القاهرة والجيزة والقليوبية لو طلبت قبل ${hour(SAME_DAY.cutoffHour, true)} (+${SAME_DAY.fee} جنيه).`, "بره مصر: من 7 لـ 14 يوم شغل حسب البلد.", "الطلب المسبق بيتشحن من التاريخ المكتوب على القطعة."]
                : ["Two to five working days depending on the governorate (Friday is off).", `Same-day delivery in Cairo, Giza and Qalyubia when you order before ${hour(SAME_DAY.cutoffHour, false)} (+${SAME_DAY.fee} EGP).`, "Outside Egypt: 7 to 14 working days depending on the country.", "Pre-orders ship from the date shown on the piece."]
            }
          />
        </InfoSection>
        <InfoSection title={ar ? "مصاريف الشحن جوه مصر" : "Shipping fees in Egypt"}>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
            {fees.map((g) => (
              <li key={g.en} className="flex justify-between border-b border-ash/60 py-1.5">
                <span>{ar ? g.ar : g.en}</span>
                <span className="text-bone" dir="ltr">{g.fee} EGP</span>
              </li>
            ))}
          </ul>
        </InfoSection>
        <InfoSection title={ar ? "الاستلام" : "On delivery"}>
          <Bullets items={ar ? ["افتح الشحنة قدام المندوب واتأكد من القطعة والمقاس.", "لو فيه حاجة غلط ارفض الاستلام وكلمنا على واتساب على طول."] : ["Open the parcel in front of the courier and check the piece and size.", "If something is wrong, refuse it and message us on WhatsApp right away."]} />
        </InfoSection>
      </InfoPage>
    );
  }

  if (slug === "privacy")
    return (
      <InfoPage eyebrow={ar ? "السياسات" : "POLICIES"} title={title} intro={updated}>
        <InfoSection title={ar ? "بنحتفظ بإيه" : "What we keep"}>
          <Bullets items={ar ? ["اسمك وإيميلك وموبايلك وعنوانك، عشان نوصّلك الأوردر.", "أوردراتك ومقاساتك اللي حفظتها، عشان نقترح عليك.", "صورة التحويل لو دفعت تحويل، ونمسحها بعد مراجعة الدفع."] : ["Your name, email, phone and address, to deliver your order.", "Your orders and saved sizes, to suggest what fits.", "The transfer screenshot if you pay by transfer, deleted after the payment is checked."]} />
        </InfoSection>
        <InfoSection title={ar ? "صور الكاميرا" : "Camera photos"}>
          <p>{ar ? "اعرف مقاسك والـ AR وFit Check بيشتغلوا على جهازك. صور المقاسات والـ AR مبتتبعتش لأي سيرفر. Fit Check بيبعت الصورة لموديل ذكاء اصطناعي عشان يقيّم اللوك وبعدها مبتتحفظش." : "Find my size and AR try-on run on your device; those photos are never uploaded. Fit Check sends one photo to an AI model to rate the look, and it isn't stored afterwards."}</p>
        </InfoSection>
        <InfoSection title={ar ? "اللي مش بنعمله" : "What we never do"}>
          <Bullets items={ar ? ["مش بنبيع بياناتك لحد.", "مش بنحتفظ ببيانات الكارت، الدفع بيتم عند بوابة الدفع."] : ["We never sell your data.", "We never store card details; payment happens with the payment provider."]} />
        </InfoSection>
        <p>{ar ? "عايز تمسح حسابك؟ كلمنا من صفحة " : "Want your account deleted? Ask us from the "}<Link href="/contact" className="underline underline-offset-4">{ar ? "اتصل بينا" : "contact page"}</Link>.</p>
      </InfoPage>
    );

  return (
    <InfoPage eyebrow={ar ? "السياسات" : "POLICIES"} title={title} intro={updated}>
      <Bullets
        items={
          ar
            ? ["الأسعار بالجنيه المصري، والعملات التانية تقريبية للعرض بس.", "الأوردر بيتأكد بعد ما نراجع الدفع أو نكلمك في الدفع عند الاستلام.", "الكميات محدودة، ولو قطعة خلصت قبل تأكيد الأوردر هنرجعلك فلوسك كاملة.", "كوبونات الخصم لمرة واحدة ومش بتتجمع مع بعض.", "الطلب المسبق بعربون 50٪ ومش بيرجع لو الأوردر اتلغى بعد ما القطعة اتحجزت.", "أي استخدام للموقع معناه موافقتك على سياسات الاستبدال والشحن والخصوصية."]
            : ["Prices are in Egyptian pounds; other currencies are shown as estimates only.", "An order is confirmed once payment is checked, or by phone for cash on delivery.", "Quantities are limited; if a piece sells out before confirmation you get a full refund.", "Discount codes are single-use and don't stack.", "Pre-orders take a 50% deposit, which is not refundable once the piece is reserved.", "Using the site means you accept the exchange, shipping and privacy policies."]
        }
      />
      <p>
        <Link href="/policies/exchange" className="underline underline-offset-4">{TITLES.exchange[ar ? "ar" : "en"]}</Link>
        {" · "}
        <Link href="/policies/shipping" className="underline underline-offset-4">{TITLES.shipping[ar ? "ar" : "en"]}</Link>
        {" · "}
        <Link href="/policies/privacy" className="underline underline-offset-4">{TITLES.privacy[ar ? "ar" : "en"]}</Link>
      </p>
    </InfoPage>
  );
}
