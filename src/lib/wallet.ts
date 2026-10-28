import "server-only";
import { connectDB } from "./db";
import { WalletTx, type WalletTxDoc } from "@/models/wallet";
import { User } from "@/models/user";
import type { OrderDoc } from "@/models/order";

type Reason = WalletTxDoc["reason"];

/** Cashback by level, paid into the wallet when an order is delivered. */
export const CASHBACK: Record<"rookie" | "og" | "legend", number> = { rookie: 0, og: 0.02, legend: 0.04 };

/** Adds (or, if negative, takes) money. A debit never goes below zero: it fails instead. Returns the new balance. */
export async function moveWallet(userId: string, amount: number, reason: Reason, opts: { orderNumber?: string; note?: string } = {}): Promise<number | null> {
  const delta = Math.round(amount);
  if (!delta) return null;
  await connectDB();
  const user = await User.findOneAndUpdate(
    delta < 0 ? { _id: userId, walletBalance: { $gte: -delta } } : { _id: userId },
    { $inc: { walletBalance: delta } },
    { new: true, projection: { walletBalance: 1 } },
  );
  if (!user) return null;
  await WalletTx.create({ userId, amount: delta, reason, orderNumber: opts.orderNumber ?? null, note: opts.note ?? "", balanceAfter: user.walletBalance });
  return user.walletBalance;
}

/** Gives back what an order took from the wallet (cancelled or failed orders). Safe to call twice. */
export async function refundWalletUse(order: Pick<OrderDoc, "walletUsed" | "number" | "userId"> & { walletRefunded?: boolean | null; save: () => Promise<unknown> }) {
  if (!order.walletUsed || order.walletRefunded) return;
  order.walletRefunded = true;
  await order.save();
  await moveWallet(String(order.userId), order.walletUsed, "order-cancelled", { orderNumber: order.number, note: "Wallet returned" });
}
