"use server";

import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { updateTag } from "next/cache";
import { z } from "zod";
import type { AdminResult } from "@/lib/actions/admin";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/admin";
import { CATALOG_TAG } from "@/lib/catalog";
import { connectDB } from "@/lib/db";
import { issueCoupon } from "@/lib/shop-data";
import { ordersTag, SETTINGS_TAG } from "@/lib/tags";
import { moveWallet } from "@/lib/wallet";
import { Order } from "@/models/order";
import { Product, CATEGORIES } from "@/models/product";
import { Settings } from "@/models/settings";
import { LEVEL_THRESHOLDS, LEVELS, User } from "@/models/user";

const objectId = z.string().regex(/^[a-f\d]{24}$/i);

// ---------- Customers ----------

export async function setCustomerBlocked(id: string, blocked: boolean): Promise<AdminResult> {
  const admin = await requireAdmin();
  if (!objectId.safeParse(id).success) return { ok: false, error: "invalid" };
  if (id === admin.userId) return { ok: false, error: "self" };
  await connectDB();
  await User.updateOne({ _id: id }, { $set: { blocked } });
  await audit(admin, blocked ? "customer.block" : "customer.unblock", id);
  return { ok: true };
}

export async function setCustomerRole(id: string, role: "customer" | "admin"): Promise<AdminResult> {
  const admin = await requireAdmin();
  if (!objectId.safeParse(id).success || !["customer", "admin"].includes(role)) return { ok: false, error: "invalid" };
  if (id === admin.userId) return { ok: false, error: "self" };
  await connectDB();
  await User.updateOne({ _id: id }, { $set: { role } });
  await audit(admin, "customer.role", id, role);
  return { ok: true };
}

/** Sets a new random password and returns it once, so the admin can pass it on. */
export async function resetCustomerPassword(id: string): Promise<AdminResult> {
  const admin = await requireAdmin();
  if (!objectId.safeParse(id).success) return { ok: false, error: "invalid" };
  await connectDB();
  const password = randomBytes(6).toString("base64url");
  const res = await User.updateOne({ _id: id }, { $set: { passwordHash: await bcrypt.hash(password, 10) } });
  if (!res.matchedCount) return { ok: false, error: "not-found" };
  await audit(admin, "customer.reset-password", id);
  return { ok: true, message: password };
}

export async function setCustomerLevel(id: string, level: (typeof LEVELS)[number]): Promise<AdminResult> {
  const admin = await requireAdmin();
  if (!objectId.safeParse(id).success || !LEVELS.includes(level)) return { ok: false, error: "invalid" };
  await connectDB();
  const user = await User.findById(id).select("totalSpent");
  if (!user) return { ok: false, error: "not-found" };
  // The level comes from lifetime spend, so a manual level lifts the spend to that tier's threshold (never lowers it below it).
  const target = LEVEL_THRESHOLDS[level];
  const next = level === "rookie" ? Math.min(user.totalSpent, LEVEL_THRESHOLDS.og - 1) : Math.max(user.totalSpent, target);
  await User.updateOne({ _id: id }, { $set: { totalSpent: next } });
  await audit(admin, "customer.level", id, level);
  return { ok: true };
}

export async function addCustomerPoints(id: string, points: number): Promise<AdminResult> {
  const admin = await requireAdmin();
  const n = Math.trunc(Number(points));
  if (!objectId.safeParse(id).success || !Number.isFinite(n) || n === 0 || Math.abs(n) > 1_000_000) return { ok: false, error: "invalid" };
  await connectDB();
  await User.updateOne({ _id: id }, { $inc: { points: n } });
  await audit(admin, "customer.points", id, String(n));
  return { ok: true };
}

export async function grantCustomerCoupon(id: string, percent: number): Promise<AdminResult> {
  const admin = await requireAdmin();
  const p = Math.trunc(Number(percent));
  if (!objectId.safeParse(id).success || p < 1 || p > 90) return { ok: false, error: "invalid" };
  const code = await issueCoupon(id, p, "vip");
  await audit(admin, "customer.coupon", id, `${code} ${p}%`);
  return { ok: true, message: code };
}

export async function saveCustomerNote(id: string, note: string): Promise<AdminResult> {
  const admin = await requireAdmin();
  if (!objectId.safeParse(id).success) return { ok: false, error: "invalid" };
  await connectDB();
  await User.updateOne({ _id: id }, { $set: { adminNote: note.trim().slice(0, 500) } });
  await audit(admin, "customer.note", id);
  return { ok: true };
}

