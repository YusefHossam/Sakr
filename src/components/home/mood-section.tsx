import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { MOOD_KEYS, MOODS } from "@/lib/moods";
import { Section } from "./section";

/** "Pick your mood": four tastes that filter and tint the whole store. */
export async function MoodSection() {
  const locale = (await getLocale()) === "ar" ? "ar" : "en";
  return (
    <Section title={locale === "ar" ? "اختار مودك" : "Pick your mood"} text={locale === "ar" ? "اختار ستايلك والموقع كله يتلوّن ويتفلتر عليه." : "Choose a taste and the whole store re-tints and re-filters."}>
      <ul className="grid border-s border-t border-ash sm:grid-cols-2 lg:grid-cols-4">
        {MOOD_KEYS.map((m) => (
          <li key={m} className="border-e border-b border-ash">
            <Link href={`/moods/${m}`} className="group flex h-full min-h-44 flex-col justify-between gap-6 p-6 transition-colors hover:bg-smoke">
              <span className="street-heading text-3xl transition-colors group-hover:text-chrome" dir="auto">{MOODS[m][locale]}</span>
              <span className="text-xs leading-relaxed text-steel">{MOODS[m].tagline[locale]}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
