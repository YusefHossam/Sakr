"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { connectDB } from "@/lib/db";
import { ordersTag } from "@/lib/tags";
import { EXCHANGE_DAYS, ExchangeRequest, NON_EXCHANGEABLE } from "@/models/exchange";
import { Order } from "@/models/order";
import { User } from "@/models/user";

export type SimpleResult = { ok: true } | { ok: false; error: string };

const passportSchema = z.object({
  top: z.enum(["XS", "S", "M", "L", "XL", "XXL"]).nullable(),
  bottom: z.enum(["28", "30", "32", "34", "36", "38"]).nullable(),
  shoeUS: z.coerce.number().min(5).max(16).nullable(),
  heightCm: z.coerce.number().min(120).max(230).nullable(),
  weightKg: z.coerce.number().min(35).max(250).nullable(),
});

/** Size passport: one set of sizes reused on every product page (BR-51). */
export async function saveSizePassport(input: z.input<typeof passportSchema>): Promise<SimpleResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "login" };
  const parsed = passportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  await connectDB();
  await User.updateOne({ _id: session.userId }, { $set: { sizePassport: parsed.data } });
  return { ok: true };
}

const exchangeSchema = z.object({
  orderNumber: z.string().min(4).max(40),
  reason: z.enum(["size", "defect", "wrong-item"]),
  note: z.string().trim().max(500).optional().default(""),
  confirmUnworn: z.literal(true),
});

/** Exchange request: delivered orders only, within 14 days, unworn with tags, no underwear/socks (BR-40/41). */
export async function requestExchange(input: z.input<typeof exchangeSchema>): Promise<SimpleResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "login" };
  const parsed = exchangeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  await connectDB();
  const order = await Order.findOne({ number: parsed.data.orderNumber, userId: session.userId });
  if (!order || order.status !== "delivered") return { ok: false, error: "not-eligible" };
  const deliveredAt = [...order.history].reverse().find((h) => h.status === "delivered")?.at ?? order.updatedAt;
  if (Date.now() - new Date(deliveredAt as Date).getTime() > EXCHANGE_DAYS * 864e5) return { ok: false, error: "expired" };
  if (order.items.every((i) => NON_EXCHANGEABLE.test(i.title))) return { ok: false, error: "not-eligible" };
  if (await ExchangeRequest.exists({ orderId: order._id })) return { ok: false, error: "exists" };
  await ExchangeRequest.create({
    orderId: order._id,
    orderNumber: order.number,
    userId: session.userId,
    reason: parsed.data.reason,
    note: parsed.data.note,
  });
  updateTag(ordersTag(session.userId));
  return { ok: true };
}
