import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { InfoPage } from "@/components/shop/info-page";
import { Link } from "@/i18n/navigation";
import { SAME_DAY } from "@/lib/delivery";
import { EXCHANGE_DAYS } from "@/models/exchange";

export const metadata: Metadata = { title: "FAQ" };

type QA = { q: string; a: React.ReactNode };

export default async function FaqPage() {
  const ar = (await getLocale()) === "ar";
  const items: QA[] = ar
    ? [
        { q: "القطع أصلية؟", a: "أيوه. كل قطعة جاية من مصدر معروف للبراند، وبنراجعها قبل الشحن." },
        { q: "أطلب إزاي؟", a: "اختار المقاس، ودوس أضف للسلة، وكمّل الطلب. هتحتاج تعمل حساب عشان نتابع معاك الأوردر." },
        { q: "بتقبلوا دفع إيه؟", a: "كاش عند الاستلام جوه مصر، أو تحويل InstaPay / فودافون كاش وترفع صورة التحويل. الدفع بالكارت هيتفعّل قريب." },
        { q: "الشحن بياخد قد إيه؟", a: <>من يومين لـ 5 أيام شغل حسب المحافظة. في القاهرة والجيزة والقليوبية فيه شحن نفس اليوم لو طلبت قبل الساعة {SAME_DAY.cutoffHour > 12 ? SAME_DAY.cutoffHour - 12 : SAME_DAY.cutoffHour} الضهر (+{SAME_DAY.fee} جنيه). <Link href="/policies/shipping" className="underline underline-offset-4">تفاصيل الشحن</Link></> },
        { q: "أقدر أبدّل؟", a: <>تقدر تبدّل المقاس خلال {EXCHANGE_DAYS} يوم من الاستلام، والقطعة لسه بالتيكت ومتلبستش. البوكسرات والشرابات مش بتتبدل. <Link href="/policies/exchange" className="underline underline-offset-4">سياسة الاستبدال</Link></> },
        { q: "مش عارف مقاسي", a: <>استخدم <Link href="/size-finder" className="underline underline-offset-4">اعرف مقاسك بالكاميرا</Link>، أو بص على <Link href="/size-guide" className="underline underline-offset-4">دليل المقاسات</Link>. ولو حفظت مقاساتك في حسابك، كل صفحة منتج هتقولك مقاسك.</> },
        { q: "يعني إيه طلب مسبق؟", a: "قطعة خلصت بس جاية تاني. بتدفع 50٪ عربون دلوقتي والباقي قبل الشحن، ومحجوزالك أول ما توصل." },
        { q: "بتشحنوا بره مصر؟", a: "أيوه لدول الخليج والوطن العربي وأوروبا وأمريكا. مصاريف الشحن بتظهر في صفحة الدفع حسب البلد." },
        { q: "أتابع الأوردر إزاي؟", a: <>من <Link href="/account" className="underline underline-offset-4">حسابي</Link>، أو من <Link href="/track" className="underline underline-offset-4">تتبع الطلب</Link> برقم الأوردر والموبايل.</> },
      ]
    : [
        { q: "Are the pieces authentic?", a: "Yes. Every piece comes from a known source for the brand, and we check it before it ships." },
        { q: "How do I order?", a: "Pick your size, add to cart and check out. You need an account so we can keep you updated on the order." },
        { q: "How can I pay?", a: "Cash on delivery inside Egypt, or InstaPay / Vodafone Cash with a screenshot of the transfer. Card payments are coming soon." },
        { q: "How long is delivery?", a: <>Two to five working days depending on the governorate. Cairo, Giza and Qalyubia get same-day delivery when you order before {SAME_DAY.cutoffHour}:00 (+{SAME_DAY.fee} EGP). <Link href="/policies/shipping" className="underline underline-offset-4">Shipping details</Link></> },
        { q: "Can I exchange?", a: <>Exchange the size within {EXCHANGE_DAYS} days of delivery, unworn with the tags on. Boxers and socks cannot be exchanged. <Link href="/policies/exchange" className="underline underline-offset-4">Exchange policy</Link></> },
        { q: "I don't know my size", a: <>Use <Link href="/size-finder" className="underline underline-offset-4">find my size with the camera</Link> or the <Link href="/size-guide" className="underline underline-offset-4">size guide</Link>. Save your sizes in your account and every product page shows yours.</> },
        { q: "What is a pre-order?", a: "A sold-out piece that is coming back. You pay a 50% deposit now and the rest before it ships; one is held for you." },
        { q: "Do you ship abroad?", a: "Yes, to the Gulf, the Arab world, Europe and the US. The shipping fee shows at checkout for your country." },
        { q: "How do I track my order?", a: <>From <Link href="/account" className="underline underline-offset-4">your account</Link>, or <Link href="/track" className="underline underline-offset-4">track an order</Link> with the order number and phone.</> },
      ];
  return (
    <InfoPage eyebrow="FAQ" title={ar ? "الأسئلة الشائعة" : "FAQ"} intro={ar ? "أكتر حاجات بتتسأل. لو سؤالك مش هنا كلمنا على واتساب." : "What people ask most. If yours isn't here, message us on WhatsApp."}>
      <div className="flex flex-col divide-y divide-ash border-y border-ash">
        {items.map((it) => (
          <details key={it.q} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base text-bone">
              {it.q}
              <span aria-hidden="true" className="text-dust transition-transform group-open:rotate-45">+</span>
            </summary>
            <div className="pt-3">{it.a}</div>
          </details>
        ))}
      </div>
    </InfoPage>
  );
}
