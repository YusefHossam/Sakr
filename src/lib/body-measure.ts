// Body measurements from MediaPipe pose landmarks + the person segmentation mask. Client-only maths.

export type Mask = { width: number; height: number; data: Float32Array };
export type Point = { x: number; y: number }; // normalized 0..1
export type Measurements = {
  shouldersCm: number;
  chestCm: number;
  waistCm: number;
  hipsCm: number;
  inseamCm: number;
  top: string;
  bottom: string;
  shoeUS: number;
  // Rows (normalized y) and spans (normalized x) used to draw the lines on the photo.
  lines: { key: "chest" | "waist" | "hips"; y: number; x1: number; x2: number }[];
};

const THRESHOLD = 0.5;

/** Topmost and bottommost rows that contain the person. */
function verticalExtent(mask: Mask): { top: number; bottom: number } | null {
  let top = -1;
  let bottom = -1;
  for (let y = 0; y < mask.height; y++) {
    const row = y * mask.width;
    for (let x = 0; x < mask.width; x++) {
      if (mask.data[row + x] > THRESHOLD) {
        if (top < 0) top = y;
        bottom = y;
        break;
      }
    }
  }
  return top < 0 ? null : { top, bottom };
}

/**
 * Width of the continuous body run through `cx` on row `y` (ignores arms hanging apart). `maxHalf` stops the run at
 * a plausible torso edge, so arms held out or an open jacket touching the body are not counted as chest.
 */
function runWidth(mask: Mask, y: number, cx: number, maxHalf = Infinity): { x1: number; x2: number } | null {
  const row = Math.round(Math.min(Math.max(y, 0), mask.height - 1)) * mask.width;
  let x = Math.round(cx);
  if (mask.data[row + x] <= THRESHOLD) return null;
  let x1 = x;
  let x2 = x;
  const lo = Math.max(0, Math.round(cx - maxHalf));
  const hi = Math.min(mask.width - 1, Math.round(cx + maxHalf));
  while (x1 > lo && mask.data[row + x1 - 1] > THRESHOLD) x1--;
  while (x2 < hi && mask.data[row + x2 + 1] > THRESHOLD) x2++;
  x = x2 - x1;
  return x > 2 ? { x1, x2 } : null;
}

// Ellipse perimeter (Ramanujan) from full width and depth.
const ellipse = (width: number, depth: number) => {
  const a = width / 2;
  const b = depth / 2;
  return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
};

const topSize = (chest: number) => (chest < 86 ? "XS" : chest < 94 ? "S" : chest < 100 ? "M" : chest < 106 ? "L" : chest < 114 ? "XL" : "XXL");
const bottomSize = (waist: number) => String(Math.min(38, Math.max(28, Math.ceil(waist / 2.54 / 2) * 2)));
const shoeSize = (height: number) => Math.min(14, Math.max(6, Math.round((9 + (height - 170) * 0.15) * 2) / 2));

type View = { landmarks: Point[]; mask: Mask };

/**
 * Front view gives widths; an optional side view gives depths (otherwise estimated from typical
 * body proportions, nudged by BMI when weight is known). Back view, if given, is averaged with the front.
 */
export function measure(front: View, heightCm: number, weightKg: number | null, side?: View | null, back?: View | null): Measurements | null {
  const ext = verticalExtent(front.mask);
  if (!ext) return null;
  const L = front.landmarks;
  const need = [11, 12, 23, 24, 27, 28];
  if (need.some((i) => !L[i])) return null;

  const { width: W, height: H } = front.mask;
  const cmPerPx = heightCm / (ext.bottom - ext.top);
  const px = (p: Point) => ({ x: p.x * W, y: p.y * H });
  const [ls, rs, lh, rh, la, ra] = need.map((i) => px(L[i]));
  const shoulderY = (ls.y + rs.y) / 2;
  const hipY = (lh.y + rh.y) / 2;
  const cx = (ls.x + rs.x + lh.x + rh.x) / 4;
  const rows = { chest: shoulderY + (hipY - shoulderY) * 0.25, waist: shoulderY + (hipY - shoulderY) * 0.72, hips: hipY + 4 };

  // A torso is never much wider than the shoulder joints: this caps each row's half-width.
  const shoulderHalf = Math.abs(ls.x - rs.x) / 2;
  const reach = { chest: 1.25, waist: 1.15, hips: 1.3 };
  const widths: Partial<Record<keyof typeof rows, { cm: number; x1: number; x2: number }>> = {};
  for (const key of Object.keys(rows) as (keyof typeof rows)[]) {
    const run = runWidth(front.mask, rows[key], cx, shoulderHalf * reach[key]);
    if (!run) return null;
    let cm = (run.x2 - run.x1) * cmPerPx;
    if (back) {
      const b = runWidth(back.mask, rows[key] * (back.mask.height / H), back.mask.width / 2);
      const bExt = verticalExtent(back.mask);
      if (b && bExt) cm = (cm + (b.x2 - b.x1) * (heightCm / (bExt.bottom - bExt.top))) / 2;
    }
    widths[key] = { cm, x1: run.x1 / W, x2: run.x2 / W };
  }

  // Depths: from the side photo when present.
  const bmi = weightKg ? weightKg / (heightCm / 100) ** 2 : 22;
  const build = Math.min(1.2, Math.max(0.9, 1 + (bmi - 22) * 0.015));
  const ratio = { chest: 0.72, waist: 0.78, hips: 0.85 };
  const depth = (key: keyof typeof rows) => {
    if (side) {
      const sExt = verticalExtent(side.mask);
      if (sExt) {
        const sy = sExt.top + ((rows[key] - ext.top) / (ext.bottom - ext.top)) * (sExt.bottom - sExt.top);
        const run = runWidth(side.mask, sy, side.mask.width / 2);
        if (run) return (run.x2 - run.x1) * (heightCm / (sExt.bottom - sExt.top));
      }
    }
    return widths[key]!.cm * ratio[key] * build;
  };

  const shouldersCm = Math.hypot(ls.x - rs.x, ls.y - rs.y) * cmPerPx * 1.18;
  // Keep circumferences inside human proportions to the shoulders (loose clothes and poses otherwise inflate them).
  const within = (v: number, lo: number, hi: number) => Math.min(hi * shouldersCm, Math.max(lo * shouldersCm, v));
  const chestCm = within(ellipse(widths.chest!.cm, depth("chest")), 1.95, 2.7);
  const waistCm = within(ellipse(widths.waist!.cm, depth("waist")), 1.6, 2.6);
  const hipsCm = within(ellipse(widths.hips!.cm, depth("hips")), 1.95, 2.7);
  const inseamCm = (((la.y + ra.y) / 2 - hipY) * cmPerPx) * 1.05;

  return {
    shouldersCm: Math.round(shouldersCm),
    chestCm: Math.round(chestCm),
    waistCm: Math.round(waistCm),
    hipsCm: Math.round(hipsCm),
    inseamCm: Math.round(inseamCm),
    top: topSize(chestCm),
    bottom: bottomSize(waistCm),
    shoeUS: shoeSize(heightCm),
    lines: (["chest", "waist", "hips"] as const).map((key) => ({ key, y: rows[key] / H, x1: widths[key]!.x1, x2: widths[key]!.x2 })),
  };
}
