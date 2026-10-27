import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

// "Request exchange" from the customer's orders (BR-35 / BR-40).
const exchangeSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, unique: true },
    orderNumber: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    reason: { type: String, enum: ["size", "defect", "wrong-item"], required: true },
    note: { type: String, default: "", maxlength: 500 },
    status: { type: String, enum: ["open", "approved", "rejected"], default: "open", index: true },
  },
  { timestamps: true },
);

export type ExchangeDoc = InferSchemaType<typeof exchangeSchema>;
export const ExchangeRequest: Model<ExchangeDoc> =
  (mongoose.models.ExchangeRequest as Model<ExchangeDoc>) ?? mongoose.model<ExchangeDoc>("ExchangeRequest", exchangeSchema);

export const EXCHANGE_DAYS = 14;
/** Items that can never be exchanged (hygiene). */
export const NON_EXCHANGEABLE = /\b(boxers?|briefs?|underwear|socks?)\b/i;
