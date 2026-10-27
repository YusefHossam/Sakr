import { isValidObjectId } from "mongoose";
import { getSession } from "@/lib/auth/session";
import { connectDB } from "@/lib/db";
import { PaymentProof } from "@/models/order";

// GET /api/admin/proof/[orderId] — a transfer screenshot, admins only.
export async function GET(_request: Request, ctx: RouteContext<"/api/admin/proof/[orderId]">) {
  const session = await getSession();
  if (session?.role !== "admin") return new Response("Not found", { status: 404 });
  const { orderId } = await ctx.params;
  if (!isValidObjectId(orderId)) return new Response("Not found", { status: 404 });
  await connectDB();
  const proof = await PaymentProof.findOne({ orderId }).lean();
  if (!proof) return new Response("Not found", { status: 404 });
  return new Response(Uint8Array.from(proof.data), {
    headers: { "Content-Type": proof.mime, "Cache-Control": "private, no-store" },
  });
}
