import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const EVENT_TYPES = ["order.placed", "payment.approved", "payment.rejected", "payment.card-paid", "payment.card-failed", "order.status", "order.cancelled"] as const;

// Append-only trail of everything that happens to an order: placed, paid, shipped, cancelled.
const eventSchema = new Schema(
  {
    orderNumber: { type: String, required: true, index: true },
    type: { type: String, enum: EVENT_TYPES, required: true, index: true },
    detail: { type: String, default: "" },
    amount: { type: Number, default: 0 },
    actor: { type: String, default: "system" }, // "customer", "system" or the admin's name
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
eventSchema.index({ createdAt: -1 });

export type OrderEventDoc = InferSchemaType<typeof eventSchema>;
export const OrderEvent: Model<OrderEventDoc> = (mongoose.models.OrderEvent as Model<OrderEventDoc>) ?? mongoose.model<OrderEventDoc>("OrderEvent", eventSchema);
