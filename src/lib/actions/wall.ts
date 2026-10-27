"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { getSession } from "@/lib/auth/session";
import { connectDB } from "@/lib/db";
import { GraffitiTag } from "@/models/graffiti";
import { Order } from "@/models/order";
import { WALL_TAG } from "@/lib/tags";

const COLORS = ["#e4e4e4", "#b9b9b9", "#9b111e", "#c21a2a", "#8a8a8a", "#f0f0f0"];
const textSchema = z.string().trim().min(2).max(18).regex(/^[\p{L}\p{N} ._-]+$/u);

/** One tag per customer, only once they've ordered. Re-spraying moves your tag. */
export async function sprayTag(text: string): Promise<{ ok: boolean; error?: "login" | "buyers" | "invalid" }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "login" };
  const parsed = textSchema.safeParse(text);
  if (!parsed.success) return { ok: false, error: "invalid" };
  await connectDB();
  if (!(await Order.exists({ userId: session.userId, status: { $nin: ["cancelled", "awaiting_payment"] } }))) return { ok: false, error: "buyers" };
  await GraffitiTag.updateOne(
    { userId: session.userId },
    {
      $set: {
        text: parsed.data,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        x: 4 + Math.random() * 74,
        y: 6 + Math.random() * 80,
        rotate: Math.round((Math.random() - 0.5) * 24),
        size: 0.8 + Math.random() * 0.8,
      },
    },
    { upsert: true },
  );
  updateTag(WALL_TAG);
  return { ok: true };
}

export async function removeTag(id: string): Promise<{ ok: true }> {
  await requireAdmin();
  await connectDB();
  await GraffitiTag.findByIdAndDelete(id);
  updateTag(WALL_TAG);
  return { ok: true };
}
