"use server";

import { randomBytes } from "node:crypto";
import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { connectDB } from "@/lib/db";
import { SAME_DAY, sameDayStatus } from "@/lib/delivery";
import { createPaymobCheckout, paymobEnabled } from "@/lib/paymob";
import { getSettings, shippingFee } from "@/lib/settings";
import { earliestDelivery } from "@/lib/shipping";
import { findUsableCoupon, getCartLines, issueCoupon } from "@/lib/shop-data";
import { cartTag, ordersTag } from "@/lib/tags";
import { moveWallet } from "@/lib/wallet";
import { REGIONS } from "@/lib/regions";
import { Cart } from "@/models/cart";
import { Order, PaymentProof } from "@/models/order";
import { Product } from "@/models/product";
import { User } from "@/models/user";

export type CheckoutError = "login" | "empty" | "stock" | "coupon" | "proof" | "invalid" | "cod" | "card" | "payment" | "wallet" | "sameday";
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
  sameDay: z.enum(["1", "0"]).optional().default("0"),
  gift: z.enum(["1", "0"]).optional().default("0"),
  giftTo: z.string().trim().max(80).optional().default(""),
  giftMessage: z.string().trim().max(240).optional().default(""),
  useWallet: z.enum(["1", "0"]).optional().default("0"),
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

  await connectDB();
  const [lines, settings] = await Promise.all([getCartLines(session.userId), getSettings()]);
  if (!lines.length) return { ok: false, error: "empty" };
  if (lines.some((l) => l.qty > l.stock)) return { ok: false, error: "stock" };

  const coupon = f.coupon ? await findUsableCoupon(f.coupon, session.userId) : null;
  if (f.coupon && !coupon) return { ok: false, error: "coupon" };

  // A pre-order is always a deposit order, paid up front (no cash on delivery).
  const preLines = lines.filter((l) => l.preorder);
  const isPreorder = preLines.length > 0;
  if (isPreorder && f.method === "cod") return { ok: false, error: "cod" };
  const plan = f.method === "cod" ? "full" : isPreorder ? "deposit" : f.plan;

  // Delivery: the day chosen, today (Greater Cairo, ordered before the cutoff), or no earlier than the pre-order ship date.
  const sameDay = f.sameDay === "1";
  const shipsAt = preLines.map((l) => l.shipsAt).filter((d): d is string => !!d).sort().pop() ?? null;
  let delivery = new Date(`${f.deliveryDate}T12:00:00`);
  if (sameDay) {
    const status = sameDayStatus(f.country, f.governorate, new Date());
    if (!status.eligible || isPreorder) return { ok: false, error: "sameday" };
    delivery = new Date(`${status.date}T12:00:00`);
  } else {
    let earliest = earliestDelivery(new Date(Date.now() - 864e5));
    if (shipsAt && new Date(`${shipsAt}T12:00:00`) > earliest) earliest = new Date(`${shipsAt}T12:00:00`);
    if (Number.isNaN(+delivery) || delivery < earliest) return { ok: false, error: "invalid", fields: ["deliveryDate"] };
  }

  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  // Discounts don't stack (BR-60): a coupon only applies to items not already on last-pieces sale.
  const couponBase = lines.filter((l) => l.unitPrice === l.listPrice).reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const discount = coupon ? Math.round((couponBase * coupon.percent) / 100) : 0;
  const shipping = shippingFee(settings, f.country, f.governorate) + (sameDay ? SAME_DAY.fee : 0);
  const total = subtotal - discount + shipping;
  const dueNowBase = f.method === "cod" ? 0 : plan === "deposit" ? Math.ceil(total / 2) : total;

  // The wallet pays what is due now (or part of the cash, for cash on delivery).
  const balance = f.useWallet === "1" ? ((await User.findById(session.userId).select("walletBalance").lean())?.walletBalance ?? 0) : 0;
  const walletUsed = Math.min(Math.floor(balance), f.method === "cod" ? total : dueNowBase);
  const dueNow = f.method === "cod" ? 0 : dueNowBase - walletUsed;
  const paidByWallet = f.method !== "cod" && dueNow === 0;

  const proof = form.get("proof");
  const needsProof = f.method === "transfer" && dueNow > 0;
  if (needsProof && (!(proof instanceof File) || !proof.size || proof.size > MAX_PROOF_BYTES || !proof.type.startsWith("image/"))) {
    return { ok: false, error: "proof" };
  }

  const number = orderNumber();
  // Reserve stock line by line (pre-order units for pre-order lines); undo everything if any line lost the race.
  const reserved: typeof lines = [];
  const undo = () =>
    Promise.all(
      reserved.map((r) =>
        r.preorder
          ? Product.updateOne({ slug: r.slug }, { $inc: { "preorder.taken": -r.qty } })
          : Product.updateOne({ slug: r.slug, variants: { $elemMatch: { size: r.size, color: r.color } } }, { $inc: { "variants.$.stock": r.qty } }),
      ),
    );
  for (const l of lines) {
    const res = l.preorder
      ? await Product.updateOne(
          { slug: l.slug, "preorder.enabled": true, $expr: { $lte: [{ $add: ["$preorder.taken", l.qty] }, "$preorder.limit"] } },
          { $inc: { "preorder.taken": l.qty } },
        )
      : await Product.updateOne(
          { slug: l.slug, variants: { $elemMatch: { size: l.size, color: l.color, stock: { $gte: l.qty } } } },
          { $inc: { "variants.$.stock": -l.qty } },
        );
    if (res.modifiedCount !== 1) {
      await undo();
      return { ok: false, error: "stock" };
    }
    reserved.push(l);
  }
  if (walletUsed > 0 && (await moveWallet(session.userId, -walletUsed, "order", { orderNumber: number, note: "Paid with wallet" })) === null) {
    await undo();
    return { ok: false, error: "wallet" };
  }

  const initialStatus = paidByWallet ? "confirmed" : f.method === "card" ? "awaiting_payment" : "pending";
  const paymentStatus = paidByWallet ? (plan === "deposit" ? "deposit_paid" : "paid") : f.method === "cod" ? "cod" : f.method === "transfer" ? "awaiting_review" : "pending";
  const order = await Order.create({
    number,
    userId: session.userId,
    items: lines.map((l) => ({
      productSlug: l.slug, title: l.title, brand: l.brand, image: l.image, size: l.size, color: l.color,
      qty: l.qty, unitPrice: l.unitPrice, listPrice: l.listPrice, costPrice: l.costPrice, preorder: l.preorder,
    })),
    subtotal, discount, couponCode: coupon?.code ?? null, shipping, total, dueNow,
    contact: { name: f.name, email: f.email, phone: f.phone, phone2: f.phone2 },
    address: {
      country: f.country, governorate: f.country === "EG" ? f.governorate : "", city: f.city, street: f.street,
      building: f.building, floor: f.floor, apartment: f.apartment, landmark: f.landmark, lat: f.lat ?? null, lng: f.lng ?? null,
    },
    deliveryDate: delivery,
    notes: f.notes,
    walletUsed,
    sameDay,
    gift: { enabled: f.gift === "1", to: f.giftTo, message: f.giftMessage },
    preorder: { enabled: isPreorder, shipsAt: shipsAt ? new Date(`${shipsAt}T12:00:00`) : null },
    payment: { method: f.method, plan, status: paymentStatus, hasProof: needsProof },
    status: initialStatus,
    history: [{ status: initialStatus, at: new Date(), note: paidByWallet ? "Paid with wallet" : isPreorder ? "Pre-order" : sameDay ? "Same-day delivery" : "" }],
  }).catch(async (error: unknown) => {
    // Give back what was taken: stock, pre-order units and wallet.
    console.error("[checkout] could not create the order:", error);
    await undo();
    if (walletUsed > 0) await moveWallet(session.userId, walletUsed, "order-cancelled", { orderNumber: number, note: "Order failed" });
    return null;
  });
  if (!order) return { ok: false, error: "invalid" };

  if (needsProof && proof instanceof File) {
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
  if (f.method === "card" && dueNow > 0) {
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
