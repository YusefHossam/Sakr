"use server";

import { randomBytes } from "node:crypto";
import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { connectDB } from "@/lib/db";
import { createPaymobCheckout, paymobEnabled } from "@/lib/paymob";
import { getSettings, shippingFee } from "@/lib/settings";
import { earliestDelivery } from "@/lib/shipping";
import { findUsableCoupon, getCartLines, issueCoupon } from "@/lib/shop-data";
import { cartTag, ordersTag } from "@/lib/tags";
import { REGIONS } from "@/lib/regions";
import { Cart } from "@/models/cart";
import { Order, PaymentProof } from "@/models/order";
import { Product } from "@/models/product";

export type CheckoutError = "login" | "empty" | "stock" | "coupon" | "proof" | "invalid" | "cod" | "card" | "payment";
export type CheckoutResult = { ok: true; redirect: string } | { ok: false; error: CheckoutError; fields?: string[] };

const MAX_PROOF_BYTES = 5 * 1024 * 1024;
const opt = z.string().trim().max(120).optional().default("");

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  phone: z.string().trim().regex(/^\+?[0-9 ]{8,16}$/),
  phone2: z.string().trim().regex(/^(\+?[0-9 ]{8,16})?$/).optional().default(""),
  country: z.string().refine((c) => REGIONS.some((r) => r.code === c)),
  governorate: opt,
  city: z.string().trim().min(2).max(80),
  street: z.string().trim().min(2).max(120),
  building: opt,
  floor: opt,
  apartment: opt,
  landmark: opt,
  lat: z.coerce.number().min(-90).max(90).optional().catch(undefined),
  lng: z.coerce.number().min(-180).max(180).optional().catch(undefined),
  deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().trim().max(500).optional().default(""),
  method: z.enum(["card", "transfer", "cod"]),
  plan: z.enum(["full", "deposit"]).default("full"),
  coupon: z.string().trim().max(40).optional().default(""),
});

const orderNumber = () => `SKR-${Date.now().toString(36).toUpperCase()}${randomBytes(2).toString("hex").toUpperCase()}`;

