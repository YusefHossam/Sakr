// Discount rules shared by server and client. Client-safe.
// TODO(admin): read these from store settings once the admin dashboard exists (BR-59).
export const LAST_PIECES_MAX = 3;
export const LAST_PIECES_DISCOUNT = 0.85;

export type StockVariant = { size?: string | null; color?: string | null; stock: number };

export const isLastPieces = (stock: number) => stock >= 1 && stock <= LAST_PIECES_MAX;

/** Price of one variant after the automatic last-pieces discount. */
export const variantPrice = (price: number, stock: number) =>
  isLastPieces(stock) ? Math.round(price * (1 - LAST_PIECES_DISCOUNT)) : price;

/** Smallest stock among a product's last-pieces variants, or null when none. */
export function lastPiecesLeft(variants: StockVariant[]): number | null {
  const low = variants.filter((v) => isLastPieces(v.stock)).map((v) => v.stock);
  return low.length ? Math.min(...low) : null;
}
