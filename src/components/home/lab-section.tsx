import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

// Stroke icons (no emoji, so they match the rest of the site).
const ICONS = {
  sizeFinder: "M4 20 20 4m-3 0h3v3M7 20H4v-3M9 15l-2-2m5-1-2-2m5-1-2-2",
  stylist: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z",
  fitBuilder: "M9 3h6l1 3 4 2-2 4-2-1v10H8V11l-2 1-2-4 4-2z",
  mystery: "M3 8l9-5 9 5v8l-9 5-9-5zM3 8l9 5 9-5M12 13v8M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3",
  wall: "M3 21h18M5 21V9m14 12V9M3 9h18M8 9V5h8v4M10 13h4m-6 4h8",
} as const;

const TOOLS = [
  ["/size-finder", "sizeFinder"],
  ["/stylist", "stylist"],
  ["/fit-builder", "fitBuilder"],
  ["/mystery-box", "mystery"],
  ["/wall", "wall"],
] as const;

/** "The Lab": entry points to the tools no other store has. */
export async function LabSection() {
  const t = await getTranslations("lab");
  return (
    <section className="mx-auto mt-24 max-w-[1500px] px-4 md:px-8">
      <div className="mb-8 flex flex-col gap-2 border-b border-ash pb-4">
        <h2 className="street-heading text-[clamp(2rem,5vw,3.75rem)] leading-none">{t("title")}</h2>
        <p className="text-sm text-steel">{t("text")}</p>
      </div>
      <ul className="grid border-s border-t border-ash sm:grid-cols-2 lg:grid-cols-5">
        {TOOLS.map(([href, key]) => (
          <li key={key} className="border-e border-b border-ash">
            <Link href={href} className="group flex h-full flex-col gap-3 p-6 transition-colors hover:bg-smoke">
              <svg viewBox="0 0 24 24" className="h-10 w-10 text-chrome transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={ICONS[key]} />
              </svg>
              <span className="street-heading text-2xl" dir="auto">{t(key)}</span>
              <span className="text-xs leading-relaxed text-steel">{t(`${key}Text`)}</span>
              <span className="mt-auto text-xs tracking-[0.3em] text-bone uppercase">
                {t("open")} <span className="inline-block rtl:-scale-x-100" aria-hidden="true">→</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
