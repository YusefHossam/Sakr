import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/**
 * Poster-wall hero: rows of product shots drifting behind a smoke layer and the chrome wordmark.
 * TODO(videos): swap the wall for the AI model videos once they exist (BR-03).
 */
export async function Hero({ images }: { images: string[] }) {
  const t = await getTranslations("home");
  const rows = [0, 1, 2].map((r) => images.filter((_, i) => i % 3 === r));

  return (
    <section className="relative isolate -mt-[76px] lg:-mt-[118px] flex min-h-[100svh] items-center justify-center overflow-hidden">
      <div className="absolute inset-0 -z-10 flex -rotate-6 scale-125 flex-col justify-center gap-4 opacity-[0.22] grayscale" aria-hidden="true" dir="ltr">
        {rows.map((row, r) => (
          <div key={r} className={`flex w-max gap-4 ${r === 1 ? "animate-drift-reverse" : "animate-drift"}`}>
            {[...row, ...row].map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element -- decorative CDN images
              <img key={i} src={src} alt="" className="h-[24vh] w-[24vh] shrink-0 bg-smoke object-contain p-3" loading={i < 6 ? "eager" : "lazy"} />
            ))}
          </div>
        ))}
      </div>
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,transparent_0%,#000_75%)]" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-gradient-to-t from-ink to-transparent" aria-hidden="true" />
      <div className="smoke-layer -z-10" aria-hidden="true" />

      <div className="flex flex-col items-center gap-10 px-4 pt-24 text-center">
        <h1 className="chrome-text font-gothic text-[clamp(6rem,24vw,16rem)] leading-[0.85]" dir="ltr">
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
