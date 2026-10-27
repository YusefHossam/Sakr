"use client";

import { useEffect, useState } from "react";
import type { ProductCard as Card } from "@/lib/catalog";
import { ProductCard } from "./product-card";

/** Shows a different random handful from the pool on every visit (BR-17). */
export function RandomPicks({ pool, count = 8 }: { pool: Card[]; count?: number }) {
  const [items, setItems] = useState(() => pool.slice(0, count));
  useEffect(() => {
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- random order must be picked in the browser
    setItems(shuffled.slice(0, count));
  }, [pool, count]);
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
      {items.map((p) => (
        <ProductCard key={p.slug} product={p} />
      ))}
    </div>
  );
}
