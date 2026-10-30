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
  sameDay: boolean;
  gift: { to: string; message: string } | null;
  preorderShipsAt: string | null;
  walletUsed: number;
  contact: { name: string; phone: string; phone2: string };
  address: { lines: string[]; city: string; governorate: string; country: string };
  paymentPlan: string;
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
    sameDay: !!o.sameDay,
    gift: o.gift?.enabled ? { to: o.gift.to ?? "", message: o.gift.message ?? "" } : null,
    preorderShipsAt: o.preorder?.enabled ? (o.preorder.shipsAt ? new Date(o.preorder.shipsAt).toISOString().slice(0, 10) : "") : null,
    walletUsed: o.walletUsed ?? 0,
    contact: { name: o.contact!.name, phone: o.contact!.phone, phone2: o.contact!.phone2 ?? "" },
    paymentPlan: o.payment!.plan ?? "full",
    address: {
      city: o.address!.city,
      governorate: o.address!.governorate ?? "",
      country: o.address!.country,
      lines: [
        [o.address!.street, o.address!.building && `#${o.address!.building}`, o.address!.floor && `F${o.address!.floor}`, o.address!.apartment && `Apt ${o.address!.apartment}`].filter(Boolean).join(", "),
        o.address!.landmark ?? "",
      ].filter(Boolean),
    },
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

/** Whether a delivered order is still inside the exchange window. */
export function exchangeOpen(o: OrderSummary, days: number): boolean {
  const deliveredAt = o.history.findLast((h) => h.status === "delivered")?.at;
  return !!deliveredAt && Date.now() - Date.parse(deliveredAt) <= days * 864e5;
}

export async function getOrdersForUser(userId: string): Promise<OrderSummary[]> {
  await connectDB();
  const docs = await Order.find({ userId }).sort({ createdAt: -1 }).limit(50).lean<(OrderDoc & { createdAt: Date })[]>();
  return docs.map(toSummary);
}
