"use client";

import { useEffect, useState } from "react";

type Variant = { size?: string | null; color?: string | null; stock: number };

/** Keeps a product's variants in sync with the stock stream, so "last pieces" and "sold out" change without a refresh. */
export function useLiveVariants<T extends Variant>(slug: string, initial: T[]): T[] {
  const [live, setLive] = useState<{ size: string | null; color: string | null; stock: number }[] | null>(null);

  useEffect(() => {
    if (typeof EventSource === "undefined") return;
    const source = new EventSource(`/api/stream/${slug}`);
    source.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as { stock: { size: string | null; color: string | null; stock: number }[] };
        setLive(data.stock);
      } catch {
        // ignore a malformed frame
      }
    };
    return () => source.close();
  }, [slug]);

  if (!live) return initial;
  return initial.map((v) => {
    const hit = live.find((l) => l.size === (v.size ?? null) && l.color === (v.color ?? null));
    return hit ? { ...v, stock: hit.stock } : v;
  });
}
