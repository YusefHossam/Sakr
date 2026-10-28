import { connection } from "next/server";
import { getLocale } from "next-intl/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/order";

const WINDOW_DAYS = 7;
const daysAgo = (n: number) => new Date(Date.now() - n * 864e5);

/** "At this pace it's gone in ~3 days": remaining stock against the last week's sales of this exact piece. */
export async function SellOutHint({ slug, stock }: { slug: string; stock: number }) {
  if (stock <= 0) return null;
  await connection(); // reads the clock, so this renders per request
  const locale = await getLocale();
  await connectDB();
  const [row] = await Order.aggregate<{ qty: number }>([
    { $match: { createdAt: { $gte: daysAgo(WINDOW_DAYS) }, status: { $nin: ["cancelled", "awaiting_payment"] } } },
    { $unwind: "$items" },
    { $match: { "items.productSlug": slug } },
    { $group: { _id: null, qty: { $sum: "$items.qty" } } },
  ]);
  const perDay = (row?.qty ?? 0) / WINDOW_DAYS;
  const days = perDay > 0 ? Math.ceil(stock / perDay) : null;

  let text: string | null = null;
  if (days !== null && days <= 7) text = locale === "ar" ? `بالسرعة دي القطعة هتخلص خلال ${days <= 1 ? "يوم" : `${days} أيام`}.` : `At this pace it sells out in about ${days <= 1 ? "a day" : `${days} days`}.`;
  else if (stock <= 5) text = locale === "ar" ? `فاضل ${stock} قطع بس في كل المقاسات.` : `Only ${stock} left across all sizes.`;
  if (!text) return null;
  return <p className="border-s-2 border-blood ps-3 text-xs text-bone" role="status">{text}</p>;
}
