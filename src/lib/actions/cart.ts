"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { connectDB } from "@/lib/db";
import { cartTag } from "@/lib/tags";
import { Cart } from "@/models/cart";
import { Product } from "@/models/product";

export type CartResult = { ok: true; count: number } | { ok: false; error: "login" | "invalid" | "stock" };

const itemSchema = z.object({
  slug: z.string().min(1).max(120),
  size: z.string().max(20).nullable(),
  color: z.string().max(60).nullable(),
  qty: z.coerce.number().int().min(1).max(10),
});

const sameLine = (a: { productSlug: string; size?: string | null; color?: string | null }, slug: string, size: string | null, color: string | null) =>
  a.productSlug === slug && (a.size ?? null) === size && (a.color ?? null) === color;

/** Adds a size/color to the signed-in visitor's cart (login required, BR-10). */
export async function addToCart(input: z.input<typeof itemSchema>): Promise<CartResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "login" };
  const parsed = itemSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { slug, size, color, qty } = parsed.data;

  await connectDB();
  const product = await Product.findOne({ slug, active: true }).select("variants preorder").lean();
  const variant = product?.variants.find((v) => (v.size ?? null) === size && (v.color ?? null) === color);
  if (!variant) return { ok: false, error: "invalid" };
  // Out of stock but open for pre-order: the pre-order units left count as the stock.
  const preLeft = product?.preorder?.enabled ? Math.max(0, (product.preorder.limit ?? 0) - (product.preorder.taken ?? 0)) : 0;
  const capacity = variant.stock > 0 ? variant.stock : preLeft;

  const cart = (await Cart.findOne({ userId: session.userId })) ?? new Cart({ userId: session.userId, items: [] });
  const line = cart.items.find((i) => sameLine(i, slug, size, color));
  const wanted = (line?.qty ?? 0) + qty;
  if (wanted > capacity) return { ok: false, error: "stock" };
  if (line) line.qty = Math.min(wanted, 10);
  else cart.items.push({ productSlug: slug, size, color, qty });
  await cart.save();
  updateTag(cartTag(session.userId));
  return { ok: true, count: cart.items.reduce((n, i) => n + i.qty, 0) };
}

const lineSchema = itemSchema.omit({ qty: true }).extend({ qty: z.coerce.number().int().min(0).max(10) });

/** Sets a cart line's quantity; 0 removes it. */
export async function updateCartLine(input: z.input<typeof lineSchema>): Promise<CartResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "login" };
  const parsed = lineSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { slug, size, color, qty } = parsed.data;

  await connectDB();
  const cart = await Cart.findOne({ userId: session.userId });
  if (!cart) return { ok: true, count: 0 };
  if (qty > 0) {
    const product = await Product.findOne({ slug }).select("variants preorder").lean();
    const stock = product?.variants.find((v) => (v.size ?? null) === size && (v.color ?? null) === color)?.stock ?? 0;
    const preLeft = product?.preorder?.enabled ? Math.max(0, (product.preorder.limit ?? 0) - (product.preorder.taken ?? 0)) : 0;
    if (qty > (stock > 0 ? stock : preLeft)) return { ok: false, error: "stock" };
  }
  const index = cart.items.findIndex((i) => sameLine(i, slug, size, color));
  if (index >= 0) {
    if (qty === 0) cart.items.splice(index, 1);
    else cart.items[index].qty = qty;
    await cart.save();
  }
  updateTag(cartTag(session.userId));
  return { ok: true, count: cart.items.reduce((n, i) => n + i.qty, 0) };
}
