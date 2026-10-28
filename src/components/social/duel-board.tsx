"use client";

import { useState, useTransition } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { castVote } from "@/lib/actions/social";
import type { ProductCard } from "@/lib/catalog";

export type DuelLook = { key: string; slugs: string[]; cards: ProductCard[]; total: number };
export type Duel = { a: DuelLook; b: DuelLook };

function LookCard({ look, onPick, disabled, share, ar }: { look: DuelLook; onPick: () => void; disabled: boolean; share: number | null; ar: boolean }) {
  return (
    <div className="flex flex-col gap-3 border border-ash p-3">
      <ul className="grid grid-cols-2 gap-2">
        {look.cards.slice(0, 4).map((c) => (
          <li key={c.slug}>
            <Link href={`/product/${c.slug}`} className="flex flex-col gap-1">
              <span className="aspect-square bg-tile">
                {/* eslint-disable-next-line @next/next/no-img-element -- remote CDN thumbnail */}
                {c.image && <img src={c.image} alt={c.title} loading="lazy" className="size-full object-contain p-2 mix-blend-multiply" />}
              </span>
              <span className="line-clamp-1 text-[10px] text-steel" dir="ltr">{c.title}</span>
            </Link>
          </li>
        ))}
      </ul>
      <button type="button" onClick={onPick} disabled={disabled} className="min-h-11 border border-bone/70 font-display tracking-[0.25em] text-bone uppercase hover:bg-bone hover:text-ink disabled:opacity-60">
        {share === null ? (ar ? "ده الأحلى" : "This one") : `${share}%`}
      </button>
    </div>
  );
}

export function DuelBoard({ duels, mood, loggedIn }: { duels: Duel[]; mood: string; loggedIn: boolean }) {
  const ar = useLocale() === "ar";
  const [i, setI] = useState(0);
  const [result, setResult] = useState<{ a: number; b: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const duel = duels[i];

  if (!duel)
    return <p className="py-16 text-center text-steel">{ar ? "خلصت كل الدويلات النهارده. ارجع بكرة لفيتس جديدة." : "That's every duel for today. Come back tomorrow for new fits."}</p>;
  if (!loggedIn)
    return (
      <p className="py-16 text-center text-steel">
        <Link href="/login?next=/duel" className="text-bone underline underline-offset-4">{ar ? "سجّل دخول" : "Log in"}</Link> {ar ? "عشان تصوّت." : "to vote."}
      </p>
    );

  const total = result ? result.a + result.b : 0;
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);

  const vote = (winner: "a" | "b") =>
    startTransition(async () => {
      setError(null);
      const res = await castVote({ a: { key: duel.a.key, slugs: duel.a.slugs }, b: { key: duel.b.key, slugs: duel.b.slugs }, winner, mood });
      if (res.ok) setResult({ a: res.a, b: res.b });
      else if (res.error === "voted") setResult({ a: 0, b: 0 });
      else setError(res.error);
    });

  return (
    <div className="flex flex-col gap-6">
      <p className="text-xs tracking-[0.3em] text-dust uppercase">{ar ? `دويل ${i + 1} من ${duels.length}` : `Duel ${i + 1} of ${duels.length}`}</p>
      <div className="grid gap-4 md:grid-cols-2">
        <LookCard look={duel.a} ar={ar} disabled={pending || !!result} share={result ? pct(result.a) : null} onPick={() => vote("a")} />
        <LookCard look={duel.b} ar={ar} disabled={pending || !!result} share={result ? pct(result.b) : null} onPick={() => vote("b")} />
      </div>
      {error && <p className="text-sm text-blood" role="alert">{error}</p>}
      {result && (
        <button
          type="button"
          onClick={() => {
            setResult(null);
            setI(i + 1);
          }}
          className="self-start min-h-11 border border-ash px-6 text-xs tracking-[0.3em] text-steel uppercase hover:text-bone"
        >
          {ar ? "الدويل اللي بعده" : "Next duel"} →
        </button>
      )}
    </div>
  );
}
