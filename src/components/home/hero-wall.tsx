"use client";

import { useEffect, useState } from "react";
import { sized } from "@/lib/img";

/**
 * The drifting poster wall behind the wordmark. It is decoration, so its photos load only after the page has
 * finished loading: the wordmark paints first and stays the page's largest paint.
 */
export function HeroWall({ images }: { images: string[] }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Phones skip the wall: the wordmark, falcon and smoke carry the hero without 30 extra photos.
    if (matchMedia("(max-width: 767px)").matches) return;
    let t: ReturnType<typeof setTimeout> | undefined;
    const start = () => {
      t = setTimeout(() => setShow(true), 300);
    };
    if (document.readyState === "complete") start();
    else addEventListener("load", start, { once: true });
    return () => {
      removeEventListener("load", start);
      clearTimeout(t);
    };
  }, []);

  const rows = [0, 1, 2].map((r) => images.filter((_, i) => i % 3 === r));
  return (
    <div
      className={`absolute inset-0 -z-10 flex -rotate-6 scale-125 flex-col justify-center gap-4 transition-opacity duration-1000 ${show ? "opacity-[0.18]" : "opacity-0"}`}
      aria-hidden="true"
      dir="ltr"
    >
      {show &&
        rows.map((row, r) => (
          <div key={r} className={`flex w-max gap-4 will-change-transform ${r === 1 ? "animate-drift-reverse" : "animate-drift"}`}>
            {[...row, ...row].map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element -- decorative CDN images
              <img key={i} src={sized(src, 240) ?? src} alt="" decoding="async" fetchPriority="low" loading="lazy" className="h-[24vh] w-[24vh] shrink-0 bg-smoke object-contain p-3" />
            ))}
          </div>
        ))}
    </div>
  );
}
