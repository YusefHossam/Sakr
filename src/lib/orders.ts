import "server-only";
import { revalidateTag } from "next/cache";
import { connectDB } from "./db";
import { ordersTag } from "./tags";
import { refundWalletUse } from "./wallet";
import { Order } from "@/models/order";
import { Product } from "@/models/product";

// revalidateTag (not updateTag) because these also run from route handlers (Paymob callbacks).
/** Puts an order's items back on the shelf (cancelled or failed orders). */
export async function restock(items: { productSlug: string; size?: string | null; color?: string | null; qty: number; preorder?: boolean | null }[]) {
  await Promise.all(
    items.map((i) =>
      i.preorder
        ? Product.updateOne({ slug: i.productSlug }, { $inc: { "preorder.taken": -i.qty } })
        : Product.updateOne({ slug: i.productSlug, variants: { $elemMatch: { size: i.size ?? null, color: i.color ?? null } } }, { $inc: { "variants.$.stock": i.qty } }),
    ),
  );
  for (const i of items) revalidateTag(`product:${i.productSlug}`, { expire: 0 });
}

/** Applies a Paymob transaction result to its order (idempotent). */
export async function settleCardPayment(orderNumber: string, success: boolean, transactionId: string, paymobOrderId: string) {
  await connectDB();
  const order = await Order.findOne({ number: orderNumber });
  if (!order || order.payment!.method !== "card" || order.payment!.status === "paid" || order.payment!.status === "deposit_paid") return order;
  order.payment!.paymobTransactionId = transactionId;
  order.payment!.paymobOrderId = paymobOrderId;
  if (success) {
    order.payment!.status = order.payment!.plan === "deposit" ? "deposit_paid" : "paid";
    order.status = "confirmed";
    order.history.push({ status: "confirmed", at: new Date(), note: "Card payment" });
  } else if (order.status === "awaiting_payment") {
    order.payment!.status = "rejected";
    order.status = "cancelled";
    order.history.push({ status: "cancelled", at: new Date(), note: "Card payment failed" });
    await restock(order.items);
    await refundWalletUse(order);
  }
  await order.save();
  revalidateTag(ordersTag(String(order.userId)), { expire: 0 });
  return order;
}
