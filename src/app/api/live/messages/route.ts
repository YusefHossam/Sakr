import { connectDB } from "@/lib/db";
import { LiveMessage } from "@/models/social";

// GET /api/live/messages?after=<ISO> — chat messages newer than `after` (or the latest 40), oldest first.
export async function GET(request: Request) {
  const after = new URL(request.url).searchParams.get("after");
  const since = after ? new Date(after) : null;
  await connectDB();
  const filter = since && !Number.isNaN(since.getTime()) ? { createdAt: { $gt: since } } : {};
  const rows = await LiveMessage.find(filter).sort({ createdAt: -1 }).limit(40).select("name text createdAt").lean();
  return Response.json(
    { messages: rows.reverse().map((m) => ({ id: String(m._id), name: m.name, text: m.text, at: m.createdAt.toISOString() })) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
