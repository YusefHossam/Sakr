"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

// TODO(phase 7): save signups to the database for drop alerts. For now it only confirms locally.
export function JoinForm() {
  const t = useTranslations("footer");
  const [done, setDone] = useState(false);
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        setDone(true);
      }}
    >
      <label htmlFor="join-email" className="sr-only">
        {t("emailPlaceholder")}
      </label>
      <input
        id="join-email"
        type="email"
        required
        placeholder={t("emailPlaceholder")}
        className="w-full rounded-md border border-ash bg-smoke px-4 py-3 text-sm text-bone placeholder:text-dust focus:border-steel focus:outline-none"
      />
      <button
        type="submit"
        disabled={done}
        className="self-start rounded-md border border-bone/70 px-6 py-2.5 font-display text-sm tracking-[0.3em] text-bone uppercase transition-colors hover:bg-bone hover:text-ink disabled:opacity-60"
      >
        {done ? "✓" : t("joinButton")}
      </button>
    </form>
  );
}