// ---------- Catalog tools (bulk) ----------

const scopeSchema = z.object({ scope: z.enum(["all", "brand", "category"]), key: z.string().trim().max(80).default("") });
type Scope = z.input<typeof scopeSchema>;

function scopeFilter(input: Scope): Record<string, string> | null {
  const parsed = scopeSchema.safeParse(input);
  if (!parsed.success) return null;
  const { scope, key } = parsed.data;
  if (scope === "all") return {};
  if (!key) return null;
  if (scope === "category") return (CATEGORIES as readonly string[]).includes(key) ? { category: key } : null;
  return { brandSlug: key };
}

/** Raises or lowers every price in the scope by a percentage (rounded to the nearest 10 EGP). */
export async function bulkPrice(input: Scope, percent: number): Promise<AdminResult> {
  const admin = await requireAdmin();
  const filter = scopeFilter(input);
  const pct = Number(percent);
  if (!filter || !Number.isFinite(pct) || pct === 0 || pct < -90 || pct > 300) return { ok: false, error: "invalid" };
  await connectDB();
  const res = await Product.updateMany(filter, [{ $set: { price: { $max: [10, { $round: [{ $multiply: ["$price", 1 + pct / 100] }, -1] }] } } }]);
  updateTag(CATALOG_TAG);
  await audit(admin, "bulk.price", input, `${pct}% on ${res.modifiedCount}`);
  return { ok: true, message: String(res.modifiedCount) };
}

export async function bulkActive(input: Scope, active: boolean): Promise<AdminResult> {
  const admin = await requireAdmin();
  const filter = scopeFilter(input);
  if (!filter || (input.scope === "all" && !active)) return { ok: false, error: "invalid" };
  await connectDB();
  const res = await Product.updateMany(filter, { $set: { active } });
  updateTag(CATALOG_TAG);
  await audit(admin, active ? "bulk.show" : "bulk.hide", input, String(res.modifiedCount));
  return { ok: true, message: String(res.modifiedCount) };
}

/** Sets every size of every product in the scope to the same stock. */
export async function bulkStock(input: Scope, qty: number): Promise<AdminResult> {
  const admin = await requireAdmin();
  const filter = scopeFilter(input);
  const n = Math.trunc(Number(qty));
  if (!filter || !Number.isFinite(n) || n < 0 || n > 10_000) return { ok: false, error: "invalid" };
  await connectDB();
  const res = await Product.updateMany(filter, { $set: { "variants.$[].stock": n } });
  updateTag(CATALOG_TAG);
  await audit(admin, "bulk.stock", input, `${n} on ${res.modifiedCount}`);
  return { ok: true, message: String(res.modifiedCount) };
}

/** Quick restock from the low-stock list: every size of one product gets the same stock. */
export async function restockProduct(slug: string, qty: number): Promise<AdminResult> {
  const admin = await requireAdmin();
  const n = Math.trunc(Number(qty));
  if (!Number.isFinite(n) || n < 0 || n > 10_000) return { ok: false, error: "invalid" };
  await connectDB();
  await Product.updateOne({ slug }, { $set: { "variants.$[v].stock": n } }, { arrayFilters: [{ "v.stock": { $lt: n } }] });
  updateTag(`product:${slug}`);
  updateTag(CATALOG_TAG);
  await audit(admin, "product.restock", slug, String(n));
  return { ok: true };
}

// ---------- Orders ----------

export async function saveOrderNote(number: string, note: string): Promise<AdminResult> {
  const admin = await requireAdmin();
  await connectDB();
  await Order.updateOne({ number }, { $set: { adminNote: note.trim().slice(0, 500) } });
  await audit(admin, "order.note", number);
  return { ok: true };
}

export async function setOrderRefunded(number: string, refunded: boolean): Promise<AdminResult> {
  const admin = await requireAdmin();
  await connectDB();
  const order = await Order.findOneAndUpdate({ number }, { $set: { refunded } });
  if (!order) return { ok: false, error: "not-found" };
  updateTag(ordersTag(String(order.userId)));
  await audit(admin, refunded ? "order.refund" : "order.unrefund", number);
  return { ok: true };
}

