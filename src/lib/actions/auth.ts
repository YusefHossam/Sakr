"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { createSession, deleteSession } from "@/lib/auth/session";
import { connectDB } from "@/lib/db";
import { levelFor, User } from "@/models/user";

export type AuthResult = { ok: true } | { ok: false; error: "invalid" | "taken" | "form" };

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(120),
  phone: z.string().trim().regex(/^\+?[0-9 ]{8,16}$/),
  password: z.string().min(8).max(100),
});

export async function register(input: z.input<typeof registerSchema>): Promise<AuthResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "form" };
  await connectDB();
  if (await User.exists({ email: parsed.data.email })) return { ok: false, error: "taken" };
  const user = await User.create({
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone,
    passwordHash: await bcrypt.hash(parsed.data.password, 10),
  });
  await createSession({ userId: String(user._id), role: user.role, name: user.name, level: "rookie" });
  return { ok: true };
}

const loginSchema = z.object({
  // An email address, or the short username some accounts (the owner's) have.
  email: z.string().trim().toLowerCase().min(3).max(120),
  password: z.string().min(1).max(100),
});

export async function login(input: z.input<typeof loginSchema>): Promise<AuthResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  await connectDB();
  const id = parsed.data.email;
  const user = await User.findOne(id.includes("@") ? { email: id } : { username: id });
  // Compare even when the user is missing so timing doesn't reveal which emails exist.
  const ok = await bcrypt.compare(parsed.data.password, user?.passwordHash ?? "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvali");
  if (!user || !ok) return { ok: false, error: "invalid" };
  if (user.blocked) return { ok: false, error: "invalid" };
  await createSession({ userId: String(user._id), role: user.role, name: user.name, level: levelFor(user.totalSpent) });
  return { ok: true };
}

export async function logout(): Promise<void> {
  await deleteSession();
}
