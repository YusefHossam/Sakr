import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

const TOOLS = [
  ["/size-finder", "sizeFinder", "📏"],
  ["/stylist", "stylist", "✦"],
  ["/fit-builder", "fitBuilder", "◫"],
  ["/mystery-box", "mystery", "?"],
  ["/wall", "wall", "✎"],
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
      <ul className="grid gap-px bg-ash sm:grid-cols-2 lg:grid-cols-5">
        {TOOLS.map(([href, key, icon]) => (
          <li key={key} className="bg-ink">
            <Link href={href} className="group flex h-full flex-col gap-3 p-6 transition-colors hover:bg-smoke">
              <span className="font-gothic text-5xl text-chrome transition-transform group-hover:scale-110" aria-hidden="true">{icon}</span>
              <span className="street-heading text-2xl">{t(key)}</span>
              <span className="text-xs leading-relaxed text-steel">{t(`${key}Text`)}</span>
              <span className="mt-auto text-xs tracking-[0.3em] text-bone uppercase">{t("open")} →</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
