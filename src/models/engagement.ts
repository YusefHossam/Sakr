import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

// Reviews: anyone can write one; it shows only after an admin approves it (BR-18).
const reviewSchema = new Schema(
  {
    productSlug: { type: String, required: true, index: true },
    name: { type: String, required: true, maxlength: 60 },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, required: true, maxlength: 1000 },
    approved: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

// "Tell me when it's back" for a sold-out size (BR-15).
const notifySchema = new Schema(
  {
    productSlug: { type: String, required: true, index: true },
    size: { type: String, default: null },
    color: { type: String, default: null },
    channel: { type: String, enum: ["whatsapp", "snapchat", "instagram"], required: true },
    handle: { type: String, required: true, maxlength: 80 },
    notified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Live viewers: one row per browser per product, expiring a minute after its last heartbeat (BR-16).
const viewerSchema = new Schema({
  productSlug: { type: String, required: true },
  viewerId: { type: String, required: true },
  expireAt: { type: Date, required: true },
});
viewerSchema.index({ productSlug: 1, viewerId: 1 }, { unique: true });
viewerSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

export type ReviewDoc = InferSchemaType<typeof reviewSchema>;
export type NotifyDoc = InferSchemaType<typeof notifySchema>;
export type ViewerDoc = InferSchemaType<typeof viewerSchema>;

export const Review: Model<ReviewDoc> = (mongoose.models.Review as Model<ReviewDoc>) ?? mongoose.model<ReviewDoc>("Review", reviewSchema);
export const NotifyRequest: Model<NotifyDoc> =
  (mongoose.models.NotifyRequest as Model<NotifyDoc>) ?? mongoose.model<NotifyDoc>("NotifyRequest", notifySchema);
export const Viewer: Model<ViewerDoc> = (mongoose.models.Viewer as Model<ViewerDoc>) ?? mongoose.model<ViewerDoc>("Viewer", viewerSchema);
