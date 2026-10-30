"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useMusic } from "@/components/providers/music-provider";
import { playScreech, unlockAudio } from "@/lib/audio";
import { INTRO_KEY } from "@/lib/constants";

/**
 * Full-screen intro: the chrome logo burns in (~2s), then ENTER. The click is what lets the browser
 * play sound, so it starts the music too. Shown once per browser session; an inline script in the
 * layout hides it before paint for visitors who already entered (no flash).
 */
export function Intro() {
  const t = useTranslations("intro");
  const music = useMusic();
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);

  // Switching language swaps the root layout, so the pre-paint script doesn't rerun; check here too.
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from browser storage
      if (sessionStorage.getItem(INTRO_KEY)) setGone(true);
    } catch {}
  }, []);

  function enter() {
    unlockAudio();
    music.start();
    playScreech(1);
    try {
      sessionStorage.setItem(INTRO_KEY, "1");
    } catch {}
    setLeaving(true);
    setTimeout(() => setGone(true), 800);
  }

  if (gone) return null;

  return (
    <div
      data-intro
      role="dialog"
      aria-modal="true"
      aria-label="SAKR"
      className={`fixed inset-0 z-[70] flex flex-col items-center justify-center overflow-hidden bg-ink transition-[opacity,transform] duration-700 ${
        leaving ? "pointer-events-none scale-110 opacity-0" : "opacity-100"
      }`}
    >
      <div className="smoke-layer" aria-hidden="true" />
      <div className="relative flex flex-col items-center gap-3">
        <p
          className="chrome-text font-gothic text-[clamp(5.5rem,22vw,13rem)] leading-none"
          style={{ animation: "intro-in 1.6s cubic-bezier(.2,.7,.2,1) both, shine 4.5s ease-in-out 1.2s infinite" }}
          dir="ltr"
        >
          Sakr
        </p>
        <p
          className="text-[11px] text-steel uppercase"
          style={{ animation: "intro-tag 1.2s ease 0.9s both" }}
          dir="ltr"
        >
          Cairo · Est 2026
        </p>
        <button
          type="button"
          onClick={enter}
          autoFocus
          className="mt-10 rounded-full border border-bone/60 px-10 py-3 font-display text-lg tracking-[0.4em] text-bone uppercase transition-colors hover:bg-bone hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bone"
          style={{ animation: "fade-up 0.6s ease 1.8s both, pulse-ring 1.8s ease-out 2.4s infinite" }}
        >
          {t("enter")}
        </button>
        <p className="text-[11px] tracking-[0.3em] text-dust uppercase" style={{ animation: "fade-up 0.6s ease 2s both" }}>
          ♪ {t("hint")}
        </p>
      </div>
    </div>
  );
}
