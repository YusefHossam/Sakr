import "server-only";
import { createHash } from "node:crypto";
import { connectDB } from "./db";
import type { BadgeStats } from "./badges";
import { GraffitiTag } from "@/models/graffiti";
import { Order } from "@/models/order";
import { Crew, FitLook, FitVote } from "@/models/social";
import { levelFor, User } from "@/models/user";

export const pairKeyOf = (a: string, b: string) => [a, b].sort().join("|");
export const lookKey = (slugs: string[]) => createHash("sha1").update([...slugs].sort().join("|")).digest("hex").slice(0, 16);

export type WardrobeItem = { slug: string; title: string; brand: string; image: string | null };

/** Distinct pieces from delivered orders, newest first. */
export async function getWardrobe(userId: string): Promise<WardrobeItem[]> {
  await connectDB();
  const orders = await Order.find({ userId, status: "delivered" }).sort({ createdAt: -1 }).select("items").lean();
  const seen = new Map<string, WardrobeItem>();
  for (const o of orders) for (const i of o.items) if (!seen.has(i.productSlug)) seen.set(i.productSlug, { slug: i.productSlug, title: i.title, brand: i.brand, image: i.image ?? null });
  return [...seen.values()];
}

export async function getBadgeStats(userId: string): Promise<BadgeStats> {
  await connectDB();
  const [user, delivered, wardrobe, votes, crew, tag] = await Promise.all([
    User.findById(userId).select("totalSpent").lean(),
    Order.countDocuments({ userId, status: "delivered" }),
    getWardrobe(userId),
    FitVote.countDocuments({ userId }),
    Crew.exists({ members: userId }),
    GraffitiTag.exists({ userId }),
  ]);
  const totalSpent = user?.totalSpent ?? 0;
  return {
    delivered,
    totalSpent,
    level: levelFor(totalSpent),
    wardrobe: wardrobe.length,
    brands: new Set(wardrobe.map((w) => w.brand)).size,
    votes,
    inCrew: !!crew,
    onWall: !!tag,
  };
}

export type PublicProfile = { name: string; handle: string; bio: string; level: ReturnType<typeof levelFor>; wardrobe: WardrobeItem[]; stats: BadgeStats };

export async function getPublicProfile(handle: string): Promise<PublicProfile | null> {
  await connectDB();
  const user = await User.findOne({ handle: handle.toLowerCase(), profilePublic: true, blocked: { $ne: true } }).select("name handle bio totalSpent").lean();
  if (!user?.handle) return null;
  const id = String(user._id);
  const [wardrobe, stats] = await Promise.all([getWardrobe(id), getBadgeStats(id)]);
  return { name: user.name, handle: user.handle, bio: user.bio ?? "", level: levelFor(user.totalSpent), wardrobe, stats };
}

export type WeeklyWinner = { key: string; slugs: string[]; wins: number; votes: number };

/** Best fits of the last 7 days: most wins first, at least 2 votes to qualify. */
export async function getWeeklyBoard(limit = 3): Promise<WeeklyWinner[]> {
  await connectDB();
  const since = new Date(Date.now() - 7 * 864e5);
  const rows = await FitVote.aggregate<{ _id: string; wins: number }>([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: "$winnerKey", wins: { $sum: 1 } } },
    { $match: { wins: { $gte: 2 } } },
    { $sort: { wins: -1 } },
    { $limit: limit },
  ]);
  if (!rows.length) return [];
  const keys = rows.map((r) => r._id);
  const [looks, losses] = await Promise.all([
    FitLook.find({ key: { $in: keys } }).lean(),
    FitVote.aggregate<{ _id: string; n: number }>([{ $match: { createdAt: { $gte: since }, loserKey: { $in: keys } } }, { $group: { _id: "$loserKey", n: { $sum: 1 } } }]),
  ]);
  const lost = new Map(losses.map((l) => [l._id, l.n]));
  const byKey = new Map(looks.map((l) => [l.key, l]));
  return rows.flatMap((r) => {
    const look = byKey.get(r._id);
    return look ? [{ key: r._id, slugs: look.slugs, wins: r.wins, votes: r.wins + (lost.get(r._id) ?? 0) }] : [];
  });
}
