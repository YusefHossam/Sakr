import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Viewer } from "@/models/engagement";

const bodySchema = z.object({
  slug: z.string().min(1).max(120),
  id: z.string().uuid(),
});
const TTL_MS = 60_000;

// POST /api/viewers {slug, id} — heartbeat from an open product page; returns how many are viewing it.
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 });
  const { slug, id } = parsed.data;

  await connectDB();
  const now = Date.now();
  await Viewer.updateOne({ productSlug: slug, viewerId: id }, { $set: { expireAt: new Date(now + TTL_MS) } }, { upsert: true });
  // The TTL index sweeps about once a minute, so count only live rows.
  const count = await Viewer.countDocuments({ productSlug: slug, expireAt: { $gt: new Date(now) } });
  return Response.json({ count });
}
