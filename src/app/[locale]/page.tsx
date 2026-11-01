import { getLocale, getTranslations } from "next-intl/server";
import { AdCarousel, type AdSlide } from "@/components/home/ad-carousel";
import { ColorwaySpotlight } from "@/components/home/colorway-spotlight";
import { ForYou } from "@/components/home/for-you";
import { Hero } from "@/components/home/hero";
import { CrowdSection } from "@/components/home/crowd-section";
import { LabSection } from "@/components/home/lab-section";
import { MoodSection } from "@/components/home/mood-section";
import { Section } from "@/components/home/section";
import { ProductCard } from "@/components/product/product-card";
import { Link } from "@/i18n/navigation";
import { getSettings } from "@/lib/settings";
import { getHeroImages, getLastPieces, getModelSpotlight, getNewIn } from "@/lib/catalog";
import { SECTION_DEF, SECTIONS } from "@/lib/sections";

export default async function HomePage() {
  const [t, locale, heroImages, lastPieces, spotlight, newIn, settings] = await Promise.all([
    getTranslations("home"),
    getLocale(),
    getHeroImages(),
    getLastPieces(8),
    getModelSpotlight(),
    getNewIn(12),
    getSettings(),
  ]);

  // Running promotions, discounts first (BR-61).
  // Banners set in Admin → Content lead the automatic ones.
  const slides: AdSlide[] = settings.banners
    .filter((b) => b.active && b.title)
    .map((b, i) => ({ id: `custom-${i}`, eyebrow: "SAKR", title: b.title, text: b.text, href: b.href, images: b.image ? [b.image] : [], hot: false }));
  if (lastPieces.total) {
    slides.push({
      id: "last-pieces",
      eyebrow: t("adsLabel"),
      title: t("adLastPiecesTitle"),
      text: t("adLastPiecesText", { count: lastPieces.total }),
      href: "/shop?sale=last-pieces",
      images: lastPieces.items.map((p) => p.image).filter((x): x is string => !!x),
      hot: true,
    });
  }
  if (spotlight) {
    slides.push({
      id: "model",
      eyebrow: spotlight.brand,
      title: t("adModelTitle", { model: spotlight.model }),
      text: t("adModelText", { count: spotlight.colorways.length }),
      href: `/models/${spotlight.modelKey}`,
      images: spotlight.colorways.slice(0, 4).map((p) => p.image).filter((x): x is string => !!x),
    });
  }
  return (
    <>
      <Hero images={heroImages} />

      <div className="mt-10">
        <AdCarousel slides={slides} />
      </div>

      {lastPieces.items.length > 0 && (
        <Section title={t("lastPiecesTitle")} text={t("lastPiecesText")} href="/shop?sale=last-pieces" linkLabel={`${lastPieces.total}`}>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
            {lastPieces.items.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </Section>
      )}

      <ForYou title={t("forYou")} />

      <MoodSection />

      <LabSection />
      <CrowdSection />

      {spotlight && (
        <Section title={t("spotlightTitle")} text={t("spotlightText")}>
          <ColorwaySpotlight spotlight={spotlight} />
        </Section>
      )}

      <Section title={locale === "ar" ? "تسوّق حسب القسم" : "Shop by section"}>
        <ul className="grid grid-cols-2 border-s border-t border-ash sm:grid-cols-4 lg:grid-cols-7">
          {SECTIONS.map((s) => (
            <li key={s} className="border-e border-b border-ash">
              <Link href={`/shop/${s}`} className="glitch-hover flex aspect-[4/3] items-center justify-center p-4 text-center transition-colors hover:bg-smoke">
                <span className="street-heading text-lg leading-tight md:text-xl">{SECTION_DEF[s].label[locale === "ar" ? "ar" : "en"]}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section title={t("newInTitle")} href="/shop" linkLabel="SHOP">
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 lg:grid-cols-6">
          {newIn.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </Section>
    </>
  );
}
