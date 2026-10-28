"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { audit } from "@/lib/audit";
import { CATALOG_TAG } from "@/lib/catalog";
import { connectDB } from "@/lib/db";
import { restock } from "@/lib/orders";
import { reviewsTag } from "@/lib/reviews";
import { getSettings } from "@/lib/settings";
import { issueCoupon } from "@/lib/shop-data";
import { ordersTag, SETTINGS_TAG } from "@/lib/tags";
import { Brand } from "@/models/brand";
import { Coupon } from "@/models/coupon";
import { NotifyRequest, Review } from "@/models/engagement";
import { ExchangeRequest } from "@/models/exchange";
import { Order, ORDER_STATUSES } from "@/models/order";
import { CATEGORIES, Product } from "@/models/product";
import { Settings } from "@/models/settings";
import { CASHBACK, moveWallet, refundWalletUse } from "@/lib/wallet";
import { levelFor, User } from "@/models/user";

export type AdminResult = { ok: true; message?: string } | { ok: false; error: string };

const POINTS_PER_EGP = 1 / 100;

// ---------- Orders ----------

export async function approvePayment(number: string): Promise<AdminResult> {
  const admin = await requireAdmin();
  await audit(admin, "approvePayment", number);
  await connectDB();
  const order = await Order.findOne({ number });
  if (!order || order.payment!.status !== "awaiting_review") return { ok: false, error: "state" };
  order.payment!.status = order.payment!.plan === "deposit" ? "deposit_paid" : "paid";
  if (order.status === "pending") {
    order.status = "confirmed";
    order.history.push({ status: "confirmed", at: new Date(), note: "Transfer approved" });
  }
  await order.save();
  updateTag(ordersTag(String(order.userId)));
  return { ok: true };
}

export async function rejectOrder(number: string): Promise<AdminResult> {
  const admin = await requireAdmin();
  await audit(admin, "rejectOrder", number);
  await connectDB();
  const order = await Order.findOne({ number });
  if (!order || order.status === "cancelled" || order.status === "delivered") return { ok: false, error: "state" };
  order.status = "cancelled";
  if (order.payment!.status === "awaiting_review") order.payment!.status = "rejected";
  order.history.push({ status: "cancelled", at: new Date(), note: "Cancelled by admin" });
  await order.save();
  await restock(order.items);
  await refundWalletUse(order);
  updateTag(ordersTag(String(order.userId)));
  return { ok: true };
}

const statusSchema = z.enum(ORDER_STATUSES);

export async function setOrderStatus(number: string, status: z.input<typeof statusSchema>): Promise<AdminResult> {
  const admin = await requireAdmin();
  await audit(admin, "setOrderStatus", number);
  const next = statusSchema.parse(status);
  if (next === "cancelled") return rejectOrder(number);
  await connectDB();
  const order = await Order.findOne({ number });
  if (!order || order.status === "cancelled" || order.status === next) return { ok: false, error: "state" };
  const wasDelivered = order.status === "delivered";
  order.status = next;
  order.history.push({ status: next, at: new Date(), note: "" });
  // Delivered orders count toward the customer's level and earn points (BR-38 / BR-53).
  if (next === "delivered" && !wasDelivered) {
    if (order.payment!.method === "cod") order.payment!.status = "paid";
    // Cashback by level goes to the wallet: the level the customer had before this order counts.
    const buyer = await User.findById(order.userId).select("totalSpent");
    const cashback = buyer ? Math.round(order.total * CASHBACK[levelFor(buyer.totalSpent)]) : 0;
    if (cashback > 0) await moveWallet(String(order.userId), cashback, "cashback", { orderNumber: order.number, note: `${Math.round(CASHBACK[levelFor(buyer!.totalSpent)] * 100)}% cashback` });
    await User.updateOne({ _id: order.userId }, { $inc: { totalSpent: order.total, points: Math.floor(order.total * POINTS_PER_EGP) } });
  }
  await order.save();
  updateTag(ordersTag(String(order.userId)));
  return { ok: true };
}

/** Late order: tell the customer why, with an apology coupon (BR-62). */
export async function sendApology(number: string, reason: string): Promise<AdminResult> {
  const admin = await requireAdmin();
  await audit(admin, "sendApology", number);
  const text = reason.trim().slice(0, 300);
  if (text.length < 3) return { ok: false, error: "reason" };
  await connectDB();
  const order = await Order.findOne({ number });
  if (!order) return { ok: false, error: "state" };
  if (order.delay?.couponCode) return { ok: true, message: order.delay.couponCode };
  const { apologyPercent } = await getSettings();
  const code = await issueCoupon(String(order.userId), apologyPercent, "apology");
  order.delay = { reason: text, couponCode: code, notifiedAt: new Date() };
  await order.save();
  updateTag(ordersTag(String(order.userId)));
  return { ok: true, message: code };
}

