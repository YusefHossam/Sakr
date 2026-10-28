"use client";

import { useState, useTransition } from "react";
import { clearLiveChat, saveLive } from "@/lib/actions/social";

const field = "min-h-11 border border-ash bg-smoke px-3 text-bone placeholder:text-dust";

export function LiveAdminForm({ initial }: { initial: { active: boolean; title: string; embedUrl: string; productSlugs: string[] } }) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <form
      className="flex max-w-2xl flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const d = new FormData(e.currentTarget);
        startTransition(async () => {
          const res = await saveLive({
            active: d.get("active") === "on",
            title: String(d.get("title") ?? ""),
            embedUrl: String(d.get("embedUrl") ?? ""),
            productSlugs: String(d.get("slugs") ?? "").split(/[\s,]+/).filter(Boolean),
          });
          setMsg(res.ok ? "Saved" : res.error === "embed" ? "Embed must be a YouTube or Twitch https link" : res.error);
        });
      }}
    >
      <label className="flex items-center gap-2 text-sm text-steel">
        <input type="checkbox" name="active" defaultChecked={initial.active} className="size-4" /> On air
      </label>
      <label className="flex flex-col gap-1 text-xs text-dust">
        Title
        <input name="title" defaultValue={initial.title} maxLength={80} className={field} />
      </label>
      <label className="flex flex-col gap-1 text-xs text-dust">
        YouTube / Twitch link
        <input name="embedUrl" defaultValue={initial.embedUrl} dir="ltr" placeholder="https://www.youtube.com/watch?v=..." className={field} />
      </label>
      <label className="flex flex-col gap-1 text-xs text-dust">
        Product slugs (comma or space separated, max 12)
        <textarea name="slugs" rows={3} defaultValue={initial.productSlugs.join(", ")} dir="ltr" className={`${field} py-2`} />
      </label>
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending} className="min-h-11 border border-bone/70 px-6 font-display tracking-[0.25em] text-bone uppercase hover:bg-bone hover:text-ink">Save</button>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await clearLiveChat();
              setMsg("Chat cleared");
            })
          }
          className="text-xs text-dust underline underline-offset-4 hover:text-bone"
        >
          Clear chat
        </button>
        {msg && <span className="text-xs text-steel" role="status">{msg}</span>}
      </div>
    </form>
  );
}
