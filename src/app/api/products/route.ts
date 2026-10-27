import type { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { CATEGORIES, Product } from "@/models/product";

const querySchema = z.object({
  category: z.enum(CATEGORIES).optional(),
  brand: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  q: z.string().min(1).max(80).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(60).default(24),
});

// GET /api/products?category=footwear&brand=nike&model=nike-dunk-low&q=panda&page=1&limit=24
export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    return Response.json({ error: "Invalid query", issues: parsed.error.issues }, { status: 400 });
  }
  const { category, brand, model, q, page, limit } = parsed.data;

  const filter: Record<string, unknown> = { active: true };
  if (category) filter.category = category;
  if (brand) filter.brandSlug = brand;
  if (model) filter.modelKey = model;
  if (q) filter.$text = { $search: q };

  await connectDB();
  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort(q ? { score: { $meta: "textScore" } } : { publishedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("slug title brand brandSlug category model modelKey colorway price images")
      .lean(),
    Product.countDocuments(filter),
  ]);

  return Response.json({ items, total, page, pages: Math.ceil(total / limit) });
}
