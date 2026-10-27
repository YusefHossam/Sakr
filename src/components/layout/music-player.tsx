"use client";

import { useTranslations } from "next-intl";
import { useMusic } from "@/components/providers/music-provider";
import { unlockAudio } from "@/lib/audio";

/** Small floating player: play/pause, next, and the track credit its license requires. */
export function MusicPlayer() {
  const t = useTranslations("music");
  const { track, playing, toggle, next } = useMusic();

  return (
    <div className="fixed bottom-4 start-4 z-50 flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-full border border-ash bg-pitch/85 py-1.5 ps-1.5 pe-4 backdrop-blur-md">
      <button
        type="button"
        onClick={() => {
          unlockAudio();
          toggle();
        }}
        aria-label={playing ? t("pause") : t("play")}
        className="grid size-9 place-items-center rounded-full bg-bone text-ink transition-transform hover:scale-105"
      >
        {playing ? (
          <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true"><path fill="currentColor" d="M7 5h4v14H7zm6 0h4v14h-4z" /></svg>
        ) : (
          <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7z" /></svg>
        )}
      </button>
      <button
        type="button"
        onClick={() => {
          unlockAudio();
          next();
        }}
        aria-label={t("next")}
        className="grid size-8 place-items-center rounded-full text-steel transition-colors hover:text-chrome"
      >
        <svg viewBox="0 0 24 24" className="size-4 rtl:-scale-x-100" aria-hidden="true"><path fill="currentColor" d="M6 5v14l9-7zm10 0h3v14h-3z" /></svg>
      </button>
      {playing && (
        <span className="flex h-4 items-end gap-0.5" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="w-0.5 origin-bottom bg-steel"
              style={{ height: "100%", animation: `eq 0.${6 + i}s ease-in-out ${i * 0.1}s infinite alternate` }}
            />
          ))}
        </span>
      )}
      {track && (
        <a
          href={track.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="truncate text-xs text-dust transition-colors hover:text-steel"
          title={`${track.title} — ${track.artist} · ${t("license")}: ${track.license}`}
          dir="ltr"
        >
          {t("credit", { title: track.title, artist: track.artist })}
        </a>
      )}
    </div>
  );
}
