// Generic size charts per category (cm). Client-safe.
import type { Category } from "@/models/product";

export type SizeChart = { kind: "tops" | "bottoms" | "shoes"; columns: string[]; rows: (string | number)[][] };

const TOPS: SizeChart = {
  kind: "tops",
  columns: ["Size", "Chest", "Length", "Shoulder", "Sleeve"],
  rows: [
    ["S", 108, 70, 52, 60],
    ["M", 114, 72, 54, 61],
    ["L", 120, 74, 56, 62],
    ["XL", 126, 76, 58, 63],
    ["XXL", 132, 78, 60, 64],
  ],
};

const BOTTOMS: SizeChart = {
  kind: "bottoms",
  columns: ["Size", "Waist", "Hip", "Inseam", "Leg opening"],
  rows: [
    ["28 / S", 72, 98, 78, 16],
    ["30 / M", 77, 103, 79, 17],
    ["32 / L", 82, 108, 80, 18],
    ["34 / XL", 87, 113, 81, 19],
    ["36 / XXL", 92, 118, 82, 20],
  ],
};

const SHOES: SizeChart = {
  kind: "shoes",
  columns: ["US", "EU", "UK", "CM"],
  rows: [
    [7, 40, 6, 25],
    [8, 41, 7, 26],
    [9, 42.5, 8, 27],
    [10, 44, 9, 28],
    [11, 45, 10, 29],
    [12, 46, 11, 30],
    [13, 47.5, 12, 31],
  ],
};

export function sizeChartFor(category: Category): SizeChart | null {
  if (category === "footwear") return SHOES;
  if (["pants", "sweatpants", "shorts"].includes(category)) return BOTTOMS;
  if (category === "accessories") return null;
  return TOPS;
}

export function washingKey(category: Category) {
  if (category === "footwear") return "washingShoes" as const;
  if (category === "accessories") return "washingAccessories" as const;
  if (["pants", "sweatpants", "shorts"].includes(category)) return "washingBottoms" as const;
  return "washingTops" as const;
}
