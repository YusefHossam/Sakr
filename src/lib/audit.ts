import "server-only";
import { connectDB } from "./db";
import type { Session } from "./auth/session";
import { AuditLog } from "@/models/audit";

/** Records an admin action. Never throws: a failed log must not block the action itself. */
export async function audit(admin: Session, action: string, target: unknown = "", detail = ""): Promise<void> {
  try {
    await connectDB();
    const text = typeof target === "string" ? target : JSON.stringify(target);
    await AuditLog.create({ adminId: admin.userId, adminName: admin.name, action, target: text.slice(0, 200), detail: detail.slice(0, 400) });
  } catch (error) {
    console.warn("[audit] could not write:", error instanceof Error ? error.message : error);
  }
}
