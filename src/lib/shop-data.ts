import "server-only";
import { randomBytes } from "node:crypto";
import { connectDB } from "./db";
import { isLastPieces, variantPrice } from "./pricing";
import { Cart } from "@/models/cart";
import { Coupon } from "@/models/coupon";
import { Product } from "@/models/product";

// Per-user reads (cart, coupons). These depend on the session cookie, so they are not cached
// and must be rendered inside <Suspense>.

export type CartLine = {
  slug: string;
  title: string;
  brand: string;
  image: string | null;
  size: string | null;
  color: string | null;
  qty: number;
  stock: number;
  unitPrice: number;
  listPrice: number;
  costPrice: number;
};

export async function getCartLines(userId: string): Promise<CartLine[]> {
  await connectDB();
  const cart = await Cart.findOne({ userId }).lean();
  if (!cart?.items.length) return [];
  const products = await Product.find({ slug: { $in: cart.items.map((i) => i.productSlug) } })
    .select("slug title brand images price costPrice variants")
    .lean();
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  return cart.items.flatMap((i) => {
    const p = bySlug.get(i.productSlug);
    if (!p) return [];
    const stock = p.variants.find((v) => (v.size ?? null) === (i.size ?? null) && (v.color ?? null) === (i.color ?? null))?.stock ?? 0;
    return [
      {
        slug: p.slug,
        title: p.title,
        brand: p.brand,
        image: p.images[0] ?? null,
        size: i.size ?? null,
        color: i.color ?? null,
        qty: i.qty,
        stock,
        unitPrice: variantPrice(p.price, stock),
        listPrice: p.price,
        costPrice: p.costPrice ?? 0,
      },
    ];
  });
}

export const cartCount = async (userId: string) => {
  await connectDB();
  const cart = await Cart.findOne({ userId }).select("items.qty").lean();
  return cart?.items.reduce((n, i) => n + i.qty, 0) ?? 0;
};

export type UsableCoupon = { code: string; percent: number; expiresAt: string | null; reason: string };

const usableFilter = (userId: string) => ({
  active: true,
  usedBy: { $ne: userId },
  $and: [
    { $or: [{ userId: null }, { userId }] },
    { $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] },
    { $or: [{ maxUses: 0 }, { $expr: { $lt: ["$uses", "$maxUses"] } }] },
  ],
});

/** The customer's own coupons (the "My coupons" dropdown). */
export async function getMyCoupons(userId: string): Promise<UsableCoupon[]> {
  await connectDB();
  const docs = await Coupon.find({ ...usableFilter(userId), userId }).sort({ percent: -1 }).lean();
  return docs.map((c) => ({ code: c.code, percent: c.percent, expiresAt: c.expiresAt ? c.expiresAt.toISOString().slice(0, 10) : null, reason: c.reason }));
}

export async function findUsableCoupon(code: string, userId: string) {
  await connectDB();
  return Coupon.findOne({ ...usableFilter(userId), code: code.trim().toUpperCase() });
}

/** Issues a single-use personal coupon (big-order reward, apology, VIP). */
export async function issueCoupon(userId: string, percent: number, reason: "big-order" | "apology" | "vip", days = 60): Promise<string> {
  await connectDB();
  const code = `${reason === "apology" ? "SORRY" : reason === "vip" ? "VIP" : "SAKR"}${percent}-${randomBytes(3).toString("hex").toUpperCase()}`;
  await Coupon.create({ code, percent, userId, reason, maxUses: 1, expiresAt: new Date(Date.now() + days * 864e5) });
  return code;
}

export { isLastPieces };
