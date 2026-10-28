import { connectDB } from "@/lib/db";
import { Product } from "@/models/product";
import { Viewer } from "@/models/engagement";

const TICK_MS = 4000;
const MAX_MS = 5 * 60_000; // the browser reconnects on its own after this

// GET /api/stream/<slug> — Server-Sent Events: pieces left per variant and viewer count, pushed every few seconds.
export async function GET(request: Request, ctx: RouteContext<"/api/stream/[slug]">) {
  const { slug } = await ctx.params;
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) return new Response("bad slug", { status: 400 });
  await connectDB();
  const encoder = new TextEncoder();
  let timer: ReturnType<typeof setInterval> | undefined;
  let closeTimer: ReturnType<typeof setTimeout> | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const send = async () => {
        try {
          const [product, viewers] = await Promise.all([
            Product.findOne({ slug, active: true }).select("variants").lean(),
            Viewer.countDocuments({ productSlug: slug, expireAt: { $gt: new Date() } }),
          ]);
          const stock = (product?.variants ?? []).map((v) => ({ size: v.size ?? null, color: v.color ?? null, stock: v.stock }));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ stock, viewers })}\n\n`));
        } catch {
          // a failed tick is skipped; the next one retries
        }
      };
      void send();
      timer = setInterval(send, TICK_MS);
      closeTimer = setTimeout(() => {
        clearInterval(timer);
        controller.close();
      }, MAX_MS);
      request.signal.addEventListener("abort", () => {
        clearInterval(timer);
        clearTimeout(closeTimer);
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
    cancel() {
      clearInterval(timer);
      clearTimeout(closeTimer);
    },
  });

  return new Response(stream, { headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-store, no-transform", Connection: "keep-alive" } });
}
