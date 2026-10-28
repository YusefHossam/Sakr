"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useLocale } from "next-intl";
import { postLiveMessage } from "@/lib/actions/social";

type Msg = { id: string; name: string; text: string; at: string };

/** Live chat: polls every 3 seconds while the tab is visible. */
export function LiveChat({ loggedIn }: { loggedIn: boolean }) {
  const ar = useLocale() === "ar";
  const [messages, setMessages] = useState<Msg[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const last = useRef<string | null>(null);
  const box = useRef<HTMLUListElement>(null);

  useEffect(() => {
    let stop = false;
    const pull = async () => {
      if (document.hidden) return;
      try {
        const res = await fetch(`/api/live/messages${last.current ? `?after=${encodeURIComponent(last.current)}` : ""}`, { cache: "no-store" });
        const data = (await res.json()) as { messages: Msg[] };
        if (stop || !data.messages.length) return;
        last.current = data.messages[data.messages.length - 1].at;
        setMessages((prev) => [...prev, ...data.messages.filter((m) => !prev.some((p) => p.id === m.id))].slice(-100));
      } catch {
        // the next tick retries
      }
    };
    const first = setTimeout(pull, 0);
    const timer = setInterval(pull, 3000);
    return () => {
      stop = true;
      clearTimeout(first);
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    box.current?.scrollTo({ top: box.current.scrollHeight });
  }, [messages]);

  const errors: Record<string, string> = ar ? { slow: "براحة شوية", invalid: "اكتب رسالة", login: "سجّل دخول الأول" } : { slow: "Slow down a little", invalid: "Type a message", login: "Log in first" };

  return (
    <div className="flex h-[420px] flex-col border border-ash">
      <ul ref={box} className="flex flex-1 flex-col gap-2 overflow-y-auto p-3 text-sm">
        {messages.length === 0 && <li className="text-dust">{ar ? "الشات فاضي. ابدأ إنت." : "Chat is empty. Be the first."}</li>}
        {messages.map((m) => (
          <li key={m.id} dir="auto"><span className="text-bone">{m.name}</span> <span className="text-steel">{m.text}</span></li>
        ))}
      </ul>
      {loggedIn ? (
        <form
          className="flex gap-2 border-t border-ash p-2"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const text = String(new FormData(form).get("text") ?? "");
            startTransition(async () => {
              const res = await postLiveMessage(text);
              if (res.ok) {
                form.reset();
                setError(null);
              } else setError(errors[res.error] ?? res.error);
            });
          }}
        >
          <input name="text" maxLength={200} autoComplete="off" placeholder={ar ? "اكتب..." : "Say something..."} className="min-h-11 flex-1 border border-ash bg-smoke px-3 text-bone placeholder:text-dust" />
          <button type="submit" disabled={pending} className="min-h-11 border border-bone/70 px-4 text-xs tracking-[0.2em] text-bone uppercase hover:bg-bone hover:text-ink">{ar ? "ابعت" : "Send"}</button>
        </form>
      ) : (
        <p className="border-t border-ash p-3 text-xs text-dust">{ar ? "سجّل دخول عشان تكتب." : "Log in to chat."}</p>
      )}
      {error && <p className="px-3 pb-2 text-xs text-blood" role="alert">{error}</p>}
    </div>
  );
}
