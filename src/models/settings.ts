import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

// One document holding everything the admin can tune.
const settingsSchema = new Schema(
  {
    key: { type: String, default: "store", unique: true },
    lastPiecesMax: { type: Number, default: 3 },
    lastPiecesDiscount: { type: Number, default: 0.85 },
    bigOrderThreshold: { type: Number, default: 10_000 },
    bigOrderPercent: { type: Number, default: 20 },
    apologyPercent: { type: Number, default: 10 },
    shippingEgypt: { type: Map, of: Number, default: {} }, // governorate → EGP
    shippingIntl: { type: Map, of: Number, default: {} }, // country code → EGP
    promos: {
      type: [
        {
          scope: { type: String, enum: ["site", "brand", "category", "product"], required: true },
          key: { type: String, default: "" },
          percent: { type: Number, min: 1, max: 90, required: true },
          endsAt: { type: Date, default: null },
        },
      ],
      default: [],
    },
    transferInstapay: { type: String, default: "sakr@instapay" },
    transferWallet: { type: String, default: "01000000000" },
    // Thin bar above the header, and extra banners that lead the home carousel.
    announcement: { text: { type: String, default: "" }, active: { type: Boolean, default: false } },
    banners: {
      type: [{ title: String, text: { type: String, default: "" }, href: { type: String, default: "/shop" }, image: { type: String, default: "" }, active: { type: Boolean, default: true } }],
      default: [],
    },
    drop: {
      locked: { type: Boolean, default: false },
      password: { type: String, default: "" },
      name: { type: String, default: "DROP 01" },
      opensAt: { type: Date, default: null },
      vipEarlyHours: { type: Number, default: 3 },
    },
  },
  { timestamps: true },
);

export type SettingsDoc = InferSchemaType<typeof settingsSchema>;
export const Settings: Model<SettingsDoc> =
  (mongoose.models.Settings as Model<SettingsDoc>) ?? mongoose.model<SettingsDoc>("Settings", settingsSchema);
