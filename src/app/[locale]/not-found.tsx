import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const ar = (await getLocale()) === "ar";
  return (
    <div className="mx-auto flex min-h-[60svh] max-w-xl flex-col items-center justify-center gap-6 px-4 text-center">
      <p className="chrome-text font-gothic text-[clamp(5rem,20vw,9rem)] leading-none" dir="ltr">404</p>
      <h1 className="street-heading text-3xl">{ar ? "ضيّعت الطريق يا كبير" : "Wrong turn"}</h1>
      <p className="text-sm leading-relaxed text-steel">
        {ar ? "الصفحة دي مش موجودة. يا اللينك غلط، يا القطعة خلصت ونزلت من الموقع." : "That page isn't here. Either the link is off or the piece sold out and came down."}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/" className="border border-bone/70 px-6 py-3 text-xs tracking-[0.3em] text-bone uppercase hover:bg-bone hover:text-ink">{ar ? "ارجع للرئيسية" : "Back home"}</Link>
        <Link href="/shop" className="border border-ash px-6 py-3 text-xs tracking-[0.3em] text-steel uppercase hover:text-bone">{ar ? "شوف الدروب" : "See the drops"}</Link>
      </div>
    </div>
  );
}
