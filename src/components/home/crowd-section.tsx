import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

const ITEMS = [
  { href: "/duel", ar: "هوت أو نوت", en: "Hot or Not", textAr: "فيتسين قدام بعض. اختار الأحلى وشوف فيت الأسبوع.", textEn: "Two fits head to head. Pick the hotter one and see the fit of the week." },
  { href: "/crew", ar: "الكرو", en: "Crew mode", textAr: "لمّ صحابك. كل ما تصرفوا مع بعض، خصم أكبر لكل واحد.", textEn: "Gather your friends. The more you spend together, the bigger everyone's discount." },
  { href: "/live", ar: "لايف دروب", en: "Live drop", textAr: "بث مباشر وشات وزرار شراء على القطع وقت ما بتنزل.", textEn: "A live stream, chat and a buy button on the pieces as they drop." },
] as const;

/** Community features: duel, crew, live. */
export async function CrowdSection() {
  const ar = (await getLocale()) === "ar";
  return (
    <section className="mx-auto mt-24 max-w-[1500px] px-4 md:px-8">
      <div className="mb-8 flex flex-col gap-2 border-b border-ash pb-4">
        <h2 className="street-heading text-[clamp(2rem,5vw,3.75rem)] leading-none">{ar ? "الشارع" : "The crowd"}</h2>
        <p className="text-sm text-steel">{ar ? "صوّت، كوّن كرو، وتفرّج على الدروب لايف." : "Vote, build a crew, watch drops live."}</p>
      </div>
      <ul className="grid border-s border-t border-ash sm:grid-cols-3">
        {ITEMS.map((it) => (
          <li key={it.href} className="border-e border-b border-ash">
            <Link href={it.href} className="group flex h-full flex-col gap-3 p-6 transition-colors hover:bg-smoke">
              <span className="street-heading text-2xl" dir="auto">{ar ? it.ar : it.en}</span>
              <span className="text-xs leading-relaxed text-steel">{ar ? it.textAr : it.textEn}</span>
              <span className="mt-auto text-xs tracking-[0.3em] text-bone uppercase">
                {ar ? "افتح" : "Open"} <span className="inline-block rtl:-scale-x-100" aria-hidden="true">→</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
