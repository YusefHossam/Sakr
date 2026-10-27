import { getProduct } from "@/lib/catalog";
import { variantPrice } from "@/lib/pricing";

// GET /api/products/[slug] — one product with sizes/stock (used by the Fit Builder).
export async function GET(_request: Request, ctx: RouteContext<"/api/products/[slug]">) {
  const { slug } = await ctx.params;
  const p = await getProduct(slug);
  if (!p) return Response.json({ error: "not-found" }, { status: 404 });
  return Response.json({
    slug: p.slug,
    title: p.title,
    brand: p.brand,
    category: p.category,
    subcategory: p.subcategory,
    price: p.price,
    image: p.images[0] ?? null,
    variants: p.variants.map((v) => ({ size: v.size, color: v.color, stock: v.stock, price: variantPrice(p.price, v.stock, p.promo) })),
  });
}
