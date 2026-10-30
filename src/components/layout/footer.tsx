import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SocialIcon } from "./brand-icons";
import { JoinForm } from "./join-form";
import { PaymentIcons } from "./payment-icons";
import tracks from "../../../public/music/tracks.json";

const SOCIALS = [
  { label: "WhatsApp", name: "whatsapp", href: "https://wa.me/201000000000" },
  { label: "Instagram", name: "instagram", href: "https://instagram.com" },
  { label: "Snapchat", name: "snapchat", href: "https://snapchat.com" },
  { label: "TikTok", name: "tiktok", href: "https://tiktok.com" },
  { label: "X", name: "x", href: "https://x.com" },
] as const;

export async function Footer() {
  const t = await getTranslations();
  const cols = [
    {
      title: t("footer.categories"),
      links: (["hoodies", "jackets", "pants", "footwear", "accessories"] as const).map((c) => ({ href: `/shop/${c}`, label: t(`categories.${c}`) })),
    },
    {
      title: t("footer.information"),
      links: [
        { href: "/faq", label: t("footer.faq") },
        { href: "/size-guide", label: t("footer.sizeGuide") },
        { href: "/track", label: t("footer.trackOrder") },
        { href: "/size-finder", label: t("lab.sizeFinder") },
        { href: "/stylist", label: t("lab.stylist") },
        { href: "/fits/drip", label: "Drip fits" },
        { href: "/fits/clean", label: "Clean fits" },
        { href: "/fit-check", label: t("lab.fitCheck") },
        { href: "/wall", label: t("lab.wall") },
        { href: "/duel", label: "Hot or Not" },
        { href: "/crew", label: "Crew" },
        { href: "/live", label: "Live drop" },
        { href: "/status", label: "Status" },
        { href: "/contact", label: t("footer.contact") },
      ],
    },
    {
      title: t("footer.policies"),
      links: [
        { href: "/policies/exchange", label: t("footer.returns") },
        { href: "/policies/shipping", label: t("footer.shipping") },
        { href: "/policies/privacy", label: t("footer.privacy") },
        { href: "/policies/terms", label: t("footer.terms") },
      ],
    },
  ];

  return (
    <footer className="relative mt-24 overflow-hidden border-t border-ash bg-pitch pb-24">
      <div className="barbed" aria-hidden="true" />
      <div className="mx-auto grid max-w-[1500px] gap-12 px-4 py-14 md:px-8 lg:grid-cols-[1.2fr_1.3fr_2fr]">
        <div className="flex flex-col gap-5">
          <p className="chrome-text font-gothic text-7xl leading-none" dir="ltr">Sakr</p>
          <p className="max-w-xs text-sm leading-relaxed text-steel">{t("footer.aboutText")}</p>
          <ul className="flex flex-col gap-2 text-sm text-steel">
            <li>{t("footer.address")}</li>
            <li dir="ltr" className="text-start">{t("footer.phone")}</li>
            <li>
              <a href={`mailto:${t("footer.email")}`} className="hover:text-bone">{t("footer.email")}</a>
            </li>
          </ul>
          <ul className="flex gap-3">
            {SOCIALS.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  className="grid size-11 place-items-center rounded-full border border-iron text-steel transition-colors hover:border-bone hover:bg-smoke"
                >
                  <SocialIcon name={s.name} className="size-6" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <p className="street-heading text-2xl">{t("footer.join")}</p>
          <p className="text-sm text-steel">{t("footer.joinText")}</p>
          <JoinForm />
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {cols.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="street-heading mb-4 text-lg">{col.title}</p>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-steel uppercase transition-colors hover:text-chrome">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      <div className="mx-auto flex max-w-[1500px] flex-col gap-4 border-t border-ash px-4 pt-6 md:flex-row md:items-center md:justify-between md:px-8">
        <p className="text-xs text-dust">{t("footer.rights", { year: 2026 })}</p>
        <details className="text-xs text-dust">
          <summary className="cursor-pointer hover:text-steel">{t("footer.musicCredits")}</summary>
          <ul className="mt-2 grid max-h-40 gap-1 overflow-y-auto" dir="ltr">
            {tracks.map((tr) => (
              <li key={tr.src}>
                <a href={tr.sourceUrl} target="_blank" rel="noreferrer" className="hover:text-steel">
                  {tr.title} — {tr.artist}
                </a>{" "}
                · <a href={tr.license} target="_blank" rel="noreferrer" className="underline">license</a>
              </li>
            ))}
            <li>
              <a href="https://commons.wikimedia.org/wiki/File:Buteo_jamaicensis_-_Red-tailed_Hawk_XC71575.mp3" target="_blank" rel="noreferrer" className="hover:text-steel">Red-tailed Hawk call — Jonathon Jongsma</a>{" "}
              · <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noreferrer" className="underline">CC BY-SA 3.0</a>
            </li>
            <li>
              <a href="https://mixkit.co/free-stock-video/urban-man/" target="_blank" rel="noreferrer" className="hover:text-steel">Hero footage — Mixkit</a>{" "}
              · <a href="https://mixkit.co/license/#videoFree" target="_blank" rel="noreferrer" className="underline">Mixkit license</a>
            </li>
          </ul>
        </details>
        <div className="flex items-center gap-3">
          <span className="text-xs text-dust">{t("footer.securePayment")}</span>
          <PaymentIcons />
        </div>
      </div>
    </footer>
  );
}
