"use client";

import { createContext, use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import tracks from "../../../public/music/tracks.json";

export type Track = (typeof tracks)[number];

type MusicContextValue = {
  track: Track | null;
  playing: boolean;
  /** Starts a random track. Call from a click so the browser allows sound. */
  start: () => void;
  toggle: () => void;
  next: () => void;
};

const MusicContext = createContext<MusicContextValue | null>(null);
const VOLUME = 0.45;

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [index, setIndex] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);

  const nextRef = useRef<() => void>(() => {});

  const load = useCallback((i: number) => {
    let el = audio.current;
    if (!el) {
      el = audio.current = new Audio();
      // Roll on to another track when one ends.
      el.addEventListener("ended", () => nextRef.current());
    }
    el.src = tracks[i].src;
    el.volume = VOLUME;
    setIndex(i);
    el.play().then(
      () => setPlaying(true),
      () => setPlaying(false),
    );
  }, []);

  const start = useCallback(() => {
    if (audio.current && !audio.current.paused) return;
    load(Math.floor(Math.random() * tracks.length));
  }, [load]);

  const next = useCallback(() => {
    load(index === null ? 0 : (index + 1) % tracks.length);
  }, [index, load]);

  const toggle = useCallback(() => {
    const el = audio.current;
    if (!el || index === null) return start();
    if (el.paused) void el.play().then(() => setPlaying(true));
    else {
      el.pause();
      setPlaying(false);
    }
  }, [index, start]);

  useEffect(() => {
    nextRef.current = next;
  }, [next]);

  const value = useMemo(
    () => ({ track: index === null ? null : tracks[index], playing, start, toggle, next }),
    [index, playing, start, toggle, next],
  );
  return <MusicContext value={value}>{children}</MusicContext>;
}

export function useMusic(): MusicContextValue {
  const value = use(MusicContext);
  if (!value) throw new Error("useMusic must be used inside <MusicProvider>");
  return value;
}

export { tracks };
