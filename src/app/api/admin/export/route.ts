import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { connectDB } from "@/lib/db";
import { AuditLog } from "@/models/audit";
import { Coupon } from "@/models/coupon";
import { Order } from "@/models/order";
import { Product } from "@/models/product";
import { levelFor, User } from "@/models/user";

const querySchema = z.object({ type: z.enum(["orders", "customers", "products", "coupons", "audit"]) });

// Spreadsheet formulas ("=", "+", "-", "@") are neutralised so an exported name can't run in Excel.
const cell = (v: unknown) => {
  let s = v == null ? "" : v instanceof Date ? v.toISOString() : String(v);
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv = (header: string[], rows: unknown[][]) => `﻿${[header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n")}\r\n`;

// GET /api/admin/export?type=orders|customers|products|coupons|audit — CSV download, admins only.
export async function GET(request: Request) {
  const session = await getSession();
  if (session?.role !== "admin") return new Response("Not found", { status: 404 });
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 });
  await connectDB();

  let body = "";
  switch (parsed.data.type) {
    case "orders": {
      const rows = await Order.find().sort({ createdAt: -1 }).limit(20_000).lean();
      body = csv(
        ["number", "date", "status", "customer", "email", "phone", "governorate", "city", "items", "subtotal", "discount", "coupon", "shipping", "total", "payment", "payment_status", "refunded", "delivery_date"],
        rows.map((o) => [o.number, o.createdAt, o.status, o.contact?.name, o.contact?.email, o.contact?.phone, o.address?.governorate, o.address?.city, o.items.map((i) => `${i.qty}x ${i.brand} ${i.title}${i.size ? ` (${i.size})` : ""}`).join(" | "), o.subtotal, o.discount, o.couponCode, o.shipping, o.total, o.payment?.method, o.payment?.status, o.refunded ? "yes" : "", o.deliveryDate]),
      );
      break;
    }
    case "customers": {
      const rows = await User.find().sort({ createdAt: -1 }).limit(50_000).select("-passwordHash").lean();
      body = csv(["name", "email", "phone", "role", "level", "total_spent", "points", "blocked", "joined"], rows.map((u) => [u.name, u.email, u.phone, u.role, levelFor(u.totalSpent), u.totalSpent, u.points, u.blocked ? "yes" : "", u.createdAt]));
      break;
    }
    case "products": {
      const rows = await Product.find().sort({ brand: 1, title: 1 }).select("slug title brand category price costPrice active variants").lean();
      body = csv(["slug", "title", "brand", "category", "price", "cost", "active", "stock"], rows.map((p) => [p.slug, p.title, p.brand, p.category, p.price, p.costPrice, p.active ? "yes" : "no", p.variants.reduce((s, v) => s + v.stock, 0)]));
      break;
    }
    case "coupons": {
      const rows = await Coupon.find().sort({ createdAt: -1 }).limit(20_000).lean();
      body = csv(["code", "percent", "reason", "uses", "max_uses", "active", "influencer", "expires"], rows.map((c) => [c.code, c.percent, c.reason, c.uses, c.maxUses, c.active ? "yes" : "no", c.influencer, c.expiresAt]));
      break;
    }
    case "audit": {
      const rows = await AuditLog.find().sort({ createdAt: -1 }).limit(20_000).lean();
      body = csv(["when", "admin", "action", "target", "detail"], rows.map((r) => [r.createdAt, r.adminName, r.action, r.target, r.detail]));
      break;
    }
  }
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="SAKR-${parsed.data.type}-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
