"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { askAssistant, type ChatReply } from "@/lib/actions/assistant";

type Turn = { from: "me" | "bot"; text: string; reply?: ChatReply };

/** Floating assistant: order status, sizes, shipping/payment answers and real product matches. */
export function ChatWidget() {
  const locale = useLocale() === "ar" ? "ar" : "en";
  const L = (ar: string, en: string) => (locale === "ar" ? ar : en);
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [turns, pending, open]);

  const send = (value: string) => {
    const q = value.trim();
    if (!q || pending) return;
    setText("");
    setTurns((t) => [...t, { from: "me", text: q }]);
    startTransition(async () => {
      const reply = await askAssistant(q, locale);
      setTurns((t) => [...t, { from: "bot", text: reply.text, reply }]);
    });
  };

  const SUGGESTIONS = [L("طلبي فين؟", "Where's my order?"), L("مقاسي إيه؟", "What's my size?"), L("هودي أسود", "black hoodie"), L("الشحن والدفع", "Shipping and payment")];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={L("اسأل SAKR", "Ask SAKR")}
        className="fixed bottom-4 start-4 z-[70] grid size-12 place-items-center border border-bone/60 bg-ink/90 text-bone backdrop-blur transition-colors hover:bg-bone hover:text-ink md:bottom-6 md:start-6"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 5h16v11H9l-5 4z" />
        </svg>
      </button>
      {open && (
        <section aria-label={L("مساعد SAKR", "SAKR assistant")} className="fixed bottom-20 start-4 z-[70] flex h-[min(34rem,calc(100svh-7rem))] w-[min(22rem,calc(100vw-2rem))] flex-col border border-ash bg-ink shadow-2xl md:bottom-24 md:start-6">
          <header className="flex items-center justify-between border-b border-ash px-4 py-3">
            <p className="street-heading text-lg">{L("اسأل SAKR", "Ask SAKR")}</p>
            <button type="button" onClick={() => setOpen(false)} aria-label={L("اقفل", "Close")} className="text-steel hover:text-bone">✕</button>
          </header>
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4 text-sm">
            {!turns.length && (
              <div className="flex flex-col gap-3">
                <p className="text-steel">{L("اسألني عن طلبك، مقاسك، أو أي قطعة.", "Ask about your order, your size or any piece.")}</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} type="button" onClick={() => send(s)} className="border border-ash px-3 py-1.5 text-xs text-steel hover:border-dust hover:text-bone">{s}</button>
                  ))}
                </div>
              </div>
            )}
            {turns.map((m, i) => (
              <div key={i} className={`flex flex-col gap-2 ${m.from === "me" ? "items-end" : "items-start"}`}>
                <p className={`max-w-[85%] px-3 py-2 leading-relaxed ${m.from === "me" ? "bg-bone text-ink" : "border border-ash text-bone"}`} dir="auto">{m.text}</p>
                {m.reply?.products && (
                  <ul className="grid w-full grid-cols-2 gap-2">
                    {m.reply.products.map((p) => (
                      <li key={p.slug}>
                        <Link href={`/product/${p.slug}`} onClick={() => setOpen(false)} className="flex flex-col gap-1 border border-ash p-2 hover:border-dust">
                          <span className="aspect-square bg-tile">
                            {/* eslint-disable-next-line @next/next/no-img-element -- remote CDN thumbnail */}
                            {p.image && <img src={p.image} alt="" className="size-full object-contain p-1 mix-blend-multiply" />}
                          </span>
                          <span className="line-clamp-2 text-[11px] text-steel" dir="ltr">{p.brand} {p.title}</span>
                          <span className="text-[11px] text-bone" dir="ltr">{p.price.toLocaleString("en")} EGP</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                {m.reply?.links?.map((l) =>
                  l.href.startsWith("http") ? (
                    <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="text-xs text-bone underline underline-offset-4">{l.label} ↗</a>
                  ) : (
                    <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-xs text-bone underline underline-offset-4">{l.label}</Link>
                  ),
                )}
              </div>
            ))}
            {pending && <p className="text-xs text-dust" role="status">{L("بيكتب…", "typing…")}</p>}
            <div ref={bottom} />
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="flex border-t border-ash">
            <input value={text} onChange={(e) => setText(e.target.value)} maxLength={300} placeholder={L("اكتب سؤالك…", "Type your question…")} aria-label={L("سؤالك", "Your question")} className="min-h-12 min-w-0 flex-1 bg-transparent px-4 text-sm text-bone placeholder:text-dust focus:outline-none" />
            <button disabled={pending || !text.trim()} className="px-4 text-xs tracking-[0.2em] text-bone uppercase hover:bg-bone hover:text-ink disabled:opacity-40">{L("ابعت", "Send")}</button>
          </form>
        </section>
      )}
    </>
  );
}
