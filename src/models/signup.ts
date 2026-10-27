import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

// "Join the crew" / drop alerts: an email or a WhatsApp/Snap/Insta contact (BR-33).
const signupSchema = new Schema(
  {
    contact: { type: String, required: true, maxlength: 120 },
    channel: { type: String, enum: ["email", "whatsapp", "snapchat", "instagram"], default: "email" },
    source: { type: String, enum: ["footer", "locked"], default: "footer" },
  },
  { timestamps: true },
);
signupSchema.index({ contact: 1, channel: 1 }, { unique: true });

export type SignupDoc = InferSchemaType<typeof signupSchema>;
export const Signup: Model<SignupDoc> = (mongoose.models.Signup as Model<SignupDoc>) ?? mongoose.model<SignupDoc>("Signup", signupSchema);
