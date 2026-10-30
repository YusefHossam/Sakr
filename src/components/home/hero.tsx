import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Falcon3D } from "./falcon-3d";
import { HeroVideo } from "./hero-video";
import { HeroWall } from "./hero-wall";

/**
 * Poster-wall hero: rows of product shots drifting behind a smoke layer and the chrome wordmark.
 * Street-style footage plays over the wall (HeroVideo); real AI model videos can replace it later (BR-03).
 */
export async function Hero({ images }: { images: string[] }) {
  const t = await getTranslations("home");

  return (
    <section className="relative isolate -mt-[76px] lg:-mt-[118px] flex min-h-[100svh] items-center justify-center overflow-hidden">
      <HeroWall images={images} />
      <HeroVideo />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,transparent_0%,#000_75%)]" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-gradient-to-t from-ink to-transparent" aria-hidden="true" />
      <div className="smoke-layer -z-10" aria-hidden="true" />

      <div className="flex flex-col items-center gap-6 px-4 pt-24 text-center">
        <Falcon3D />
        <h1 className="chrome-text font-gothic text-[clamp(5rem,18vw,12rem)] leading-[0.85]" dir="ltr">
          Sakr
        </h1>
        <Link href="/shop" className="group flex flex-col items-center gap-3 text-sm tracking-[0.6em] text-steel transition-colors hover:text-chrome" dir="ltr">
          <span className="h-14 w-px bg-gradient-to-b from-transparent to-bone/60 transition-all duration-500 group-hover:h-20" aria-hidden="true" />
          {t("heroEnter")}
        </Link>
      </div>
    </section>
  );
}
