"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Price } from "@/components/product/price";
import { useRouter } from "@/i18n/navigation";
import { addToCart } from "@/lib/actions/cart";

type Variant = { size: string | null; color: string | null; stock: number; price: number };
type Piece = { slug: string; title: string; brand: string; category: string; subcategory: string | null; price: number; image: string | null; variants: Variant[] };
type SearchItem = { slug: string; title: string; brand: string; price: number; images: string[] };

const SLOTS = {
  headwear: { categories: ["accessories"], type: "headwear" },
  outer: { categories: ["jackets"] },
  top: { categories: ["hoodies", "tees", "crewnecks"] },
  bottom: { categories: ["pants", "sweatpants", "shorts"] },
  shoes: { categories: ["footwear", "slides"] },
  accessory: { categories: ["accessories"] },
} as const;
type Slot = keyof typeof SLOTS;

// Where each slot's piece sits on the mannequin (percent of the stage).
const PLACE: Record<Slot, string> = {
  headwear: "left-[38%] top-[0%] w-[24%]",
  outer: "left-[8%] top-[16%] w-[38%]",
  top: "left-[30%] top-[16%] w-[40%]",
  bottom: "left-[30%] top-[46%] w-[40%]",
  shoes: "left-[28%] top-[80%] w-[44%]",
  accessory: "left-[64%] top-[30%] w-[26%]",
};

const slotFor = (p: Pick<Piece, "category" | "subcategory">): Slot =>
  p.category === "accessories" ? (p.subcategory === "headwear" ? "headwear" : "accessory") : ((Object.keys(SLOTS) as Slot[]).find((s) => (SLOTS[s].categories as readonly string[]).includes(p.category)) ?? "accessory");

async function fetchPiece(slug: string): Promise<Piece | null> {
  const res = await fetch(`/api/products/${encodeURIComponent(slug)}`);
  return res.ok ? ((await res.json()) as Piece) : null;
}

