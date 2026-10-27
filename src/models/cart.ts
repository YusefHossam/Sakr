import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const cartItemSchema = new Schema(
  {
    productSlug: { type: String, required: true },
    size: { type: String, default: null },
    color: { type: String, default: null },
    qty: { type: Number, required: true, min: 1, max: 10 },
  },
  { _id: false },
);

const cartSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true },
);

export type CartDoc = InferSchemaType<typeof cartSchema>;
export const Cart: Model<CartDoc> = (mongoose.models.Cart as Model<CartDoc>) ?? mongoose.model<CartDoc>("Cart", cartSchema);
