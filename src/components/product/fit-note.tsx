import { getLocale } from "next-intl/server";
import { fitNote } from "@/lib/fit-notes";

/** How this brand usually cuts, from the SAKR fit guide. */
export async function FitNote({ brandSlug, category }: { brandSlug: string; category: string }) {
  if (category === "accessories") return null;
  const locale = (await getLocale()) === "ar" ? "ar" : "en";
  const note = fitNote(brandSlug, locale);
  if (!note) return null;
  return (
    <p className="flex flex-col gap-1 border border-ash px-4 py-3 text-xs text-steel">
      <span className="tracking-[0.2em] text-dust uppercase">{locale === "ar" ? "دليل المقاس" : "Fit guide"}</span>
      <span>{note}</span>
    </p>
  );
}
