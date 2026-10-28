"use server";

import { z } from "zod";
import { getListing } from "@/lib/catalog";
import { fitNote } from "@/lib/fit-notes";
import { findOrderByPhone } from "@/lib/order-queries";
import { matchedTerms } from "@/lib/search-normalize";

export type ChatProduct = { slug: string; title: string; brand: string; image: string | null; price: number };
export type ChatReply = { text: string; products?: ChatProduct[]; links?: { label: string; href: string }[] };

const messageSchema = z.string().trim().min(1).max(300);
const WHATSAPP = { label: "WhatsApp", href: "https://wa.me/201001234567" };

const STATUS_AR: Record<string, string> = { pending: "اتسجل", awaiting_payment: "مستني الدفع", confirmed: "اتأكد", preparing: "بيتجهز", shipped: "خرج مع المندوب", delivered: "وصل", cancelled: "اتلغى" };
const STATUS_EN: Record<string, string> = { pending: "received", awaiting_payment: "waiting for payment", confirmed: "confirmed", preparing: "being prepared", shipped: "out for delivery", delivered: "delivered", cancelled: "cancelled" };

type Faq = { test: RegExp; ar: string; en: string; link?: { label: string; href: string } };
// Facts mirror the store's real policies (see docs/REQUIREMENTS.md).
const FAQS: Faq[] = [
  { test: /شحن|توصيل|يوصل|ميعاد|delivery|shipping|ship\b|how long/i, ar: "التوصيل بيبدأ بعد يومين شغل على الأقل، والميعاد بتختاره إنت في الدفع. سعر الشحن بيختلف حسب المحافظة وبيظهر قبل ما تأكد. بنشحن لبرّه مصر كمان بالكارت.", en: "Delivery starts at least 2 business days out and you pick the date at checkout. Shipping depends on the governorate and is shown before you confirm. We ship abroad too, paid by card.", link: { label: "تتبع طلبك / Track", href: "/track" } },
  { test: /استبدال|ارجاع|إرجاع|رجع|ترجيع|فلوسي|exchange|return|refund/i, ar: "الاستبدال خلال ١٤ يوم من الاستلام، بشرط القطعة ما اتلبستش وعليها التاجات. البوكسرات والشرابات مبتتبدلش. ممكن تبدّل المقاس مرة واحدة.", en: "Exchanges within 14 days of delivery, as long as the piece is unworn with tags. Boxers and socks can't be exchanged. A size exchange is allowed once.", link: { label: "سياسة الاستبدال", href: "/policies/exchange" } },
  { test: /دفع|كارت|فيزا|انستاباي|إنستاباي|instapay|كاش|عند الاستلام|cod|cash|payment|pay\b|card/i, ar: "الدفع بالكارت (Paymob)، أو تحويل InstaPay/محفظة وترفع صورة التحويل، أو كاش عند الاستلام (جوه مصر بس). وفيه خيار تدفع ٥٠٪ عربون.", en: "Pay by card (Paymob), by InstaPay/wallet transfer with a screenshot, or cash on delivery (Egypt only). You can also pay a 50% deposit." },
  { test: /كوبون|خصم|عرض|discount|coupon|promo|sale/i, ar: "أي قطعة فاضل منها ٣ أو أقل في مقاس بتنزل بخصم ٨٥٪. وأي أوردر فوق ١٠ آلاف جنيه بيجيلك بعده كوبون ٢٠٪. الكوبونات بتلاقيها في حسابك، وكل كوبون لأوردر واحد.", en: "A piece with 3 or fewer left in a size drops to 85% off. Orders over 10,000 EGP earn a 20% coupon afterwards. Your coupons live in your account and each works once." },
  { test: /دروب|drop|ادخل|locked|مقفول/i, ar: "الموقع بيتقفل بين الدروبات وبيفتح بباسورد الدروب. أعضاء OG وLegend بيدخلوا قبل الكل بـ٣ ساعات.", en: "The store locks between drops and opens with the drop password. OG and Legend members get in 3 hours early." },
  { test: /واتساب|تواصل|رقم|كلمني|whatsapp|contact|call|phone/i, ar: "تقدر تكلمنا على واتساب في أي وقت.", en: "You can reach us on WhatsApp any time.", link: WHATSAPP },
  { test: /^(hi|hello|hey|اهلا|أهلا|مرحبا|هاي|السلام|صباح|مساء)/i, ar: "أهلًا بيك في SAKR! اسألني عن منتج، مقاسك، طلبك، أو الشحن والدفع.", en: "Welcome to SAKR! Ask me about a piece, your size, your order, shipping or payment." },
];

/** A rough top size from height (cm) and weight (kg). */
function guessSize(height: number, weight: number): string {
  const bmiLike = weight - (height - 170) * 0.45;
  if (bmiLike < 60) return "S";
  if (bmiLike < 72) return "M";
  if (bmiLike < 84) return "L";
  if (bmiLike < 96) return "XL";
  return "XXL";
}

function sizeAdvice(text: string, locale: "ar" | "en"): string | null {
  if (!/مقاس|size|طولي|وزني|height|weight|كام/i.test(text)) return null;
  const nums = [...text.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).matchAll(/\d{2,3}/g)].map((m) => Number(m[0]));
  const height = nums.find((n) => n >= 140 && n <= 215);
  const weight = nums.find((n) => n >= 40 && n <= 170 && n !== height);
  if (!height || !weight) return locale === "ar" ? "قولي طولك بالسم ووزنك بالكيلو (مثلًا: طولي ١٧٥ ووزني ٧٠) وأقولك مقاس مناسب." : "Tell me your height in cm and weight in kg (e.g. 175 and 70) and I'll suggest a size.";
  const size = guessSize(height, weight);
  return locale === "ar"
    ? `بالمقاسات دي (${height} سم / ${weight} كجم) المقاس التقريبي للهوديز والتيشيرتات: ${size}. لو القطعة أوفر سايز (زي Essentials وCorteiz) خد مقاس أصغر.`
    : `For ${height} cm / ${weight} kg a rough top size is ${size}. For oversized labels (Essentials, Corteiz) size down.`;
}

