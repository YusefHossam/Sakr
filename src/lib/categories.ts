// Client-safe category list (the product model re-exports it).
export const CATEGORIES = [
  "hoodies",
  "crewnecks",
  "jackets",
  "pants",
  "sweatpants",
  "tees",
  "shorts",
  "tracksuits",
  "footwear",
  "accessories",
] as const;
export type Category = (typeof CATEGORIES)[number];
