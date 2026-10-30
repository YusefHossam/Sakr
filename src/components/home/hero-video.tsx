"use client";

import { useEffect, useState } from "react";

// Free-licence clips from Mixkit (mixkit.co): street style, dancing, walking. Credited in the footer.
const CLIPS = ["2146", "47497", "1236", "3626", "349", "3624"];

/** Street-style footage looping behind the wordmark. Skipped for reduced motion and data-saver; the poster wall stays underneath. */
export function HeroVideo() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    const slow = conn?.saveData || /(^|-)2g|3g/.test(conn?.effectiveType ?? "");
    // Phones keep the light poster wall: the footage is a desktop extra.
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || matchMedia("(max-width: 767px)").matches || slow) return;
    // Start only after the page has fully loaded and the browser is idle, so the video never slows the first paint.
    let t: ReturnType<typeof setTimeout> | undefined;
    const start = () => {
      t = setTimeout(() => setEnabled(true), 1200);
    };
    if (document.readyState === "complete") start();
    else addEventListener("load", start, { once: true });
    return () => {
      removeEventListener("load", start);
      clearTimeout(t);
    };
  }, []);

  if (!enabled) return null;
  return (
    <video
      key={CLIPS[index]}
      src={`/hero/${CLIPS[index]}.mp4`}
      autoPlay
      muted
      playsInline
      preload="metadata"
      aria-hidden="true"
      onPlaying={() => setPlaying(true)}
      onEnded={() => {
        setPlaying(false);
        setIndex((i) => (i + 1) % CLIPS.length);
      }}
      onError={() => setIndex((i) => (i + 1) % CLIPS.length)}
      className={`absolute inset-0 -z-10 size-full object-cover grayscale-[0.35] contrast-125 transition-opacity duration-1000 ${playing ? "opacity-60" : "opacity-0"}`}
    />
  );
}