export async function setDeliveryDate(number: string, date: string): Promise<AdminResult> {
  const admin = await requireAdmin();
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return { ok: false, error: "invalid" };
  await connectDB();
  const order = await Order.findOneAndUpdate({ number }, { $set: { deliveryDate: d } });
  if (!order) return { ok: false, error: "not-found" };
  updateTag(ordersTag(String(order.userId)));
  await audit(admin, "order.delivery-date", number, date);
  return { ok: true };
}

// ---------- Content ----------

const contentSchema = z.object({
  announcementText: z.string().trim().max(140),
  announcementActive: z.boolean(),
  banners: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(60),
        text: z.string().trim().max(160).default(""),
        href: z.string().trim().max(200).regex(/^\/[^\s]*$/, "internal path").default("/shop"),
        image: z.string().trim().max(500).refine((v) => v === "" || /^https?:\/\//.test(v) || v.startsWith("/"), "url").default(""),
        active: z.boolean().default(true),
      }),
    )
    .max(8),
});

export async function saveContent(input: z.input<typeof contentSchema>): Promise<AdminResult> {
  const admin = await requireAdmin();
  const parsed = contentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const d = parsed.data;
  await connectDB();
  await Settings.updateOne({ key: "store" }, { $set: { announcement: { text: d.announcementText, active: d.announcementActive }, banners: d.banners } }, { upsert: true });
  updateTag(SETTINGS_TAG);
  await audit(admin, "content.save", "announcement + banners", `${d.banners.length} banners`);
  return { ok: true };
}

// ---------- Wallet and pre-orders (phase C) ----------

/** Adds or takes money from a customer's wallet (a gift, a correction). Negative amounts fail rather than going below zero. */
export async function adjustCustomerWallet(id: string, amount: number, note: string): Promise<AdminResult> {
  const admin = await requireAdmin();
  const n = Math.trunc(Number(amount));
  if (!objectId.safeParse(id).success || !Number.isFinite(n) || n === 0 || Math.abs(n) > 1_000_000) return { ok: false, error: "invalid" };
  const balance = await moveWallet(id, n, n > 0 ? "gift" : "adjustment", { note: note.trim().slice(0, 200) });
  if (balance === null) return { ok: false, error: "funds" };
  await audit(admin, "customer.wallet", id, `${n} (${note.slice(0, 60)})`);
  return { ok: true, message: String(balance) };
}

/** Refunds an order into the customer's wallet, once. The amount defaults to the order total. */
export async function refundOrderToWallet(number: string, amount?: number): Promise<AdminResult> {
  const admin = await requireAdmin();
  await connectDB();
  const order = await Order.findOne({ number });
  if (!order) return { ok: false, error: "not-found" };
  if (order.refunded) return { ok: false, error: "already" };
  const value = Math.trunc(Number(amount ?? order.total));
  if (!Number.isFinite(value) || value < 1 || value > order.total) return { ok: false, error: "invalid" };
  const balance = await moveWallet(String(order.userId), value, "refund", { orderNumber: number, note: "Order refund" });
  if (balance === null) return { ok: false, error: "invalid" };
  order.refunded = true;
  order.history.push({ status: order.status, at: new Date(), note: `Refunded ${value} EGP to wallet` });
  await order.save();
  updateTag(ordersTag(String(order.userId)));
  await audit(admin, "order.refund-wallet", number, String(value));
  return { ok: true, message: String(balance) };
}

const preorderSchema = z.object({
  enabled: z.boolean(),
  limit: z.coerce.number().int().min(0).max(100_000),
  shipsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal("")),
});

/** Opens or closes pre-orders on a product: units on offer and the date it ships. */
export async function setPreorder(slug: string, input: z.input<typeof preorderSchema>): Promise<AdminResult> {
  const admin = await requireAdmin();
  const parsed = preorderSchema.safeParse(input);
  if (!parsed.success || (parsed.data.enabled && !parsed.data.shipsAt)) return { ok: false, error: "invalid" };
  await connectDB();
  const res = await Product.updateOne(
    { slug },
    { $set: { "preorder.enabled": parsed.data.enabled, "preorder.limit": parsed.data.limit, "preorder.shipsAt": parsed.data.shipsAt ? new Date(`${parsed.data.shipsAt}T12:00:00`) : null } },
  );
  if (!res.matchedCount) return { ok: false, error: "not-found" };
  updateTag(`product:${slug}`);
  updateTag(CATALOG_TAG);
  await audit(admin, "product.preorder", slug, parsed.data.enabled ? `${parsed.data.limit} units, ships ${parsed.data.shipsAt}` : "closed");
  return { ok: true };
}
