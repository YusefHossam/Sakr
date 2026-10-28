"use client";

import { useEffect } from "react";
import { MOOD_STORAGE_KEY, type Mood } from "@/lib/moods";

/** Applies a mood's tint to the whole site and remembers it. Pass null to go back to the default look. */
export function MoodTint({ mood }: { mood: Mood | null }) {
  useEffect(() => {
    const root = document.documentElement;
    if (mood) root.dataset.mood = mood;
    else delete root.dataset.mood;
    try {
      if (mood) localStorage.setItem(MOOD_STORAGE_KEY, mood);
      else localStorage.removeItem(MOOD_STORAGE_KEY);
    } catch {
      /* private mode: the tint just won't persist */
    }
  }, [mood]);
  return null;
}

/** Back to the default look. */
export function MoodOffButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        delete document.documentElement.dataset.mood;
        try {
          localStorage.removeItem(MOOD_STORAGE_KEY);
        } catch {
          /* ignore */
        }
      }}
      className="border border-ash px-3 py-1.5 text-xs text-steel transition-colors hover:text-bone"
    >
      {label}
    </button>
  );
}
