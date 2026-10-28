"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/admin";
import { getSession } from "@/lib/auth/session";
import { connectDB } from "@/lib/db";
import { CREW_MAX, CREW_TIERS } from "@/lib/crew";
import { safeEmbed } from "@/lib/live";
import { pairKeyOf } from "@/lib/social-data";
import { SETTINGS_TAG } from "@/lib/tags";
import { Coupon } from "@/models/coupon";
import { Settings } from "@/models/settings";
import { Crew, FitLook, FitVote, LiveMessage } from "@/models/social";
import { User } from "@/models/user";

export type SocialResult = { ok: true } | { ok: false; error: string };

// ---- Public wardrobe profile ----

const profileSchema = z.object({
  handle: z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,20}$/),
  bio: z.string().trim().max(140),
  profilePublic: z.boolean(),
});

export async function saveProfile(input: z.input<typeof profileSchema>): Promise<SocialResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "login" };
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "handle" };
  await connectDB();
  const taken = await User.exists({ handle: parsed.data.handle, _id: { $ne: session.userId } });
  if (taken) return { ok: false, error: "taken" };
  await User.updateOne({ _id: session.userId }, { $set: parsed.data });
  revalidatePath(`/u/${parsed.data.handle}`);
  return { ok: true };
}

// ---- Hot or Not duel ----

const voteSchema = z.object({
  a: z.object({ key: z.string().min(8).max(40), slugs: z.array(z.string().max(160)).min(2).max(6) }),
  b: z.object({ key: z.string().min(8).max(40), slugs: z.array(z.string().max(160)).min(2).max(6) }),
  winner: z.enum(["a", "b"]),
  mood: z.string().max(20).nullable(),
});

export type VoteResult = { ok: true; a: number; b: number } | { ok: false; error: string };

export async function castVote(input: z.input<typeof voteSchema>): Promise<VoteResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "login" };
  const parsed = voteSchema.safeParse(input);
  if (!parsed.success || parsed.data.a.key === parsed.data.b.key) return { ok: false, error: "invalid" };
  const { a, b, winner, mood } = parsed.data;
  await connectDB();
  for (const look of [a, b]) await FitLook.updateOne({ key: look.key }, { $setOnInsert: { slugs: look.slugs, mood } }, { upsert: true });
  try {
    await FitVote.create({
      userId: session.userId,
      pairKey: pairKeyOf(a.key, b.key),
      winnerKey: winner === "a" ? a.key : b.key,
      loserKey: winner === "a" ? b.key : a.key,
    });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) return { ok: false, error: "voted" };
    throw error;
  }
  const pairKey = pairKeyOf(a.key, b.key);
  const [wa, wb] = await Promise.all([FitVote.countDocuments({ pairKey, winnerKey: a.key }), FitVote.countDocuments({ pairKey, winnerKey: b.key })]);
  return { ok: true, a: wa, b: wb };
}

// ---- Crew mode ----

const newCode = () => randomBytes(3).toString("hex").toUpperCase();

export async function createCrew(name: string): Promise<SocialResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "login" };
  const clean = z.string().trim().min(2).max(24).safeParse(name);
  if (!clean.success) return { ok: false, error: "name" };
  await connectDB();
  if (await Crew.exists({ members: session.userId })) return { ok: false, error: "already" };
  await Crew.create({ name: clean.data, code: newCode(), ownerId: session.userId, members: [session.userId] });
  revalidatePath("/crew");
  return { ok: true };
}

export async function joinCrew(code: string): Promise<SocialResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "login" };
  await connectDB();
  if (await Crew.exists({ members: session.userId })) return { ok: false, error: "already" };
  const crew = await Crew.findOne({ code: code.trim().toUpperCase() });
  if (!crew) return { ok: false, error: "missing" };
  if (crew.members.length >= CREW_MAX) return { ok: false, error: "full" };
  await Crew.updateOne({ _id: crew._id, "members.7": { $exists: false } }, { $addToSet: { members: session.userId } });
  revalidatePath("/crew");
  return { ok: true };
}

