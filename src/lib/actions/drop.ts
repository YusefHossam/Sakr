"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { DROP_COOKIE, getDropState, hashDropPassword } from "@/lib/drop";
import { Signup } from "@/models/signup";

/** Corteiz-style password entry while the drop is locked. */
export async function unlockDrop(password: string): Promise<{ ok: boolean }> {
  const state = await getDropState(true);
  if (!state.passwordHash || hashDropPassword(password.trim()) !== state.passwordHash) return { ok: false };
  (await cookies()).set(DROP_COOKIE, state.passwordHash, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return { ok: true };
}

const signupSchema = z.object({
  contact: z.string().trim().min(3).max(120),
  channel: z.enum(["email", "whatsapp", "snapchat", "instagram"]),
  source: z.enum(["footer", "locked"]),
});

/** Drop alerts / newsletter signup. Duplicates are fine (already on the list). */
export async function joinList(input: z.input<typeof signupSchema>): Promise<{ ok: boolean }> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) return { ok: false };
  if (parsed.data.channel === "email" && !z.string().email().safeParse(parsed.data.contact).success) return { ok: false };
  await connectDB();
  await Signup.updateOne({ contact: parsed.data.contact, channel: parsed.data.channel }, { $setOnInsert: parsed.data }, { upsert: true });
  return { ok: true };
}
