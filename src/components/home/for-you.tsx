"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "@/components/product/product-card";
import type { ProductCard as Card } from "@/lib/catalog";

const KEY = "sakr-affinity";
type Affinity = { brands: Record<string, number>; categories: Record<string, number> };

const read = (): Affinity => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "") as Affinity;
  } catch {
    return { brands: {}, categories: {} };
  }
};

/** Product pages call this so the home page can lean toward what the visitor browses (BR-52). */
export function TrackAffinity({ brand, category }: { brand: string; category: string }) {
  useEffect(() => {
    const a = read();
    a.brands[brand] = (a.brands[brand] ?? 0) + 1;
    a.categories[category] = (a.categories[category] ?? 0) + 1;
    try {
      localStorage.setItem(KEY, JSON.stringify(a));
    } catch {}
  }, [brand, category]);
  return null;
}

const top = (m: Record<string, number>, n: number) => Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => k);

/** "For you": personalized row built from browsing history kept in this browser only. */
export function ForYou({ title }: { title: string }) {
  const [items, setItems] = useState<Card[]>([]);
  useEffect(() => {
    const a = read();
    const brands = top(a.brands, 3);
    if (!brands.length) return;
    void fetch(`/api/for-you?brands=${brands.join(",")}&categories=${top(a.categories, 2).join(",")}`)
      .then((r) => r.json() as Promise<{ items: Card[] }>)
      .then((d) => setItems(d.items))
      .catch(() => {});
  }, []);
  if (!items.length) return null;
  return (
    <section className="mx-auto mt-24 max-w-[1500px] px-4 md:px-8" style={{ animation: "fade-up 0.5s ease both" }}>
      <h2 className="street-heading mb-8 border-b border-ash pb-4 text-[clamp(2rem,5vw,3.75rem)] leading-none">{title}</h2>
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
        {items.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
    </section>
  );
}
