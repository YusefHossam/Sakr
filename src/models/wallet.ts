import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const WALLET_REASONS = ["refund", "cashback", "gift", "adjustment", "order", "order-cancelled"] as const;

// Every movement of a customer's wallet. The balance on the user is the running total of these.
const walletTxSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true }, // + credit, - debit (EGP)
    reason: { type: String, enum: WALLET_REASONS, required: true },
    orderNumber: { type: String, default: null },
    note: { type: String, default: "", maxlength: 200 },
    balanceAfter: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
walletTxSchema.index({ userId: 1, createdAt: -1 });

export type WalletTxDoc = InferSchemaType<typeof walletTxSchema>;
export const WalletTx: Model<WalletTxDoc> = (mongoose.models.WalletTx as Model<WalletTxDoc>) ?? mongoose.model<WalletTxDoc>("WalletTx", walletTxSchema);
