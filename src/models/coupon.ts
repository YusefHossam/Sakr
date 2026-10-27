import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const COUPON_REASONS = ["manual", "big-order", "apology", "vip", "influencer"] as const;

const couponSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    percent: { type: Number, required: true, min: 1, max: 90 },
    // Personal coupons belong to one customer; public ones (SAKR10, influencer codes) have none.
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    reason: { type: String, enum: COUPON_REASONS, default: "manual" },
    influencer: { type: String, default: null },
    maxUses: { type: Number, default: 1 }, // 0 = unlimited
    uses: { type: Number, default: 0 },
    usedBy: { type: [Schema.Types.ObjectId], default: [] },
    expiresAt: { type: Date, default: null },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type CouponDoc = InferSchemaType<typeof couponSchema>;
export const Coupon: Model<CouponDoc> = (mongoose.models.Coupon as Model<CouponDoc>) ?? mongoose.model<CouponDoc>("Coupon", couponSchema);
