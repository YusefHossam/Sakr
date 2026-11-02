"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { login, register } from "@/lib/actions/auth";

const field = "min-h-12 w-full border border-ash bg-smoke px-4 text-bone placeholder:text-dust focus:border-steel focus:outline-none";

// Read `?next=` at click time instead of useSearchParams, so the page itself can prerender.
const nextPath = () => {
  const next = typeof location === "undefined" ? null : new URLSearchParams(location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
};

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const d = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
        startTransition(async () => {
          const res = mode === "login" ? await login({ email: d.email, password: d.password }) : await register({ name: d.name, email: d.email, phone: d.phone, password: d.password });
          if (res.ok) {
            router.push(nextPath());
            router.refresh();
          } else setError(res.error === "taken" ? t("taken") : res.error === "form" ? t("invalidForm") : t("invalid"));
        });
      }}
    >
      {mode === "register" && (
        <label className="flex flex-col gap-1.5 text-xs text-dust">
          {t("name")}
          <input name="name" required minLength={2} maxLength={80} autoComplete="name" className={field} />
        </label>
      )}
      <label className="flex flex-col gap-1.5 text-xs text-dust">
        {t("email")}
        {/* Sign-in also takes a username (the owner's account has one), so it is a plain text field there. */}
        <input name="email" type={mode === "login" ? "text" : "email"} required autoComplete={mode === "login" ? "username" : "email"} dir="ltr" className={field} />
      </label>
      {mode === "register" && (
        <label className="flex flex-col gap-1.5 text-xs text-dust">
          {t("phone")}
          <input name="phone" type="tel" required pattern="\+?[0-9 ]{8,16}" autoComplete="tel" dir="ltr" placeholder="+20 1XX XXX XXXX" className={field} />
        </label>
      )}
      <label className="flex flex-col gap-1.5 text-xs text-dust">
        {t("password")}
        <input name="password" type="password" required minLength={mode === "register" ? 8 : 1} autoComplete={mode === "login" ? "current-password" : "new-password"} dir="ltr" className={field} />
        {mode === "register" && <span className="text-[11px]">{t("passwordHint")}</span>}
      </label>
      {error && <p className="text-sm text-blood" role="alert">{error}</p>}
      <button type="submit" disabled={pending} className="min-h-12 bg-bone font-display tracking-[0.3em] text-ink uppercase hover:bg-chrome disabled:opacity-50">
        {mode === "login" ? t("login") : t("register")}
      </button>
      <p className="text-center text-sm text-steel">
        {mode === "login" ? t("noAccount") : t("haveAccount")}{" "}
        <Link
          href={mode === "login" ? "/register" : "/login"}
          onClick={(e) => {
            e.preventDefault();
            router.push(`${mode === "login" ? "/register" : "/login"}?next=${encodeURIComponent(nextPath())}`);
          }}
          className="text-bone underline underline-offset-4"
        >
          {mode === "login" ? t("register") : t("login")}
        </Link>
      </p>
    </form>
  );
}
