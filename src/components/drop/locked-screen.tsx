"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { joinList, unlockDrop } from "@/lib/actions/drop";

const field = "min-h-12 w-full border border-ash bg-smoke px-4 text-center text-bone placeholder:text-dust focus:border-steel focus:outline-none";

function Countdown({ to }: { to: string }) {
  const t = useTranslations("locked");
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setLeft(Math.max(0, Date.parse(to) - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [to]);
  if (left == null) return null;
  const parts = [
    [Math.floor(left / 864e5), t("days")],
    [Math.floor(left / 36e5) % 24, t("hours")],
    [Math.floor(left / 6e4) % 60, t("minutes")],
    [Math.floor(left / 1e3) % 60, t("seconds")],
  ] as const;
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-xs tracking-[0.4em] text-dust uppercase">{t("opensIn")}</p>
      <div className="flex gap-4 font-display text-5xl text-chrome md:text-7xl" dir="ltr">
        {parts.map(([n, u]) => (
          <span key={u} className="flex items-baseline gap-1">
            {String(n).padStart(2, "0")}
            <span className="text-base text-dust">{u}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Full-screen "sold out" while the drop is locked: countdown, password entry, drop alerts. */
export function LockedScreen({ name, opensAt, vipHours }: { name: string; opensAt: string | null; vipHours: number }) {
  const t = useTranslations("locked");
  const [wrong, setWrong] = useState(false);
  const [joined, setJoined] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className="relative flex min-h-[85vh] flex-col items-center justify-center gap-12 overflow-hidden px-4 py-20 text-center">
      <div className="smoke-layer" aria-hidden="true" />
      <div className="relative flex flex-col items-center gap-4">
        <p className="chrome-text font-gothic text-[clamp(5rem,18vw,11rem)] leading-none" dir="ltr">Sakr</p>
        <h1 className="street-heading animate-flicker text-[clamp(2.5rem,8vw,5rem)] leading-none" dir="ltr">
          {name} — <span className="text-blood">{t("soldOut")}</span>
        </h1>
        <p className="text-steel">{t("text")}</p>
      </div>
      {opensAt && <Countdown to={opensAt} />}

      <div className="relative grid w-full max-w-3xl gap-8 md:grid-cols-2">
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const password = String(new FormData(e.currentTarget).get("password") ?? "");
            startTransition(async () => {
              const res = await unlockDrop(password);
              if (res.ok) location.reload();
              else setWrong(true);
            });
          }}
        >
          <label htmlFor="drop-password" className="text-xs tracking-[0.3em] text-dust uppercase">{t("password")}</label>
          <input id="drop-password" name="password" type="password" required autoComplete="off" className={field} />
          {wrong && <p className="text-xs text-blood" role="alert">{t("wrong")}</p>}
          <button type="submit" disabled={pending} className="min-h-12 border border-bone/70 font-display tracking-[0.35em] text-bone uppercase hover:bg-bone hover:text-ink">{t("enter")}</button>
        </form>

        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const contact = String(new FormData(e.currentTarget).get("contact") ?? "").trim();
            startTransition(async () => {
              const res = await joinList({ contact, channel: contact.includes("@") ? "email" : "whatsapp", source: "locked" });
              setJoined(res.ok);
            });
          }}
        >
          <label htmlFor="drop-contact" className="text-xs tracking-[0.3em] text-dust uppercase">{t("notify")}</label>
          <input id="drop-contact" name="contact" required minLength={3} placeholder={t("contact")} dir="ltr" className={field} />
          <button type="submit" disabled={pending || joined} className="min-h-12 bg-bone font-display tracking-[0.35em] text-ink uppercase hover:bg-chrome disabled:opacity-60">
            {joined ? `✓ ${t("joined")}` : t("join")}
          </button>
        </form>
      </div>

      <p className="relative text-xs text-dust">
        {t("vip", { hours: vipHours })}{" "}
        <Link href="/login" className="text-bone underline underline-offset-4">{t("login")}</Link>
      </p>
    </div>
  );
}
