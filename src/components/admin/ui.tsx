"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import type { AdminResult } from "@/lib/actions/admin";

export const adminField = "min-h-10 w-full border border-ash bg-smoke px-3 text-sm text-bone placeholder:text-dust focus:border-steel focus:outline-none";
export const adminButton = "min-h-10 border border-bone/70 px-4 text-xs tracking-[0.15em] text-bone uppercase hover:bg-bone hover:text-ink disabled:opacity-50";

/** Runs a bound server action, then refreshes the page. */
export function ActionButton({
  action,
  label,
  confirm,
  danger = false,
}: {
  action: () => Promise<AdminResult>;
  label: string;
  confirm?: string;
  danger?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return;
          startTransition(async () => {
            const res = await action();
            setError(res.ok ? null : res.error);
            router.refresh();
          });
        }}
        className={`${adminButton} ${danger ? "border-blood/70 text-blood hover:bg-blood hover:text-chrome" : ""}`}
      >
        {pending ? "…" : label}
      </button>
      {error && <span className="text-[11px] text-blood">{error}</span>}
    </span>
  );
}

export function Stat({ label, value, hint, hot = false }: { label: string; value: string | number; hint?: string; hot?: boolean }) {
  return (
    <div className={`flex flex-col gap-1 border p-4 ${hot ? "border-blood/60" : "border-ash"}`}>
      <span className="text-[11px] tracking-[0.2em] text-dust uppercase">{label}</span>
      <span className={`font-display text-3xl ${hot ? "text-blood" : "text-chrome"}`} dir="ltr">{value}</span>
      {hint && <span className="text-xs text-steel">{hint}</span>}
    </div>
  );
}