// ---------- Products ----------

const productEditSchema = z.object({
  price: z.coerce.number().int().min(1).max(10_000_000),
  costPrice: z.coerce.number().int().min(0).max(10_000_000),
  active: z.boolean(),
  promoPercent: z.coerce.number().int().min(0).max(90),
  variants: z.array(z.object({ size: z.string().nullable(), color: z.string().nullable(), stock: z.coerce.number().int().min(0).max(100_000) })).max(200),
});

export async function saveProduct(slug: string, input: z.input<typeof productEditSchema>): Promise<AdminResult> {
  const admin = await requireAdmin();
  await audit(admin, "saveProduct", slug);
  const parsed = productEditSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { price, costPrice, active, promoPercent, variants } = parsed.data;
  await connectDB();
  const product = await Product.findOne({ slug });
  if (!product) return { ok: false, error: "not-found" };
  product.price = price;
  product.costPrice = costPrice;
  product.active = active;
  for (const v of product.variants) {
    const edit = variants.find((e) => (e.size ?? null) === (v.size ?? null) && (e.color ?? null) === (v.color ?? null));
    if (edit) v.stock = edit.stock;
  }
  await product.save();
  // A product-level discount is stored as a "product" promotion.
  await Settings.updateOne({ key: "store" }, { $pull: { promos: { scope: "product", key: slug } } }, { upsert: true });
  if (promoPercent > 0) await Settings.updateOne({ key: "store" }, { $push: { promos: { scope: "product", key: slug, percent: promoPercent, endsAt: null } } });
  updateTag(`product:${slug}`);
  updateTag(CATALOG_TAG);
  updateTag(SETTINGS_TAG);
  return { ok: true };
}

const newProductSchema = z.object({
  title: z.string().trim().min(2).max(140),
  brand: z.string().trim().min(1).max(60),
  category: z.enum(CATEGORIES),
  price: z.coerce.number().int().min(1),
  costPrice: z.coerce.number().int().min(0).default(0),
  description: z.string().trim().max(3000).default(""),
  images: z.array(z.string().url()).min(1).max(12),
  variants: z.array(z.object({ size: z.string().min(1).max(20), stock: z.coerce.number().int().min(0) })).min(1).max(40),
});

const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-");

/** "ينزل بردكت": adds a product by hand (e.g. Dior/Gucci pieces the scrapers couldn't reach). */
export async function createProduct(input: z.input<typeof newProductSchema>): Promise<AdminResult> {
  const admin = await requireAdmin();
  await audit(admin, "createProduct", input);
  const parsed = newProductSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const d = parsed.data;
  await connectDB();
  const brandSlug = slugify(d.brand);
  let slug = `${brandSlug}-${slugify(d.title)}`.slice(0, 90);
  if (await Product.exists({ slug })) slug = `${slug}-${Date.now().toString(36)}`;
  await Product.create({
    slug, title: d.title, description: d.description, brand: d.brand, brandSlug, category: d.category, price: d.price,
    costPrice: d.costPrice, images: d.images, sizes: d.variants.map((v) => v.size),
    variants: d.variants.map((v) => ({ size: v.size, color: null, stock: v.stock })), publishedAt: new Date(), active: true,
  });
  await Brand.updateOne(
    { slug: brandSlug },
    { $setOnInsert: { name: d.brand, slug: brandSlug }, $addToSet: { categories: d.category }, $inc: { productCount: 1 } },
    { upsert: true },
  );
  updateTag(CATALOG_TAG);
  return { ok: true, message: slug };
}

// ---------- Promotions & coupons ----------

const promoSchema = z.object({
  scope: z.enum(["site", "brand", "category", "product"]),
  key: z.string().trim().max(120).default(""),
  percent: z.coerce.number().int().min(1).max(90),
  endsAt: z.string().optional().default(""),
});

export async function addPromo(input: z.input<typeof promoSchema>): Promise<AdminResult> {
  const admin = await requireAdmin();
  await audit(admin, "addPromo", input);
  const parsed = promoSchema.safeParse(input);
  if (!parsed.success || (parsed.data.scope !== "site" && !parsed.data.key)) return { ok: false, error: "invalid" };
  await connectDB();
  const endsAt = parsed.data.endsAt ? new Date(parsed.data.endsAt) : null;
  await Settings.updateOne({ key: "store" }, { $push: { promos: { ...parsed.data, endsAt } } }, { upsert: true });
  updateTag(SETTINGS_TAG);
  return { ok: true };
}

