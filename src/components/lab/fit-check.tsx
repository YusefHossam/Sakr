"use client";

import { useRef, useState, useTransition } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { checkFit, type FitCheckResult } from "@/lib/actions/fit-check";
import { MOODS } from "@/lib/moods";

/** Shrinks a photo to a small JPEG before it leaves the device. */
async function shrink(file: File): Promise<Blob | null> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 768 / Math.max(bitmap.width, bitmap.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bitmap.width * scale);
  c.height = Math.round(bitmap.height * scale);
  c.getContext("2d")!.drawImage(bitmap, 0, 0, c.width, c.height);
  return new Promise((resolve) => c.toBlob(resolve, "image/jpeg", 0.82));
}

export function FitCheck() {
  const locale = useLocale() === "ar" ? "ar" : "en";
  const L = (ar: string, en: string) => (locale === "ar" ? ar : en);
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<FitCheckResult | null>(null);
  const [pending, startTransition] = useTransition();

  const onFile = (file: File | undefined) => {
    if (!file) return;
    setResult(null);
    setPreview(URL.createObjectURL(file));
    startTransition(async () => {
      const blob = await shrink(file);
      if (!blob) return setResult({ ok: false, error: "photo" });
      const form = new FormData();
      form.set("photo", blob, "fit.jpg");
      form.set("locale", locale);
      setResult(await checkFit(form));
    });
  };

  const errors: Record<string, string> = {
    photo: L("الصورة مش واضحة أو كبيرة. جرّب صورة تانية.", "That photo didn't work. Try another."),
    busy: L("الـ AI مشغول دلوقتي. جرّب كمان شوية.", "The AI is busy right now. Try again in a moment."),
    nokey: L("الـ AI مش متفعّل على السيرفر ده.", "The AI isn't enabled on this server."),
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <p className="text-sm text-steel">
        {L(
          "صوّر نفسك بلبسك (من الراس للرجل لو تقدر) والـ AI يقيّم اللوك ويقترح عليك قطع من المتاح. الصورة بتتبعت للتحليل بس ومبتتخزّنش.",
          "Photograph yourself in your fit (head to toe if you can). The AI rates it and suggests pieces from the store. The photo is sent for this check only and never stored.",
        )}
      </p>
      <input ref={input} type="file" accept="image/*" capture="user" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} aria-label={L("صورة", "Photo")} />
      <button
        type="button"
        disabled={pending}
        onClick={() => input.current?.click()}
        className="flex min-h-64 flex-col items-center justify-center gap-3 border border-dashed border-iron text-steel transition-colors hover:border-bone hover:text-bone disabled:opacity-60"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- local object URL
          <img src={preview} alt="" className="max-h-96 object-contain" />
        ) : (
          <span className="text-4xl" aria-hidden="true">+</span>
        )}
        <span className="text-sm">{pending ? L("بنحلل اللوك…", "Reading your fit…") : preview ? L("غيّر الصورة", "Change photo") : L("صوّر أو ارفع صورة", "Take or upload a photo")}</span>
      </button>

      {result && !result.ok && (
        <p className="text-sm text-bone" role="alert">
          {result.error === "login" ? (
            <>
              {L("سجّل دخول الأول.", "Log in first.")}{" "}
              <Link href="/login?next=/fit-check" className="underline underline-offset-4">{L("دخول", "Log in")}</Link>
            </>
          ) : (
            errors[result.error]
          )}
        </p>
      )}

      {result?.ok && (
        <section className="flex flex-col gap-6">
          <div className="flex items-end gap-4 border-b border-ash pb-4">
            <p className="street-heading text-7xl leading-none" dir="ltr">
              {result.score}
              <span className="text-3xl text-dust">/10</span>
            </p>
            <p className="max-w-md text-bone" dir="auto">{result.verdict}</p>
          </div>
          {result.mood && (
            <p className="text-xs text-dust">
              {L("المود:", "Mood:")}{" "}
              <Link href={`/moods/${result.mood}`} className="text-bone underline underline-offset-4">{MOODS[result.mood][locale]}</Link>
            </p>
          )}
          {result.tips.length > 0 && (
            <ul className="flex list-disc flex-col gap-1 ps-5 text-sm text-steel">
              {result.tips.map((t) => <li key={t} dir="auto">{t}</li>)}
            </ul>
          )}
          {result.picks.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="street-heading text-2xl">{L("كمّل اللوك بـ", "Complete it with")}</h2>
              <ul className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {result.picks.map((p) => (
                  <li key={p.slug}>
                    <Link href={`/product/${p.slug}`} className="flex flex-col gap-2">
                      <span className="aspect-square bg-tile">
                        {/* eslint-disable-next-line @next/next/no-img-element -- remote CDN thumbnail */}
                        {p.image && <img src={p.image} alt="" className="size-full object-contain p-3 mix-blend-multiply" />}
                      </span>
                      <span className="text-[11px] tracking-[0.2em] text-dust uppercase" dir="ltr">{p.brand}</span>
                      <span className="line-clamp-2 text-sm text-steel" dir="ltr">{p.title}</span>
                      <span className="text-sm text-bone" dir="ltr">{p.price.toLocaleString("en")} EGP</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
