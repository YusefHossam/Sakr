import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

// Every admin action, newest first: who did what to which record.
const auditSchema = new Schema(
  {
    adminId: { type: String, required: true },
    adminName: { type: String, default: "" },
    action: { type: String, required: true, index: true },
    target: { type: String, default: "" },
    detail: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
auditSchema.index({ createdAt: -1 });

export type AuditDoc = InferSchemaType<typeof auditSchema>;
export const AuditLog: Model<AuditDoc> = (mongoose.models.AuditLog as Model<AuditDoc>) ?? mongoose.model<AuditDoc>("AuditLog", auditSchema);
