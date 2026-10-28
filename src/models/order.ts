import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const ORDER_STATUSES = ["awaiting_payment", "pending", "confirmed", "preparing", "shipped", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export const PAYMENT_METHODS = ["card", "transfer", "cod"] as const;
export const PAYMENT_STATUSES = ["pending", "awaiting_review", "paid", "deposit_paid", "rejected", "cod"] as const;

const orderItemSchema = new Schema(
  {
    productSlug: { type: String, required: true },
    title: { type: String, required: true },
    brand: { type: String, required: true },
    image: { type: String, default: null },
    size: { type: String, default: null },
    color: { type: String, default: null },
    qty: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true }, // after the last-pieces discount
    listPrice: { type: Number, required: true },
    costPrice: { type: Number, default: 0 },
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    number: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    couponCode: { type: String, default: null },
    shipping: { type: Number, required: true },
    total: { type: Number, required: true },
    dueNow: { type: Number, required: true },
    contact: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      phone2: { type: String, default: "" },
    },
    address: {
      country: { type: String, required: true },
      governorate: { type: String, default: "" },
      city: { type: String, required: true },
      street: { type: String, required: true },
      building: { type: String, default: "" },
      floor: { type: String, default: "" },
      apartment: { type: String, default: "" },
      landmark: { type: String, default: "" },
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    deliveryDate: { type: Date, required: true },
    notes: { type: String, default: "" },
    adminNote: { type: String, default: "", maxlength: 500 }, // internal, never shown to the customer
    refunded: { type: Boolean, default: false },
    payment: {
      method: { type: String, enum: PAYMENT_METHODS, required: true },
      plan: { type: String, enum: ["full", "deposit"], default: "full" },
      status: { type: String, enum: PAYMENT_STATUSES, default: "pending" },
      paymobOrderId: { type: String, default: null },
      paymobTransactionId: { type: String, default: null },
      hasProof: { type: Boolean, default: false },
    },
    status: { type: String, enum: ORDER_STATUSES, default: "pending", index: true },
    history: {
      type: [{ status: String, at: { type: Date, default: Date.now }, note: { type: String, default: "" } }],
      default: [],
    },
    // Late-delivery apology (BR-62).
    delay: {
      reason: { type: String, default: null },
      couponCode: { type: String, default: null },
      notifiedAt: { type: Date, default: null },
    },
    rewardCouponCode: { type: String, default: null }, // the 20% coupon for orders over the threshold (BR-57)
  },
  { timestamps: true },
);
orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1, deliveryDate: 1 });

// Transfer screenshots, kept apart from orders so order lists stay light.
const paymentProofSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, unique: true },
    mime: { type: String, required: true },
    data: { type: Buffer, required: true },
  },
  { timestamps: true },
);

export type OrderDoc = InferSchemaType<typeof orderSchema>;
export type PaymentProofDoc = InferSchemaType<typeof paymentProofSchema>;
export const Order: Model<OrderDoc> = (mongoose.models.Order as Model<OrderDoc>) ?? mongoose.model<OrderDoc>("Order", orderSchema);
export const PaymentProof: Model<PaymentProofDoc> =
  (mongoose.models.PaymentProof as Model<PaymentProofDoc>) ?? mongoose.model<PaymentProofDoc>("PaymentProof", paymentProofSchema);
