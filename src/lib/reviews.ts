import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { connectDB } from "./db";
import { Review } from "@/models/engagement";

export type PublicReview = { id: string; name: string; rating: number; text: string; date: string };

export const reviewsTag = (slug: string) => `reviews:${slug}`;

export async function getApprovedReviews(slug: string): Promise<PublicReview[]> {
  "use cache";
  cacheTag(reviewsTag(slug));
  cacheLife("hours");
  await connectDB();
  const docs = await Review.find({ productSlug: slug, approved: true }).sort({ createdAt: -1 }).limit(30).lean();
  return docs.map((r) => ({
    id: String(r._id),
    name: r.name,
    rating: r.rating,
    text: r.text,
    date: (r.createdAt as Date).toISOString().slice(0, 10),
  }));
}
