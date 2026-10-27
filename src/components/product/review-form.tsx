"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { submitReview } from "@/lib/actions/engagement";

export function ReviewForm({ slug }: { slug: string }) {
  const t = useTranslations("product");
  const [rating, setRating] = useState(5);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  if (done) return <p className="border border-ash p-4 text-sm text-bone" role="status">✓ {t("reviewThanks")}</p>;

  return (
    <form
      className="flex flex-col gap-3 border border-ash p-5"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(async () => {
          const res = await submitReview({ slug, rating, name: String(data.get("name")), text: String(data.get("text")) });
          if (res.ok) setDone(true);
          else setError(true);
        });
      }}
    >
      <p className="street-heading text-xl">{t("writeReview")}</p>
      <div className="flex gap-1" role="radiogroup" aria-label={t("rating")} dir="ltr">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={n === rating} aria-label={`${n}`} onClick={() => setRating(n)} className={`size-9 text-2xl ${n <= rating ? "text-bone" : "text-iron"}`}>
            ★
          </button>
        ))}
      </div>
      <label className="flex flex-col gap-1 text-xs text-dust">
        {t("yourName")}
        <input name="name" required minLength={2} maxLength={60} className="min-h-11 border border-ash bg-smoke px-3 text-sm text-bone" />
      </label>
      <label className="flex flex-col gap-1 text-xs text-dust">
        {t("reviewText")}
        <textarea name="text" required minLength={5} maxLength={1000} rows={3} className="border border-ash bg-smoke p-3 text-sm text-bone" />
      </label>
      {error && <p className="text-xs text-blood" role="alert">!</p>}
      <button type="submit" disabled={pending} className="min-h-11 self-start border border-bone/70 px-6 font-display tracking-[0.25em] text-bone uppercase hover:bg-bone hover:text-ink disabled:opacity-50">
        {t("submitReview")}
      </button>
    </form>
  );
}