async function answerOrder(text: string, locale: "ar" | "en"): Promise<ChatReply | null> {
  const number = text.match(/SKR-[A-Z0-9]{6,}/i)?.[0];
  if (!number) return /طلبي|اوردري|أوردري|order|فين طلب/i.test(text) ? { text: locale === "ar" ? "ابعتلي رقم الأوردر (SKR-...) ورقم الموبايل اللي طلبت بيه وأقولك وصل لفين." : "Send me the order number (SKR-...) and the phone number you ordered with and I'll check it." } : null;
  const phone = text.replace(number, "").match(/\+?\d[\d\s-]{8,}/)?.[0];
  if (!phone) return { text: locale === "ar" ? `تمام، رقم الأوردر ${number}. ابعتلي كمان رقم الموبايل اللي طلبت بيه عشان أتأكد إنه ليك.` : `Got order ${number}. Please also send the phone number you ordered with so I can verify it's yours.` };
  const order = await findOrderByPhone(number, phone);
  if (!order) return { text: locale === "ar" ? "ملقيتش أوردر بالرقم ده والموبايل ده. راجع الرقم أو كلمنا على واتساب." : "I couldn't find an order with that number and phone. Check them or message us on WhatsApp.", links: [WHATSAPP] };
  const status = (locale === "ar" ? STATUS_AR : STATUS_EN)[order.status] ?? order.status;
  const date = order.deliveryDate.slice(0, 10);
  return {
    text: locale === "ar" ? `أوردر ${order.number}: ${status}. ميعاد التوصيل ${date}. الإجمالي ${order.total.toLocaleString("en")} جنيه.${order.delayReason ? ` (اتأخر: ${order.delayReason})` : ""}` : `Order ${order.number} is ${status}. Delivery ${date}. Total ${order.total.toLocaleString("en")} EGP.${order.delayReason ? ` (delayed: ${order.delayReason})` : ""}`,
    links: [{ label: locale === "ar" ? "افتح التتبع" : "Open tracking", href: "/track" }],
  };
}

const GEMINI_MODELS = ["gemini-flash-latest", "gemini-3.5-flash", "gemini-flash-lite-latest"];

/** Open questions go to Gemini (free tier, may be busy) with the store's facts; a failure falls back to a human hand-off. */
async function askGemini(text: string, locale: "ar" | "en"): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const facts = FAQS.map((f) => f.en).join(" ");
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: `You are SAKR's assistant for a men's streetwear store in Cairo. Answer in ${locale === "ar" ? "short Egyptian Arabic" : "short English"}, max 3 sentences. Use only these store facts and general fashion knowledge; if you don't know, say so and suggest WhatsApp. Facts: ${facts}` }] },
    contents: [{ role: "user", parts: [{ text }] }],
    generationConfig: { temperature: 0.6, thinkingConfig: { thinkingLevel: "low" } },
  });
  const deadline = Date.now() + 14_000;
  for (const model of GEMINI_MODELS) {
    const left = deadline - Date.now();
    if (left < 2_000) break;
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, { method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": key }, body, signal: AbortSignal.timeout(Math.min(left, 7_000)) });
      if (!res.ok) continue;
      const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[] };
      const out = (data.candidates?.[0]?.content?.parts ?? []).filter((p) => !p.thought).map((p) => p.text ?? "").join("").trim();
      if (out) return out.slice(0, 600);
    } catch {
      /* try the next model */
    }
  }
  return null;
}

export async function askAssistant(message: string, locale: "ar" | "en"): Promise<ChatReply> {
  const parsed = messageSchema.safeParse(message);
  if (!parsed.success) return { text: locale === "ar" ? "اكتب سؤالك وأنا أرد." : "Type your question and I'll answer." };
  const text = parsed.data;
  const L = locale === "ar" ? "ar" : "en";

  const order = await answerOrder(text, L);
  if (order) return order;

  const size = sizeAdvice(text, L);
  const terms = matchedTerms(text);
  if (size) {
    const brandNote = terms.map((t) => fitNote(t.replace(/\s+/g, "-"), L)).find(Boolean);
    return { text: brandNote ? `${size} ${brandNote}` : size };
  }

  // Product questions: show real pieces from the catalog.
  if (terms.length) {
    const listing = await getListing({ q: text, page: 1 });
    if (listing.items.length) {
      return {
        text: L === "ar" ? "دي أقرب حاجات لسؤالك:" : "Here's what matches:",
        products: listing.items.slice(0, 4).map((p) => ({ slug: p.slug, title: p.title, brand: p.brand, image: p.image, price: p.salePrice ?? p.price })),
        links: [{ label: L === "ar" ? "شوف الكل" : "See all", href: `/search?q=${encodeURIComponent(text)}` }],
      };
    }
  }

  const faq = FAQS.find((f) => f.test.test(text));
  if (faq) return { text: faq[L], links: faq.link ? [faq.link] : undefined };

  const ai = await askGemini(text, L);
  if (ai) return { text: ai };
  return { text: L === "ar" ? "مش متأكد من الإجابة دي. كلمنا على واتساب وحد من الفريق هيرد عليك." : "I'm not sure about that one. Message us on WhatsApp and the team will answer.", links: [WHATSAPP] };
}
