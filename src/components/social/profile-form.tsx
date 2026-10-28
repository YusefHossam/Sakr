"use client";

import { useState, useTransition } from "react";
import { useLocale } from "next-intl";
import { saveProfile } from "@/lib/actions/social";

const field = "min-h-11 border border-ash bg-smoke px-3 text-bone placeholder:text-dust";

export function ProfileForm({ initial }: { initial: { handle: string; bio: string; profilePublic: boolean } }) {
  const ar = useLocale() === "ar";
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [handle, setHandle] = useState(initial.handle);

  const errors: Record<string, string> = ar
    ? { handle: "الاسم 3 لـ 20 حرف إنجليزي أو أرقام أو _", taken: "الاسم ده واخده حد", login: "سجّل دخول الأول" }
    : { handle: "3 to 20 letters, digits or _", taken: "That handle is taken", login: "Log in first" };

  return (
    <form
      className="flex max-w-xl flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const d = new FormData(e.currentTarget);
        startTransition(async () => {
          const res = await saveProfile({ handle: String(d.get("handle") ?? ""), bio: String(d.get("bio") ?? ""), profilePublic: d.get("profilePublic") === "on" });
          setMsg(res.ok ? (ar ? "اتحفظ" : "Saved") : (errors[res.error] ?? res.error));
        });
      }}
    >
      <label className="flex flex-col gap-1 text-xs text-dust">
        {ar ? "اسم المستخدم" : "Handle"}
        <input name="handle" value={handle} onChange={(e) => setHandle(e.target.value)} dir="ltr" placeholder="sakr_fan" maxLength={20} className={field} />
      </label>
      <label className="flex flex-col gap-1 text-xs text-dust">
        {ar ? "نبذة قصيرة" : "Bio"}
        <input name="bio" defaultValue={initial.bio} maxLength={140} className={field} />
      </label>
      <label className="flex items-center gap-2 text-sm text-steel">
        <input type="checkbox" name="profilePublic" defaultChecked={initial.profilePublic} className="size-4" />
        {ar ? "اعرض دولابي للناس (القطع اللي استلمتها بس)" : "Show my wardrobe publicly (delivered pieces only)"}
      </label>
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending} className="min-h-11 border border-bone/70 px-6 font-display tracking-[0.25em] text-bone uppercase hover:bg-bone hover:text-ink">
          {ar ? "حفظ" : "Save"}
        </button>
        {msg && <span className="text-xs text-steel" role="status">{msg}</span>}
        {initial.handle && initial.profilePublic && (
          <a href={`/${ar ? "ar" : "en"}/u/${initial.handle}`} className="text-xs text-bone underline underline-offset-4">/u/{initial.handle}</a>
        )}
      </div>
    </form>
  );
}
