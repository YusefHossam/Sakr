import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { JoinForm } from "./join-form";
import { PaymentIcons } from "./payment-icons";
import tracks from "../../../public/music/tracks.json";

const SOCIALS = [
  { label: "Instagram", href: "https://instagram.com", d: "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm5.5-1.5h.01" },
  { label: "TikTok", href: "https://tiktok.com", d: "M15 3c.4 2.5 2 4 4.5 4.2V10c-1.7 0-3.2-.5-4.5-1.4V15a6 6 0 1 1-6-6v2.9A3.1 3.1 0 1 0 12 15V3h3z" },
  { label: "Snapchat", href: "https://snapchat.com", d: "M12 3c3 0 5 2.2 5 5v2.2l1.6-.5c.6.2.6.9 0 1.2l-1.8.9c.5 1.6 1.7 2.8 3.2 3.3-.3.8-1.5 1-2.6 1.2-.2.6-.3 1.2-1 1.2-1 0-1.8-.5-3.4.6-.7.5-1.4.9-2 .9s-1.3-.4-2-.9c-1.6-1.1-2.4-.6-3.4-.6-.7 0-.8-.6-1-1.2-1.1-.2-2.3-.4-2.6-1.2 1.5-.5 2.7-1.7 3.2-3.3l-1.8-.9c-.6-.3-.6-1 0-1.2l1.6.5V8c0-2.8 2-5 5-5z" },
  { label: "X", href: "https://x.com", d: "M4 4l16 16M20 4 4 20" },
];

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
        { href: "/wall", label: t("lab.wall") },
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
                  className="grid size-11 place-items-center rounded-full border border-iron text-steel transition-colors hover:border-bone hover:text-chrome"
                >
                  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={s.d} />
                  </svg>
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
