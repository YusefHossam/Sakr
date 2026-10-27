import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

// Graffiti wall tags: customers with an order spray their name (BR-56).
const tagSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    text: { type: String, required: true, maxlength: 18 },
    color: { type: String, required: true },
    x: { type: Number, required: true }, // percent
    y: { type: Number, required: true }, // percent
    rotate: { type: Number, default: 0 },
    size: { type: Number, default: 1 },
  },
  { timestamps: true },
);

export type GraffitiDoc = InferSchemaType<typeof tagSchema>;
export const GraffitiTag: Model<GraffitiDoc> =
  (mongoose.models.GraffitiTag as Model<GraffitiDoc>) ?? mongoose.model<GraffitiDoc>("GraffitiTag", tagSchema);
