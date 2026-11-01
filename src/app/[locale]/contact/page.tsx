import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { SocialIcon, type SocialName } from "@/components/layout/brand-icons";
import { InfoPage, InfoSection } from "@/components/shop/info-page";
import { Link } from "@/i18n/navigation";

export const metadata: Metadata = { title: "Contact" };

const CHANNELS: { name: SocialName; label: string; href: string; handle: string }[] = [
  { name: "whatsapp", label: "WhatsApp", href: "https://wa.me/201000000000", handle: "+20 100 000 0000" },
  { name: "instagram", label: "Instagram", href: "https://instagram.com", handle: "@sakr.store" },
  { name: "snapchat", label: "Snapchat", href: "https://snapchat.com", handle: "sakr.store" },
  { name: "tiktok", label: "TikTok", href: "https://tiktok.com", handle: "@sakr.store" },
];

export default async function ContactPage() {
  const ar = (await getLocale()) === "ar";
  return (
    <InfoPage eyebrow={ar ? "تواصل" : "CONTACT"} title={ar ? "كلمنا" : "Contact us"} intro={ar ? "أسرع رد على واتساب، كل يوم من 11 الصبح لـ 11 بالليل." : "Fastest on WhatsApp, every day from 11 am to 11 pm (Cairo)."}>
      <ul className="grid gap-3 sm:grid-cols-2">
        {CHANNELS.map((c) => (
          <li key={c.name}>
            <a href={c.href} target="_blank" rel="noreferrer" className="flex items-center gap-4 border border-ash p-4 transition-colors hover:border-bone">
              <SocialIcon name={c.name} className="size-8" />
              <span className="flex flex-col">
                <span className="text-bone">{c.label}</span>
                <span className="text-xs text-dust" dir="ltr">{c.handle}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
      <InfoSection title={ar ? "إيميل" : "Email"}>
        <a href="mailto:support@sakr.store" className="self-start text-bone underline underline-offset-4" dir="ltr">support@sakr.store</a>
      </InfoSection>
      <InfoSection title={ar ? "العنوان" : "Address"}>
        <p>{ar ? "الزمالك، القاهرة، مصر. الطلبات أونلاين بس، ومفيش استلام من المحل." : "Zamalek, Cairo, Egypt. Orders are online only; no store pickup."}</p>
      </InfoSection>
      <InfoSection title={ar ? "عندك أوردر؟" : "About an order?"}>
        <p>
          {ar ? "ابعت رقم الأوردر في أول رسالة عشان نرد أسرع. وتقدر تتابعه بنفسك من " : "Send the order number in your first message so we can answer faster. You can also follow it yourself in "}
          <Link href="/track" className="underline underline-offset-4">{ar ? "تتبع الطلب" : "track an order"}</Link>.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
