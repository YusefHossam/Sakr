"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { sprayTag } from "@/lib/actions/wall";

export type Tag = { id: string; text: string; color: string; x: number; y: number; rotate: number; size: number };

export function GraffitiWall({ tags, loggedIn }: { tags: Tag[]; loggedIn: boolean }) {
  const t = useTranslations("wall");
  const router = useRouter();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fresh, setFresh] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-6">
      <div
        className="relative aspect-[16/9] w-full overflow-hidden border border-ash"
        style={{
          backgroundColor: "#141414",
          backgroundImage:
            "linear-gradient(#0a0a0a 2px, transparent 2px), linear-gradient(90deg, #0a0a0a 2px, transparent 2px), linear-gradient(90deg, #0a0a0a 2px, transparent 2px)",
          backgroundSize: "100% 34px, 68px 68px, 68px 68px",
          backgroundPosition: "0 0, 0 0, 34px 34px",
        }}
      >
        <div className="smoke-layer opacity-40" aria-hidden="true" />
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="absolute font-[family-name:var(--font-marker)] whitespace-nowrap select-none"
            dir="auto"
            style={{
              left: `${tag.x}%`,
              top: `${tag.y}%`,
              color: tag.color,
              transform: `rotate(${tag.rotate}deg)`,
              fontSize: `clamp(14px, ${tag.size * 2.2}vw, ${tag.size * 34}px)`,
              textShadow: `0 0 12px ${tag.color}55, 2px 2px 0 #000`,
              animation: fresh === tag.text ? "spray 1.2s steps(12,end) both" : undefined,
            }}
          >
            {tag.text}
          </span>
        ))}
      </div>
      {loggedIn ? (
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              const res = await sprayTag(text);
              if (res.ok) {
                setFresh(text.trim());
                setError(null);
                router.refresh();
              } else setError(res.error === "buyers" ? t("onlyBuyers") : "!");
            });
          }}
        >
          <label htmlFor="tag" className="sr-only">{t("yourTag")}</label>
          <input id="tag" value={text} onChange={(e) => setText(e.target.value)} maxLength={18} minLength={2} required placeholder={t("yourTag")} className="min-h-12 flex-1 border border-ash bg-smoke px-4 text-bone placeholder:text-dust" />
          <button type="submit" disabled={pending} className="min-h-12 bg-bone px-10 font-display tracking-[0.3em] text-ink uppercase disabled:opacity-50">🎨 {t("spray")}</button>
        </form>
      ) : (
        <Link href="/login?next=/wall" className="self-start text-sm text-bone underline underline-offset-4">{t("login")}</Link>
      )}
      {error && <p className="text-sm text-blood" role="alert">{error}</p>}
    </div>
  );
}
