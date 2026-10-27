import { z } from "zod";
import { getListing } from "@/lib/catalog";
import { CATEGORIES } from "@/lib/categories";

const list = (max: number) => z.string().optional().transform((s) => (s ?? "").split(",").filter((x) => /^[a-z0-9-]{1,60}$/.test(x)).slice(0, max));

// GET /api/for-you?brands=a,b,c&categories=x,y — a mix of the visitor's favourite brands (cached per combo).
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const brands = list(3).parse(q.get("brands") ?? undefined);
  const categories = list(2).parse(q.get("categories") ?? undefined).filter((c): c is (typeof CATEGORIES)[number] => (CATEGORIES as readonly string[]).includes(c));
  const lists = await Promise.all(brands.map((brand, i) => getListing({ brand, category: categories[i % Math.max(1, categories.length)] })));
  const fallback = await Promise.all(brands.filter((_, i) => !lists[i].items.length).map((brand) => getListing({ brand })));
  const seen = new Set<string>();
  const items = [...lists, ...fallback]
    .flatMap((l) => l.items.slice(0, 4))
    .filter((p) => !seen.has(p.slug) && seen.add(p.slug))
    .slice(0, 8);
  return Response.json({ items });
}
