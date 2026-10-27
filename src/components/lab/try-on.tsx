"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/** "Try it on me": consent, a photo, then the AI result (BR-21). */
export function TryOn({ garmentUrl, description, loggedIn }: { garmentUrl: string; description: string; loggedIn: boolean }) {
  const t = useTranslations("tryon");
  const tl = useTranslations("lab");
  const [open, setOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [state, setState] = useState<"idle" | "running" | "failed">("idle");
  const [result, setResult] = useState<string | null>(null);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="min-h-11 border border-dashed border-bone/50 text-xs tracking-[0.25em] text-bone uppercase hover:border-bone">
        ✦ {tl("tryOn")}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 border border-ash p-4">
      <p className="street-heading text-xl">{t("title")}</p>
      {!loggedIn ? (
        <Link href="/login" className="text-sm text-bone underline">{tl("tryOnText")}</Link>
      ) : !agreed ? (
        <>
          <p className="text-xs leading-relaxed text-steel">{t("consent")}</p>
          <button type="button" onClick={() => setAgreed(true)} className="min-h-11 self-start border border-bone/70 px-5 text-xs tracking-[0.2em] text-bone uppercase">{t("agree")}</button>
        </>
      ) : (
        <>
          <label className="flex flex-col gap-1 text-xs text-dust">
            {t("photo")}
            <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} className="text-sm text-bone file:me-3 file:border file:border-ash file:bg-ink file:px-3 file:py-2 file:text-bone" />
          </label>
          <button
            type="button"
            disabled={!photo || state === "running"}
            onClick={async () => {
              if (!photo) return;
              setState("running");
              setResult(null);
              const body = new FormData();
              body.set("person", photo);
              body.set("garmentUrl", garmentUrl);
              body.set("description", description);
              const res = await fetch("/api/try-on", { method: "POST", body }).catch(() => null);
              const data = res?.ok ? ((await res.json()) as { image?: string }) : null;
              if (data?.image) {
                setResult(data.image);
                setState("idle");
              } else setState("failed");
            }}
            className="min-h-11 bg-bone font-display tracking-[0.3em] text-ink uppercase disabled:opacity-40"
          >
            {state === "running" ? t("running") : t("run")}
          </button>
          {state === "running" && <div className="h-1 animate-pulse bg-bone/60" aria-hidden="true" />}
          {state === "failed" && <p className="text-xs text-blood" role="alert">{t("failed")}</p>}
          {result && (
            <figure className="flex flex-col gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- generated image (data URL) */}
              <img src={result} alt={t("result")} className="w-full border border-ash" />
              <figcaption className="text-xs text-dust">{t("result")}</figcaption>
            </figure>
          )}
        </>
      )}
    </div>
  );
}
