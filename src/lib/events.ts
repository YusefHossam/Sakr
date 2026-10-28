import "server-only";
import { connectDB } from "./db";
import { OrderEvent, type EVENT_TYPES } from "@/models/event";

/** Appends to the order event log. Never throws: a failed log line must not break the order flow. */
export async function logEvent(orderNumber: string, type: (typeof EVENT_TYPES)[number], opts: { detail?: string; amount?: number; actor?: string } = {}): Promise<void> {
  try {
    await connectDB();
    await OrderEvent.create({ orderNumber, type, detail: (opts.detail ?? "").slice(0, 200), amount: opts.amount ?? 0, actor: opts.actor ?? "system" });
  } catch (error) {
    console.warn("[events] could not write:", error instanceof Error ? error.message : error);
  }
}