/** Places an order: re-prices on the server, reserves stock atomically, applies one coupon, takes payment. */
export async function placeOrder(form: FormData): Promise<CheckoutResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "login" };

  const parsed = schema.safeParse(Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === "string")));
  if (!parsed.success) return { ok: false, error: "invalid", fields: parsed.error.issues.map((i) => String(i.path[0])) };
  const f = parsed.data;
  if (f.country === "EG" && !f.governorate) return { ok: false, error: "invalid", fields: ["governorate"] };
  if (f.method === "cod" && f.country !== "EG") return { ok: false, error: "cod" };
  if (f.method === "card" && !paymobEnabled()) return { ok: false, error: "card" };
  const plan = f.method === "cod" ? "full" : f.plan;

  const delivery = new Date(`${f.deliveryDate}T12:00:00`);
  if (Number.isNaN(+delivery) || delivery < earliestDelivery(new Date(Date.now() - 864e5))) {
    return { ok: false, error: "invalid", fields: ["deliveryDate"] };
  }

  const proof = form.get("proof");
  if (f.method === "transfer") {
    if (!(proof instanceof File) || !proof.size || proof.size > MAX_PROOF_BYTES || !proof.type.startsWith("image/")) {
      return { ok: false, error: "proof" };
    }
  }

  await connectDB();
  const [lines, settings] = await Promise.all([getCartLines(session.userId), getSettings()]);
  if (!lines.length) return { ok: false, error: "empty" };
  if (lines.some((l) => l.qty > l.stock)) return { ok: false, error: "stock" };

  const coupon = f.coupon ? await findUsableCoupon(f.coupon, session.userId) : null;
  if (f.coupon && !coupon) return { ok: false, error: "coupon" };

  // Reserve stock line by line; undo everything if any line lost the race.
  const reserved: typeof lines = [];
  for (const l of lines) {
    const res = await Product.updateOne(
      { slug: l.slug, variants: { $elemMatch: { size: l.size, color: l.color, stock: { $gte: l.qty } } } },
      { $inc: { "variants.$.stock": -l.qty } },
    );
    if (res.modifiedCount !== 1) {
      await Promise.all(
        reserved.map((r) =>
          Product.updateOne({ slug: r.slug, variants: { $elemMatch: { size: r.size, color: r.color } } }, { $inc: { "variants.$.stock": r.qty } }),
        ),
      );
      return { ok: false, error: "stock" };
    }
    reserved.push(l);
  }

  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  // Discounts don't stack (BR-60): a coupon only applies to items not already on last-pieces sale.
  const couponBase = lines.filter((l) => l.unitPrice === l.listPrice).reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const discount = coupon ? Math.round((couponBase * coupon.percent) / 100) : 0;
  const shipping = shippingFee(settings, f.country, f.governorate);
  const total = subtotal - discount + shipping;
  const dueNow = f.method === "cod" ? 0 : plan === "deposit" ? Math.ceil(total / 2) : total;

  const number = orderNumber();
  const initialStatus = f.method === "card" ? "awaiting_payment" : "pending";
  const order = await Order.create({
    number,
    userId: session.userId,
    items: lines.map((l) => ({
      productSlug: l.slug, title: l.title, brand: l.brand, image: l.image, size: l.size, color: l.color,
      qty: l.qty, unitPrice: l.unitPrice, listPrice: l.listPrice, costPrice: l.costPrice,
    })),
    subtotal, discount, couponCode: coupon?.code ?? null, shipping, total, dueNow,
    contact: { name: f.name, email: f.email, phone: f.phone, phone2: f.phone2 },
    address: {
      country: f.country, governorate: f.country === "EG" ? f.governorate : "", city: f.city, street: f.street,
      building: f.building, floor: f.floor, apartment: f.apartment, landmark: f.landmark, lat: f.lat ?? null, lng: f.lng ?? null,
    },
    deliveryDate: delivery,
    notes: f.notes,
    payment: { method: f.method, plan, status: f.method === "cod" ? "cod" : f.method === "transfer" ? "awaiting_review" : "pending", hasProof: f.method === "transfer" },
    status: initialStatus,
    history: [{ status: initialStatus, at: new Date() }],
  });

  if (f.method === "transfer" && proof instanceof File) {
    await PaymentProof.create({ orderId: order._id, mime: proof.type, data: Buffer.from(await proof.arrayBuffer()) });
  }
  if (coupon) await coupon.updateOne({ $inc: { uses: 1 }, $push: { usedBy: session.userId } });
  await Cart.updateOne({ userId: session.userId }, { $set: { items: [] } });

  // Big spenders get a coupon for next time (BR-57).
  if (total >= settings.bigOrderThreshold) {
    order.rewardCouponCode = await issueCoupon(session.userId, settings.bigOrderPercent, "big-order");
    await order.save();
  }

  updateTag(cartTag(session.userId));
  updateTag(ordersTag(session.userId));
  for (const l of lines) updateTag(`product:${l.slug}`);

  const h = await headers();
  const locale = form.get("locale") === "en" ? "en" : "ar";
  if (f.method === "card") {
    const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
    try {
      const url = await createPaymobCheckout({
        orderNumber: number,
        amountEgp: dueNow,
        customer: { name: f.name, email: f.email, phone: f.phone },
        address: { city: f.city, street: f.street, building: f.building, floor: f.floor, apartment: f.apartment, country: f.country },
        returnUrl: `${origin}/api/paymob/return?locale=${locale}`,
        webhookUrl: `${origin}/api/paymob/webhook`,
      });
      return { ok: true, redirect: url };
    } catch (error) {
      console.error("[checkout] Paymob:", error);
      return { ok: true, redirect: `/orders/${number}?payment=failed` };
    }
  }
  return { ok: true, redirect: `/orders/${number}?placed=1` };
}

/** Checks a coupon code for the checkout summary. */
export async function checkCoupon(code: string): Promise<{ ok: true; percent: number } | { ok: false }> {
  const session = await getSession();
  if (!session || !code.trim()) return { ok: false };
  const coupon = await findUsableCoupon(code, session.userId);
  return coupon ? { ok: true, percent: coupon.percent } : { ok: false };
}
