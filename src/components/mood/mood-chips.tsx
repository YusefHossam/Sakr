import { getLocale } from "next-intl/server";
import { MoodOffButton } from "@/components/mood/mood-tint";
import { Link } from "@/i18n/navigation";
import { MOOD_KEYS, MOODS, type Mood } from "@/lib/moods";

/** The four moods as links, with a way back to the default look. */
export async function MoodChips({ active, base = "moods" }: { active?: Mood; base?: "moods" | "fits" }) {
  const locale = (await getLocale()) === "ar" ? "ar" : "en";
  return (
    <div className="flex flex-wrap items-center gap-2" role="navigation" aria-label="Mood">
      {MOOD_KEYS.map((m) => (
        <Link
          key={m}
          href={`/${base}/${m}`}
          className={`border px-4 py-2 text-sm transition-colors ${active === m ? "border-bone bg-bone text-ink" : "border-ash text-steel hover:border-dust hover:text-bone"}`}
        >
          {MOODS[m][locale]}
        </Link>
      ))}
      <MoodOffButton label={locale === "ar" ? "الشكل العادي" : "Default look"} />
    </div>
  );
}
