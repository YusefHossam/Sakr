import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const brandSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    categories: { type: [String], default: [] },
    productCount: { type: Number, default: 0 },
    modelCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type BrandDoc = InferSchemaType<typeof brandSchema>;

export const Brand: Model<BrandDoc> =
  (mongoose.models.Brand as Model<BrandDoc>) ?? mongoose.model<BrandDoc>("Brand", brandSchema);
