"use server";

import { z } from "zod";
import { connectDB } from "@/lib/db";
import { NotifyRequest, Review } from "@/models/engagement";
import { Product } from "@/models/product";

export type ActionResult = { ok: true } | { ok: false; error: string };

const reviewSchema = z.object({
  slug: z.string().min(1).max(120),
  name: z.string().trim().min(2).max(60),
  rating: z.coerce.number().int().min(1).max(5),
  text: z.string().trim().min(5).max(1000),
});

/** Anyone can review; it stays hidden until an admin approves it. */
export async function submitReview(input: z.input<typeof reviewSchema>): Promise<ActionResult> {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  await connectDB();
  if (!(await Product.exists({ slug: parsed.data.slug }))) return { ok: false, error: "not-found" };
  await Review.create({ productSlug: parsed.data.slug, name: parsed.data.name, rating: parsed.data.rating, text: parsed.data.text });
  return { ok: true };
}

const notifySchema = z.object({
  slug: z.string().min(1).max(120),
  size: z.string().max(20).nullable(),
  color: z.string().max(60).nullable(),
  channel: z.enum(["whatsapp", "snapchat", "instagram"]),
  handle: z.string().trim().min(3).max(80),
});

/** Saves a "tell me when it's back" request for a sold-out size. */
export async function requestRestockNotice(input: z.input<typeof notifySchema>): Promise<ActionResult> {
  const parsed = notifySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  await connectDB();
  if (!(await Product.exists({ slug: parsed.data.slug }))) return { ok: false, error: "not-found" };
  await NotifyRequest.create({ ...parsed.data, productSlug: parsed.data.slug });
  return { ok: true };
}
