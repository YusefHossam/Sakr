"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import type { Suggestions } from "@/lib/catalog";

const EMPTY: Suggestions = { brands: [], types: [], products: [] };

/** Search field with live suggestions: brands, kinds and products appear as you type, in Arabic, Franco or English. */
export function SearchBox({ initial }: { initial: string }) {
  const ar = useLocale() === "ar";
  const router = useRouter();
  const listId = useId();
  const [q, setQ] = useState(initial);
  const [data, setData] = useState<Suggestions>(EMPTY);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const box = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);

  // Words typed before the page finished loading are in the field but not in state yet: pick them up.
  useEffect(() => {
    const typed = field.current?.value ?? "";
    if (typed && typed !== initial) {
      const t = setTimeout(() => {
        setQ(typed);
        setOpen(true);
      }, 0);
      return () => clearTimeout(t);
    }
  }, [initial]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      const clear = setTimeout(() => setData(EMPTY), 0);
      return () => clearTimeout(clear);
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/search/suggest?q=${encodeURIComponent(term)}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((d: Suggestions) => {
          setData(d);
          setActive(-1);
        })
        .catch(() => {});
    }, 180);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => {
    const away = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    addEventListener("pointerdown", away);
    return () => removeEventListener("pointerdown", away);
  }, []);

  // One flat list so the arrow keys walk through brands, kinds and products in order.
  const rows = [
    ...data.brands.map((b) => ({ key: `b-${b.slug}`, href: `/search?q=${encodeURIComponent(b.name)}`, text: b.name, hint: ar ? "براند" : "Brand", image: null as string | null })),
    ...data.types.map((t) => ({ key: `t-${t.href}`, href: t.href, text: ar ? t.label.ar : t.label.en, hint: ar ? "قسم" : "Section", image: null as string | null })),
    ...data.products.map((p) => ({ key: `p-${p.slug}`, href: `/product/${p.slug}`, text: p.title, hint: p.brand, image: p.image })),
  ];
  const show = open && rows.length > 0;

  return (
    <div ref={box} className="relative">
      <form
        role="search"
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const hit = active >= 0 ? rows[active] : null;
          setOpen(false);
          router.push(hit ? hit.href : `/search?q=${encodeURIComponent(q.trim())}`);
        }}
      >
        <label htmlFor="q" className="sr-only">{ar ? "ابحث" : "Search"}</label>
        <input
          ref={field}
          id="q"
          name="q"
          type="search"
          value={q}
          autoFocus
          autoComplete="off"
          role="combobox"
          aria-expanded={show}
          aria-controls={listId}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          // Arriving on a results page focuses the field; suggestions open only once you change the text.
          onFocus={() => setOpen(q.trim() !== initial.trim())}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(rows.length - 1, a + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(-1, a - 1));
            } else if (e.key === "Escape") setOpen(false);
          }}
          placeholder={ar ? "ابحث: نضارات كروم هارتس، هودي، sa3at..." : "Search: chrome hearts sunglasses, hoodie, nadarat..."}
          className="flex-1 border border-ash bg-smoke px-4 py-3.5 text-bone placeholder:text-dust focus:border-steel focus:outline-none"
        />
        <button type="submit" className="border border-bone/70 px-6 font-display tracking-[0.3em] text-bone uppercase hover:bg-bone hover:text-ink">{ar ? "بحث" : "Search"}</button>
      </form>
      {show && (
        <ul id={listId} role="listbox" className="absolute inset-x-0 top-full z-40 mt-1 max-h-[70vh] overflow-y-auto border border-iron bg-pitch shadow-2xl">
          {rows.map((r, i) => (
            <li key={r.key} role="option" aria-selected={i === active}>
              <Link
                href={r.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm ${i === active ? "bg-ash text-chrome" : "text-bone hover:bg-smoke"}`}
              >
                {r.image ? (
                  <span className="size-11 shrink-0 bg-tile">
                    {/* eslint-disable-next-line @next/next/no-img-element -- remote CDN thumbnail */}
                    <img src={r.image} alt="" className="size-full object-contain p-1 mix-blend-multiply" />
                  </span>
                ) : (
                  <span className="grid size-11 shrink-0 place-items-center border border-ash text-[10px] tracking-widest text-dust uppercase">{r.hint.slice(0, 5)}</span>
                )}
                <span className="line-clamp-1 flex-1" dir="auto">{r.text}</span>
                {r.image && <span className="text-[10px] tracking-[0.2em] text-dust uppercase" dir="ltr">{r.hint}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
