"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { joinList } from "@/lib/actions/drop";

export function JoinForm() {
  const t = useTranslations("footer");
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const contact = String(new FormData(e.currentTarget).get("email") ?? "");
        startTransition(async () => {
          const res = await joinList({ contact, channel: "email", source: "footer" });
          setDone(res.ok);
        });
      }}
    >
      <label htmlFor="join-email" className="sr-only">
        {t("emailPlaceholder")}
      </label>
      <input
        id="join-email"
        name="email"
        type="email"
        required
        placeholder={t("emailPlaceholder")}
        className="w-full rounded-md border border-ash bg-smoke px-4 py-3 text-sm text-bone placeholder:text-dust focus:border-steel focus:outline-none"
      />
      <button
        type="submit"
        disabled={done || pending}
        className="self-start rounded-md border border-bone/70 px-6 py-2.5 font-display text-sm tracking-[0.3em] text-bone uppercase transition-colors hover:bg-bone hover:text-ink disabled:opacity-60"
      >
        {done ? "✓" : t("joinButton")}
      </button>
    </form>
  );
}
