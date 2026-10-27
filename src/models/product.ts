import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const CATEGORIES = [
  "hoodies",
  "crewnecks",
  "jackets",
  "pants",
  "sweatpants",
  "tees",
  "shorts",
  "tracksuits",
  "footwear",
  "accessories",
] as const;
export type Category = (typeof CATEGORIES)[number];

const variantSchema = new Schema(
  {
    size: { type: String, default: null },
    color: { type: String, default: null },
    stock: { type: Number, min: 0, default: 0 },
  },
  { _id: false },
);

const productSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    brand: { type: String, required: true },
    brandSlug: { type: String, required: true },
    category: { type: String, required: true, enum: CATEGORIES },
    subcategory: { type: String, default: null },
    fit: { type: String, enum: ["skinny", "flared", null], default: null },
    // Sneakers/caps grouped by model: every colorway of a model shares modelKey.
    model: { type: String, default: null },
    modelKey: { type: String, default: null },
    colorway: { type: String, default: null },
    price: { type: Number, required: true, min: 0 }, // EGP
    costPrice: { type: Number, min: 0 }, // EGP, for profit reports
    images: { type: [String], default: [] },
    sizes: { type: [String], default: [] },
    colors: { type: [String], default: [] },
    variants: { type: [variantSchema], default: [] },
    source: {
      site: String,
      url: String,
      externalId: String,
      priceOriginal: Number,
      currencyOriginal: String,
    },
    active: { type: Boolean, default: true },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

productSchema.index({ brandSlug: 1, category: 1 });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ modelKey: 1 }, { sparse: true });
productSchema.index({ title: "text", brand: "text", model: "text", colorway: "text" });

export type ProductDoc = InferSchemaType<typeof productSchema>;

export const Product: Model<ProductDoc> =
  (mongoose.models.Product as Model<ProductDoc>) ?? mongoose.model<ProductDoc>("Product", productSchema);
