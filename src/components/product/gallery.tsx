"use client";

import { useState, ViewTransition } from "react";

export function Gallery({ images, title, slug }: { images: string[]; title: string; slug: string }) {
  const [active, setActive] = useState(0);
  if (!images.length) return <div className="aspect-square bg-tile" />;
  return (
    <div className="flex min-w-0 flex-col-reverse gap-3 md:flex-row md:items-start">
      {images.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto md:max-h-[560px] md:w-20 md:shrink-0 md:flex-col md:overflow-y-auto" aria-label={title}>
          {images.map((src, i) => (
            <li key={src} className="shrink-0">
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`${i + 1} / ${images.length}`}
                aria-current={i === active}
                className={`block size-16 overflow-hidden border bg-tile md:size-20 ${i === active ? "border-bone" : "border-transparent opacity-70 hover:opacity-100"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- remote CDN thumbnail */}
                <img src={src} alt="" className="size-full object-contain p-1 mix-blend-multiply" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <ViewTransition name={`p-${slug}`} share="auto">
      <div className="relative aspect-square min-w-0 flex-1 overflow-hidden bg-tile">
        {/* eslint-disable-next-line @next/next/no-img-element -- remote CDN image */}
        <img key={images[active]} src={images[active]} alt={title} className="size-full object-contain p-6 mix-blend-multiply md:p-10" style={{ animation: "fade-up 0.3s ease both" }} />
      </div>
      </ViewTransition>
    </div>
  );
}
