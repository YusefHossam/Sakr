import { getLocale } from "next-intl/server";
import { Section } from "@/components/home/section";
import { getGoesWith } from "@/lib/catalog";
import { REASON_TEXT } from "@/lib/style";
import { ProductCard } from "./product-card";

/** "Goes with this": pieces the style engine says suit the one on the page, each with the reason. */
export async function GoesWith({ slug }: { slug: string }) {
  const [locale, picks] = await Promise.all([getLocale(), getGoesWith(slug)]);
  if (!picks.length) return null;
  const lang = locale === "ar" ? "ar" : "en";
  return (
    <Section
      title={lang === "ar" ? "بيليق معاه" : "Goes with this"}
      text={lang === "ar" ? "مختارين على أساس القصّة واللون والمود، مش عشوائي." : "Picked for cut, colour and mood, not at random."}
    >
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
        {picks.map(({ card, why }) => (
          <div key={card.slug} className="flex flex-col gap-3">
            <ProductCard product={card} />
            {why.length > 0 && (
              <ul className="flex flex-col gap-1 border-s-2 border-iron ps-3 text-[11px] leading-relaxed text-steel">
                {why.slice(0, 2).map((k) => (
                  <li key={k} className={k.startsWith("pick") ? "text-bone" : ""}>{REASON_TEXT[k][lang]}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}
