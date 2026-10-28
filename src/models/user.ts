import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const LEVELS = ["rookie", "og", "legend"] as const;
export type Level = (typeof LEVELS)[number];

const addressSchema = new Schema(
  {
    label: { type: String, default: "" },
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
  { _id: true },
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: "" },
    phone2: { type: String, default: "" },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
    // Lifetime spend on delivered orders (EGP); drives the level (BR-53).
    totalSpent: { type: Number, default: 0 },
    // Admin controls: a blocked customer cannot log in; the note is internal.
    blocked: { type: Boolean, default: false },
    adminNote: { type: String, default: "", maxlength: 500 },
    points: { type: Number, default: 0 },
    sizePassport: {
      top: { type: String, default: null },
      bottom: { type: String, default: null },
      shoeUS: { type: Number, default: null },
      heightCm: { type: Number, default: null },
      weightKg: { type: Number, default: null },
    },
    addresses: { type: [addressSchema], default: [] },
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof userSchema>;

export const User: Model<UserDoc> = (mongoose.models.User as Model<UserDoc>) ?? mongoose.model<UserDoc>("User", userSchema);

/** Level thresholds by lifetime spend (EGP). */
export const LEVEL_THRESHOLDS: Record<Level, number> = { rookie: 0, og: 15_000, legend: 50_000 };

export function levelFor(totalSpent: number): Level {
  if (totalSpent >= LEVEL_THRESHOLDS.legend) return "legend";
  if (totalSpent >= LEVEL_THRESHOLDS.og) return "og";
  return "rookie";
}
