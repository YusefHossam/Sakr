"use client";

import { useState, useTransition } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { claimCrewTier, createCrew, joinCrew, leaveCrew } from "@/lib/actions/social";

const field = "min-h-11 border border-ash bg-smoke px-3 text-bone placeholder:text-dust";
const btn = "min-h-11 border border-bone/70 px-6 font-display tracking-[0.25em] text-bone uppercase hover:bg-bone hover:text-ink disabled:opacity-60";

export function CrewStart() {
  const ar = useLocale() === "ar";
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const errors: Record<string, string> = ar
    ? { name: "الاسم من حرفين لـ 24", already: "إنت في كرو بالفعل", missing: "الكود ده مش موجود", full: "الكرو ده اتملى", login: "سجّل دخول الأول" }
    : { name: "Name must be 2 to 24 characters", already: "You're already in a crew", missing: "That code doesn't exist", full: "That crew is full", login: "Log in first" };

  const run = (fn: () => ReturnType<typeof createCrew>) =>
    startTransition(async () => {
      const res = await fn();
      if (res.ok) router.refresh();
      else setError(errors[res.error] ?? res.error);
    });

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); run(() => createCrew(String(new FormData(e.currentTarget).get("name") ?? ""))); }}>
        <h2 className="street-heading text-2xl">{ar ? "اعمل كرو" : "Start a crew"}</h2>
        <input name="name" maxLength={24} placeholder={ar ? "اسم الكرو" : "Crew name"} className={field} />
        <button type="submit" disabled={pending} className={btn}>{ar ? "ابدأ" : "Start"}</button>
      </form>
      <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); run(() => joinCrew(String(new FormData(e.currentTarget).get("code") ?? ""))); }}>
        <h2 className="street-heading text-2xl">{ar ? "ادخل كرو" : "Join a crew"}</h2>
        <input name="code" maxLength={8} dir="ltr" placeholder="A1B2C3" className={`${field} uppercase`} />
        <button type="submit" disabled={pending} className={btn}>{ar ? "ادخل" : "Join"}</button>
      </form>
      {error && <p className="text-sm text-blood md:col-span-2" role="alert">{error}</p>}
    </div>
  );
}

export function CrewActions({ claimable, mine }: { claimable: number[]; mine: number[] }) {
  const ar = useLocale() === "ar";
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        {claimable.map((t) => (
          <button
            key={t}
            type="button"
            disabled={pending || mine.includes(t)}
            onClick={() =>
              startTransition(async () => {
                const res = await claimCrewTier(t);
                if (res.ok) router.refresh();
                else setError(res.error);
              })
            }
            className={btn}
          >
            {mine.includes(t) ? (ar ? "✓ اتاخد" : "✓ Claimed") : ar ? `خد كوبون ${t + 1}` : `Claim tier ${t + 1}`}
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-blood" role="alert">{error}</p>}
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await leaveCrew();
            router.refresh();
          })
        }
        className="self-start text-xs text-dust underline underline-offset-4 hover:text-bone"
      >
        {ar ? "اطلع من الكرو" : "Leave crew"}
      </button>
    </div>
  );
}
