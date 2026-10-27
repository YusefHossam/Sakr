import "server-only";
import { connectDB } from "./db";
import { NotifyRequest, Review } from "@/models/engagement";
import { ExchangeRequest } from "@/models/exchange";
import { Order } from "@/models/order";

// Admin reads. All per-request (inside <Suspense>), never cached.

const startOfDay = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const startOfMonth = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), 1);

// Orders that count as sales: not cancelled and not still waiting on a card payment.
const SOLD = { status: { $nin: ["cancelled", "awaiting_payment"] } };

export type SalesTotals = { orders: number; revenue: number; cost: number; profit: number; avg: number };

export async function salesBetween(from: Date, to: Date): Promise<SalesTotals> {
  await connectDB();
  const [row] = await Order.aggregate<{ orders: number; revenue: number; cost: number }>([
    { $match: { ...SOLD, createdAt: { $gte: from, $lt: to } } },
    { $project: { total: 1, cost: { $sum: { $map: { input: "$items", as: "i", in: { $multiply: ["$$i.costPrice", "$$i.qty"] } } } } } },
    { $group: { _id: null, orders: { $sum: 1 }, revenue: { $sum: "$total" }, cost: { $sum: "$cost" } } },
  ]);
  const orders = row?.orders ?? 0;
  const revenue = row?.revenue ?? 0;
  const cost = row?.cost ?? 0;
  return { orders, revenue, cost, profit: revenue - cost, avg: orders ? Math.round(revenue / orders) : 0 };
}

export async function getDashboard() {
  await connectDB();
  const now = new Date();
  const tomorrow = new Date(startOfDay(now).getTime() + 864e5);
  const [today, month, toReview, exchanges, reviews, restock, late, recent] = await Promise.all([
    salesBetween(startOfDay(now), tomorrow),
    salesBetween(startOfMonth(now), tomorrow),
    Order.countDocuments({ "payment.status": "awaiting_review", status: { $ne: "cancelled" } }),
    ExchangeRequest.countDocuments({ status: "open" }),
    Review.countDocuments({ approved: false }),
    NotifyRequest.countDocuments({ notified: false }),
    Order.find({ deliveryDate: { $lt: startOfDay(now) }, status: { $in: ["pending", "confirmed", "preparing", "shipped"] } })
      .sort({ deliveryDate: 1 })
      .limit(20)
      .select("number contact.name contact.phone deliveryDate status delay total")
      .lean(),
    Order.find().sort({ createdAt: -1 }).limit(8).select("number contact.name total status payment.status createdAt").lean(),
  ]);
  return { today, month, toReview, exchanges, reviews, restock, late, recent };
}

export type ReportData = {
  title: string;
  from: Date;
  to: Date;
  totals: SalesTotals;
  discounts: number;
  shipping: number;
  byPayment: { method: string; orders: number; revenue: number }[];
  topProducts: { title: string; brand: string; qty: number; revenue: number }[];
  topBrands: { brand: string; qty: number; revenue: number }[];
  coupons: { code: string; orders: number; discount: number }[];
  byBucket: { label: string; orders: number; revenue: number }[];
};

/** Everything a monthly/yearly PDF needs. */
export async function getReport(kind: "month" | "year", year: number, month: number): Promise<ReportData> {
  await connectDB();
  const from = kind === "month" ? new Date(year, month - 1, 1) : new Date(year, 0, 1);
  const to = kind === "month" ? new Date(year, month, 1) : new Date(year + 1, 0, 1);
  const match = { ...SOLD, createdAt: { $gte: from, $lt: to } };
  const bucket = kind === "month" ? { $dayOfMonth: "$createdAt" } : { $month: "$createdAt" };

  const [totals, extra, byPayment, topProducts, topBrands, coupons, byBucket] = await Promise.all([
    salesBetween(from, to),
    Order.aggregate<{ discounts: number; shipping: number }>([{ $match: match }, { $group: { _id: null, discounts: { $sum: "$discount" }, shipping: { $sum: "$shipping" } } }]),
    Order.aggregate<{ _id: string; orders: number; revenue: number }>([
      { $match: match },
      { $group: { _id: "$payment.method", orders: { $sum: 1 }, revenue: { $sum: "$total" } } },
      { $sort: { revenue: -1 } },
    ]),
    Order.aggregate<{ _id: string; brand: string; qty: number; revenue: number }>([
      { $match: match },
      { $unwind: "$items" },
      { $group: { _id: "$items.title", brand: { $first: "$items.brand" }, qty: { $sum: "$items.qty" }, revenue: { $sum: { $multiply: ["$items.unitPrice", "$items.qty"] } } } },
      { $sort: { qty: -1, revenue: -1 } },
      { $limit: 10 },
    ]),
    Order.aggregate<{ _id: string; qty: number; revenue: number }>([
      { $match: match },
      { $unwind: "$items" },
      { $group: { _id: "$items.brand", qty: { $sum: "$items.qty" }, revenue: { $sum: { $multiply: ["$items.unitPrice", "$items.qty"] } } } },
      { $sort: { revenue: -1 } },
      { $limit: 8 },
    ]),
    Order.aggregate<{ _id: string; orders: number; discount: number }>([
      { $match: { ...match, couponCode: { $ne: null } } },
      { $group: { _id: "$couponCode", orders: { $sum: 1 }, discount: { $sum: "$discount" } } },
      { $sort: { orders: -1 } },
      { $limit: 10 },
    ]),
    Order.aggregate<{ _id: number; orders: number; revenue: number }>([
      { $match: match },
      { $group: { _id: bucket, orders: { $sum: 1 }, revenue: { $sum: "$total" } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return {
    title: kind === "month" ? `${MONTHS[month - 1]} ${year}` : `${year}`,
    from,
    to,
    totals,
    discounts: extra[0]?.discounts ?? 0,
    shipping: extra[0]?.shipping ?? 0,
    byPayment: byPayment.map((r) => ({ method: r._id, orders: r.orders, revenue: r.revenue })),
    topProducts: topProducts.map((r) => ({ title: r._id, brand: r.brand, qty: r.qty, revenue: r.revenue })),
    topBrands: topBrands.map((r) => ({ brand: r._id, qty: r.qty, revenue: r.revenue })),
    coupons: coupons.map((r) => ({ code: r._id, orders: r.orders, discount: r.discount })),
    byBucket: byBucket.map((r) => ({ label: kind === "month" ? String(r._id) : MONTHS[r._id - 1], orders: r.orders, revenue: r.revenue })),
  };
}

/** Coupon performance, grouped by influencer (BR-30). */
export async function influencerSales() {
  await connectDB();
  return Order.aggregate<{ _id: string; orders: number; revenue: number; discount: number }>([
    { $match: { ...SOLD, couponCode: { $ne: null } } },
    { $lookup: { from: "coupons", localField: "couponCode", foreignField: "code", as: "coupon" } },
    { $unwind: "$coupon" },
    { $match: { "coupon.influencer": { $ne: null } } },
    { $group: { _id: "$coupon.influencer", orders: { $sum: 1 }, revenue: { $sum: "$total" }, discount: { $sum: "$discount" } } },
    { $sort: { revenue: -1 } },
  ]);
}
