import "server-only";
import { connectDB } from "./db";
import { Order, type OrderDoc } from "@/models/order";

export type OrderSummary = {
  number: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  deliveryDate: string;
  items: { productSlug: string; title: string; brand: string; image: string | null; size: string | null; qty: number; unitPrice: number }[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  dueNow: number;
  history: { status: string; at: string; note: string }[];
  pin: [number, number] | null;
  delayReason: string | null;
  delayCoupon: string | null;
  rewardCoupon: string | null;
};

export function toSummary(o: OrderDoc & { createdAt?: Date }): OrderSummary {
  return {
    number: o.number,
    status: o.status,
    paymentStatus: o.payment!.status,
    paymentMethod: o.payment!.method,
    createdAt: (o.createdAt ?? new Date()).toISOString(),
    deliveryDate: new Date(o.deliveryDate).toISOString().slice(0, 10),
    items: o.items.map((i) => ({ productSlug: i.productSlug, title: i.title, brand: i.brand, image: i.image ?? null, size: i.size ?? null, qty: i.qty, unitPrice: i.unitPrice })),
    subtotal: o.subtotal,
    discount: o.discount,
    shipping: o.shipping,
    total: o.total,
    dueNow: o.dueNow,
    history: o.history.map((h) => ({ status: h.status ?? "", at: new Date(h.at ?? Date.now()).toISOString(), note: h.note ?? "" })),
    pin: o.address!.lat != null && o.address!.lng != null ? [o.address!.lat, o.address!.lng] : null,
    delayReason: o.delay?.reason ?? null,
    delayCoupon: o.delay?.couponCode ?? null,
    rewardCoupon: o.rewardCouponCode ?? null,
  };
}

export async function getOrderForUser(number: string, userId: string): Promise<OrderSummary | null> {
  await connectDB();
  const o = await Order.findOne({ number, userId }).lean<OrderDoc & { createdAt: Date }>();
  return o ? toSummary(o) : null;
}

/** Guest tracking: order number + the phone used at checkout (no login). */
export async function findOrderByPhone(number: string, phone: string): Promise<OrderSummary | null> {
  await connectDB();
  const digits = phone.replace(/\D/g, "").slice(-9);
  if (digits.length < 8) return null;
  const o = await Order.findOne({ number: number.trim().toUpperCase() }).lean<OrderDoc & { createdAt: Date }>();
  if (!o) return null;
  const match = [o.contact!.phone, o.contact!.phone2].some((p) => p && p.replace(/\D/g, "").endsWith(digits));
  return match ? toSummary(o) : null;
}

export async function getOrdersForUser(userId: string): Promise<OrderSummary[]> {
  await connectDB();
  const docs = await Order.find({ userId }).sort({ createdAt: -1 }).limit(50).lean<(OrderDoc & { createdAt: Date })[]>();
  return docs.map(toSummary);
}