export async function leaveCrew(): Promise<SocialResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "login" };
  await connectDB();
  const crew = await Crew.findOne({ members: session.userId });
  if (!crew) return { ok: false, error: "missing" };
  const rest = crew.members.filter((m) => String(m) !== session.userId);
  if (!rest.length) await Crew.deleteOne({ _id: crew._id });
  else await Crew.updateOne({ _id: crew._id }, { $set: { members: rest, ownerId: String(crew.ownerId) === session.userId ? rest[0] : crew.ownerId } });
  revalidatePath("/crew");
  return { ok: true };
}

/** Each member can take each unlocked tier once: a single-use personal coupon. */
export async function claimCrewTier(tierIndex: number): Promise<SocialResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "login" };
  const tier = CREW_TIERS[tierIndex];
  if (!tier) return { ok: false, error: "invalid" };
  await connectDB();
  const crew = await Crew.findOne({ members: session.userId });
  if (!crew) return { ok: false, error: "missing" };
  const users = await User.find({ _id: { $in: crew.members } }).select("totalSpent").lean();
  if (users.reduce((s, u) => s + u.totalSpent, 0) < tier.spend) return { ok: false, error: "locked" };
  // Claim first (atomically), then issue; an error afterwards releases the claim.
  const claimed = await Crew.updateOne(
    { _id: crew._id, claimed: { $not: { $elemMatch: { userId: session.userId, tier: tierIndex } } } },
    { $push: { claimed: { userId: session.userId, tier: tierIndex } } },
  );
  if (!claimed.modifiedCount) return { ok: false, error: "claimed" };
  try {
    await Coupon.create({
      code: `CREW${tier.percent}-${randomBytes(3).toString("hex").toUpperCase()}`,
      percent: tier.percent,
      userId: session.userId,
      reason: "vip",
      maxUses: 1,
      expiresAt: new Date(Date.now() + 60 * 864e5),
    });
  } catch (error) {
    await Crew.updateOne({ _id: crew._id }, { $pull: { claimed: { userId: session.userId, tier: tierIndex } } });
    throw error;
  }
  revalidatePath("/crew");
  revalidatePath("/account");
  return { ok: true };
}

// ---- Live drop ----

export async function postLiveMessage(text: string): Promise<SocialResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "login" };
  const clean = z.string().trim().min(1).max(200).safeParse(text);
  if (!clean.success) return { ok: false, error: "invalid" };
  await connectDB();
  // One message per 2 seconds per customer.
  const last = await LiveMessage.findOne({ userId: session.userId }).sort({ createdAt: -1 }).select("createdAt").lean();
  if (last && Date.now() - last.createdAt.getTime() < 2000) return { ok: false, error: "slow" };
  await LiveMessage.create({ userId: session.userId, name: session.name.split(" ")[0].slice(0, 30), text: clean.data });
  return { ok: true };
}

const liveSchema = z.object({
  active: z.boolean(),
  title: z.string().trim().max(80),
  embedUrl: z.string().trim().max(300),
  productSlugs: z.array(z.string().max(160)).max(12),
});

export async function saveLive(input: z.input<typeof liveSchema>): Promise<SocialResult> {
  const admin = await requireAdmin();
  const parsed = liveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  if (parsed.data.embedUrl && !safeEmbed(parsed.data.embedUrl)) return { ok: false, error: "embed" };
  await connectDB();
  await Settings.updateOne({ key: "store" }, { $set: { live: parsed.data } }, { upsert: true });
  updateTag(SETTINGS_TAG);
  await audit(admin, "live.save", parsed.data.title, parsed.data.active ? "on air" : "off");
  revalidatePath("/live");
  return { ok: true };
}

export async function clearLiveChat(): Promise<SocialResult> {
  const admin = await requireAdmin();
  await connectDB();
  await LiveMessage.deleteMany({});
  await audit(admin, "live.clear-chat");
  return { ok: true };
}