export function FitBuilder() {
  const t = useTranslations("builder");
  const router = useRouter();
  const [fit, setFit] = useState<Partial<Record<Slot, Piece>>>({});
  const [sizes, setSizes] = useState<Partial<Record<Slot, string>>>({});
  const [picking, setPicking] = useState<Slot | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [status, setStatus] = useState<"idle" | "added" | "sizes">("idle");
  const [pending, startTransition] = useTransition();

  // Preload pieces from ?items=a,b,c (the Stylist links here).
  useEffect(() => {
    const items = new URLSearchParams(location.search).get("items")?.split(",").filter(Boolean).slice(0, 6) ?? [];
    void Promise.all(items.map(fetchPiece)).then((pieces) => {
      const next: Partial<Record<Slot, Piece>> = {};
      for (const p of pieces) if (p) next[slotFor(p)] = p;
      setFit((f) => ({ ...f, ...next }));
    });
  }, []);

  useEffect(() => {
    if (!picking) return;
    const slot = SLOTS[picking];
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const lists = await Promise.all(
        slot.categories.map((c) =>
          fetch(`/api/products?category=${c}&limit=12${query ? `&q=${encodeURIComponent(query)}` : ""}`, { signal: controller.signal })
            .then((r) => r.json() as Promise<{ items: (SearchItem & { subcategory?: string })[] }>)
            .then((d) => d.items)
            .catch(() => []),
        ),
      );
      setResults(lists.flat().slice(0, 24));
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [picking, query]);

  const choose = async (slug: string) => {
    const p = await fetchPiece(slug);
    if (!p || !picking) return;
    setFit((f) => ({ ...f, [picking]: p }));
    setSizes((s) => ({ ...s, [picking]: p.variants.find((v) => v.stock > 0)?.size ?? undefined }));
    setPicking(null);
    setQuery("");
  };

  const pieces = (Object.keys(SLOTS) as Slot[]).filter((s) => fit[s]);
  const priceOf = (s: Slot) => fit[s]!.variants.find((v) => v.size === (sizes[s] ?? null))?.price ?? fit[s]!.price;
  const total = pieces.reduce((sum, s) => sum + priceOf(s), 0);

  const addAll = () =>
    startTransition(async () => {
      if (pieces.some((s) => fit[s]!.variants.some((v) => v.size) && !sizes[s])) return setStatus("sizes");
      for (const s of pieces) {
        const v = fit[s]!.variants.find((x) => x.size === (sizes[s] ?? null) && x.stock > 0) ?? fit[s]!.variants.find((x) => x.stock > 0);
        if (!v) continue;
        const res = await addToCart({ slug: fit[s]!.slug, size: v.size, color: v.color, qty: 1 });
        if (!res.ok && res.error === "login") return router.push("/login?next=/fit-builder");
      }
      setStatus("added");
      router.refresh();
    });

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
      {/* Mannequin stage */}
      <div className="relative mx-auto aspect-[3/4] w-full max-w-[560px] overflow-hidden border border-ash bg-gradient-to-b from-smoke to-ink">
        <svg viewBox="0 0 300 400" className="absolute inset-0 size-full opacity-25" aria-hidden="true">
          <path d="M150 20a22 22 0 1 1 0 44a22 22 0 1 1 0-44M112 76h76l26 120h-18l-10 190h-26l-10-140-10 140h-26l-10-190h-18z" fill="#8a8a8a" />
        </svg>
        {pieces.map((s) => (
          <button key={s} type="button" onClick={() => setPicking(s)} className={`absolute ${PLACE[s]} aspect-square transition-transform hover:scale-105`} style={{ animation: "fade-up 0.35s ease both" }} aria-label={fit[s]!.title}>
            {/* eslint-disable-next-line @next/next/no-img-element -- remote CDN image */}
            {fit[s]!.image && <img src={fit[s]!.image!} alt="" className="size-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]" />}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {(Object.keys(SLOTS) as Slot[]).map((s) => {
          const p = fit[s];
          return (
            <div key={s} className="flex flex-col gap-2 border border-ash p-3">
              <div className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-xs tracking-[0.2em] text-dust uppercase">{t(`slots.${s}`)}</span>
                <span className="flex-1 truncate text-xs text-bone" dir="ltr">{p ? `${p.brand} · ${p.title}` : "—"}</span>
                <button type="button" onClick={() => setPicking(picking === s ? null : s)} className="text-xs text-bone underline underline-offset-4">{t("choose")}</button>
                {p && (
                  <button type="button" onClick={() => setFit((f) => ({ ...f, [s]: undefined }))} className="text-xs text-dust">✕<span className="sr-only">{t("clear")}</span></button>
                )}
              </div>
              {p && p.variants.some((v) => v.size) && (
                <label className="flex items-center gap-2 text-xs text-dust">
                  {t("size")}
                  <select value={sizes[s] ?? ""} onChange={(e) => setSizes((x) => ({ ...x, [s]: e.target.value }))} className="min-h-9 flex-1 border border-ash bg-smoke px-2 text-bone">
                    <option value="">—</option>
                    {p.variants.filter((v) => v.stock > 0).map((v) => <option key={`${v.size}-${v.color}`} value={v.size ?? ""}>{v.size}{v.color ? ` · ${v.color}` : ""}</option>)}
                  </select>
                </label>
              )}
              {picking === s && (
                <div className="flex flex-col gap-2">
                  <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("search")} aria-label={t("search")} className="min-h-10 border border-ash bg-smoke px-3 text-sm text-bone" />
                  <ul className="grid max-h-72 grid-cols-3 gap-2 overflow-y-auto">
                    {results.map((r) => (
                      <li key={r.slug}>
                        <button type="button" onClick={() => choose(r.slug)} title={`${r.brand} ${r.title}`} className="block aspect-square w-full overflow-hidden border border-ash bg-tile hover:border-bone">
                          {/* eslint-disable-next-line @next/next/no-img-element -- remote CDN thumbnail */}
                          {r.images[0] && <img src={r.images[0]} alt={r.title} className="size-full object-contain p-1 mix-blend-multiply" />}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
        <div className="flex items-center justify-between border-t border-ash pt-4">
          <span className="text-sm text-steel">{t("total")}</span>
          <Price price={total} size="lg" />
        </div>
        <button type="button" onClick={addAll} disabled={!pieces.length || pending} className="min-h-12 bg-bone font-display tracking-[0.3em] text-ink uppercase disabled:opacity-40">
          {status === "added" ? `✓ ${t("added")}` : t("addAll")}
        </button>
        {status === "sizes" && <p className="text-xs text-blood" role="alert">{t("needSizes")}</p>}
      </div>
    </div>
  );
}