export async function removePromo(index: number): Promise<AdminResult> {
  const admin = await requireAdmin();
  await audit(admin, "removePromo", index);
  await connectDB();
  const doc = await Settings.findOne({ key: "store" });
  if (!doc || !doc.promos[index]) return { ok: false, error: "not-found" };
  doc.promos.splice(index, 1);
  await doc.save();
  updateTag(SETTINGS_TAG);
  return { ok: true };
}

const couponSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{3,30}$/),
  percent: z.coerce.number().int().min(1).max(90),
  maxUses: z.coerce.number().int().min(0).max(100_000),
  expiresAt: z.string().optional().default(""),
  influencer: z.string().trim().max(60).optional().default(""),
  customerEmail: z.string().trim().toLowerCase().optional().default(""),
});

export async function createCoupon(input: z.input<typeof couponSchema>): Promise<AdminResult> {
  const admin = await requireAdmin();
  await audit(admin, "createCoupon", input);
  const parsed = couponSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const d = parsed.data;
  await connectDB();
  if (await Coupon.exists({ code: d.code })) return { ok: false, error: "exists" };
  const user = d.customerEmail ? await User.findOne({ email: d.customerEmail }).select("_id") : null;
  if (d.customerEmail && !user) return { ok: false, error: "customer" };
  await Coupon.create({
    code: d.code, percent: d.percent, maxUses: d.maxUses, expiresAt: d.expiresAt ? new Date(d.expiresAt) : null,
    influencer: d.influencer || null, userId: user?._id ?? null, reason: d.influencer ? "influencer" : user ? "vip" : "manual",
  });
  return { ok: true };
}

export async function deactivateCoupon(code: string): Promise<AdminResult> {
  const admin = await requireAdmin();
  await audit(admin, "deactivateCoupon", code);
  await connectDB();
  await Coupon.updateOne({ code }, { $set: { active: false } });
  return { ok: true };
}

// ---------- Inbox ----------

export async function moderateReview(id: string, approve: boolean): Promise<AdminResult> {
  const admin = await requireAdmin();
  await audit(admin, "moderateReview", id);
  await connectDB();
  const review = approve ? await Review.findByIdAndUpdate(id, { approved: true }) : await Review.findByIdAndDelete(id);
  if (review) updateTag(reviewsTag(review.productSlug));
  return { ok: true };
}

export async function setExchangeStatus(id: string, status: "approved" | "rejected"): Promise<AdminResult> {
  const admin = await requireAdmin();
  await audit(admin, "setExchangeStatus", id);
  await connectDB();
  const ex = await ExchangeRequest.findByIdAndUpdate(id, { status });
  if (ex) updateTag(ordersTag(String(ex.userId)));
  return { ok: true };
}

export async function markRestockHandled(id: string): Promise<AdminResult> {
  const admin = await requireAdmin();
  await audit(admin, "markRestockHandled", id);
  await connectDB();
  await NotifyRequest.findByIdAndUpdate(id, { notified: true });
  return { ok: true };
}

// ---------- Settings ----------

const settingsSchema = z.object({
  dropLocked: z.boolean(),
  dropPassword: z.string().max(60),
  dropName: z.string().trim().min(1).max(40),
  dropOpensAt: z.string().optional().default(""),
  vipEarlyHours: z.coerce.number().int().min(0).max(72),
  transferInstapay: z.string().trim().max(80),
  transferWallet: z.string().trim().max(30),
  bigOrderThreshold: z.coerce.number().int().min(0),
  bigOrderPercent: z.coerce.number().int().min(1).max(90),
  apologyPercent: z.coerce.number().int().min(1).max(90),
  shippingEgypt: z.record(z.string(), z.coerce.number().int().min(0).max(100_000)),
});

export async function saveSettings(input: z.input<typeof settingsSchema>): Promise<AdminResult> {
  const admin = await requireAdmin();
  await audit(admin, "saveSettings", "store settings");
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const d = parsed.data;
  await connectDB();
  await Settings.updateOne(
    { key: "store" },
    {
      $set: {
        "drop.locked": d.dropLocked,
        "drop.password": d.dropPassword,
        "drop.name": d.dropName,
        "drop.opensAt": d.dropOpensAt ? new Date(d.dropOpensAt) : null,
        "drop.vipEarlyHours": d.vipEarlyHours,
        transferInstapay: d.transferInstapay,
        transferWallet: d.transferWallet,
        bigOrderThreshold: d.bigOrderThreshold,
        bigOrderPercent: d.bigOrderPercent,
        apologyPercent: d.apologyPercent,
        shippingEgypt: d.shippingEgypt,
      },
    },
    { upsert: true },
  );
  updateTag(SETTINGS_TAG);
  return { ok: true };
}
