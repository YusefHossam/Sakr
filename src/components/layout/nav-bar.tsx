"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { SECTION_DEF, SECTIONS, type Section } from "@/lib/sections";
import { Logo } from "./logo";
import { CurrencyMenu, LanguageSwitch } from "./region-menu";

type MenuKey = Section;

const Icon = ({ d, label }: { d: string; label?: string }) => (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden={label ? undefined : true} role={label ? "img" : undefined} aria-label={label}>
    <path d={d} />
  </svg>
);
const ICONS = {
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm10 2-4.35-4.35",
  user: "M20 21a8 8 0 1 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10z",
  bag: "M6 7h12l1 14H5L6 7zm3 0a3 3 0 0 1 6 0",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6 6 18",
  chevron: "m6 9 6 6 6-6",
};

export function NavBar({ cartBadge }: { cartBadge?: React.ReactNode }) {
  const t = useTranslations();
  const lang = useLocale() === "ar" ? "ar" : "en";
  const name = (s: Section) => SECTION_DEF[s].label[lang];
  const [open, setOpen] = useState<MenuKey | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Close menus when a link inside them is followed (no usePathname: it would make every page wait on the URL).
  const closeOnLink = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("a")) {
      setOpen(null);
      setDrawer(false);
    }
  };

  // Shrink the bar once the page scrolls.
  useEffect(() => {
    const onScroll = () => setScrolled(scrollY > 24);
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
        scrolled || open ? "border-ash bg-ink/90 backdrop-blur-md" : "border-transparent bg-gradient-to-b from-ink to-transparent"
      }`}
      onMouseLeave={() => setOpen(null)}
      onClick={closeOnLink}
    >
      <div className="mx-auto flex max-w-[1500px] items-center gap-4 px-4 py-3 md:px-8">
        <button
          type="button"
          className="text-steel hover:text-chrome lg:hidden"
          onClick={() => setDrawer(true)}
          aria-label={t("header.openMenu")}
          aria-expanded={drawer}
        >
          <Icon d={ICONS.menu} />
        </button>

        <Logo className={`transition-[font-size] duration-300 ${scrolled ? "text-4xl" : "text-5xl"}`} />

        <div className="ms-auto flex items-center gap-3">
          <Link href="/search" aria-label={t("header.search")} className="text-steel hover:text-chrome">
            <Icon d={ICONS.search} />
          </Link>
          <div className="hidden items-center gap-2 sm:flex">
            <LanguageSwitch />
            <CurrencyMenu />
          </div>
          <Link href="/account" aria-label={t("header.account")} className="text-steel hover:text-chrome">
            <Icon d={ICONS.user} />
          </Link>
          <Link href="/cart" aria-label={t("header.cart")} className="relative text-steel hover:text-chrome">
            <Icon d={ICONS.bag} />
            {cartBadge}
          </Link>
        </div>
      </div>

      {/* Second row on desktop: the category bar, centred under the logo row. */}
      <div className="mx-auto hidden max-w-[1500px] px-8 pb-1 lg:block">
        <nav aria-label="Main" className="flex justify-center">
          <ul className="flex items-center gap-1 xl:gap-2">
            {SECTIONS.map((key) => (
              <li key={key}>
                <button
                  type="button"
                  onMouseEnter={() => setOpen(key)}
                  onFocus={() => setOpen(key)}
                  onClick={() => setOpen(open === key ? null : key)}
                  aria-expanded={open === key}
                  className={`glitch-hover flex items-center gap-1 px-2 py-2 font-display text-[13px] tracking-[0.14em] uppercase transition-colors xl:text-sm ${
                    open === key ? "text-chrome" : "text-steel hover:text-bone"
                  }`}
                >
                  {name(key)}
                </button>
              </li>
            ))}
            <li>
              <Link href="/shop" className="px-2 py-2 font-display text-[13px] tracking-[0.14em] text-blood uppercase hover:text-chrome xl:text-sm">
                {t("categories.shopAll")}
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* Desktop mega menu */}
      {open && (
        <div className="absolute inset-x-0 top-full hidden border-b border-ash bg-ink/95 backdrop-blur-md lg:block" style={{ animation: "fade-up 0.2s ease both" }}>
          <div className="mx-auto grid max-w-[1500px] grid-cols-[220px_1fr] gap-10 px-8 py-8">
            <div className="flex flex-col gap-3">
              <p className="street-heading text-4xl">{name(open)}</p>
              <Link href={`/shop/${open}`} className="text-sm text-steel underline-offset-4 hover:text-chrome hover:underline">
                {t("header.allIn", { category: name(open) })} →
              </Link>
            </div>
            <div className="grid grid-cols-4 gap-x-8 gap-y-2 xl:grid-cols-5">
              {SECTION_DEF[open].types.map((type) => (
                <Link key={type.key} href={`/shop/${open}?type=${type.key}`} className="py-1 text-sm text-bone hover:text-chrome">
                  {type.label[lang]}
                </Link>
              ))}
            </div>
          </div>
          <div className="barbed" aria-hidden="true" />
        </div>
      )}

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-[65] lg:hidden" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0 bg-ink/70" onClick={() => setDrawer(false)} aria-label={t("header.closeMenu")} />
          <div className="absolute inset-y-0 start-0 flex w-[86vw] max-w-sm flex-col overflow-y-auto border-e border-ash bg-pitch p-5">
            <div className="mb-6 flex items-center justify-between">
              <Logo className="text-5xl" />
              <button type="button" onClick={() => setDrawer(false)} aria-label={t("header.closeMenu")} className="text-steel">
                <Icon d={ICONS.close} />
              </button>
            </div>
            <div className="mb-4 flex items-center gap-2 sm:hidden">
              <LanguageSwitch />
              <CurrencyMenu />
            </div>
            <ul className="flex flex-col divide-y divide-ash">
              {SECTIONS.map((key) => (
                <li key={key}>
                  <details className="group py-1">
                    <summary className="flex cursor-pointer list-none items-center justify-between py-2.5 font-display text-lg tracking-[0.12em] text-bone uppercase">
                      {name(key)}
                      <span className="text-dust transition-transform group-open:rotate-180">
                        <Icon d={ICONS.chevron} />
                      </span>
                    </summary>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 pb-3">
                      <Link href={`/shop/${key}`} className="col-span-2 py-1 text-sm text-bone">{t("header.allIn", { category: name(key) })}</Link>
                      {SECTION_DEF[key].types.map((type) => (
                        <Link key={type.key} href={`/shop/${key}?type=${type.key}`} className="py-1 text-sm text-steel">
                          {type.label[lang]}
                        </Link>
                      ))}
                    </div>
                  </details>
                </li>
              ))}
              <li>
                <Link href="/shop" className="block py-3.5 font-display text-lg tracking-[0.12em] text-blood uppercase">
                  {t("categories.shopAll")}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      )}
    </header>
  );
}
