// Discount rules shared by server and client. Client-safe.
// TODO(admin): the last-pieces threshold/percent are stored in settings too; wire them through when editable.
export const LAST_PIECES_MAX = 3;
export const LAST_PIECES_DISCOUNT = 0.85;

export type StockVariant = { size?: string | null; color?: string | null; stock: number };

/** An admin promotion (BR-63): whole site, a brand, a category or one product. */
export type Promo = { scope: "site" | "brand" | "category" | "product"; key: string; percent: number; endsAt: string | null };

export const isLastPieces = (stock: number) => stock >= 1 && stock <= LAST_PIECES_MAX;

/** Best running promotion for a product, as a fraction (0 when none). */
export function promoFor(p: { slug: string; brandSlug: string; category: string }, promos: Promo[], now = Date.now()): number {
  let best = 0;
  for (const promo of promos) {
    if (promo.endsAt && Date.parse(promo.endsAt) < now) continue;
    const hit =
      promo.scope === "site" ||
      (promo.scope === "brand" && promo.key === p.brandSlug) ||
      (promo.scope === "category" && promo.key === p.category) ||
      (promo.scope === "product" && promo.key === p.slug);
    if (hit) best = Math.max(best, promo.percent / 100);
  }
  return best;
}

/** Price of one variant: the larger of the promotion and the last-pieces discount. They never stack (BR-60). */
export const variantPrice = (price: number, stock: number, promo = 0) =>
  Math.round(price * (1 - Math.max(promo, isLastPieces(stock) ? LAST_PIECES_DISCOUNT : 0)));

/** Smallest stock among a product's last-pieces variants, or null when none. */
export function lastPiecesLeft(variants: StockVariant[]): number | null {
  const low = variants.filter((v) => isLastPieces(v.stock)).map((v) => v.stock);
  return low.length ? Math.min(...low) : null;
}
