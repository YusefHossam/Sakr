import { getModelEntry } from "@/lib/catalog";

// /[locale]/models/[key] → the model's newest colorway (its page shows every other colorway).
export async function GET(request: Request, ctx: RouteContext<"/[locale]/models/[key]">) {
  const { locale, key } = await ctx.params;
  const slug = await getModelEntry(key);
  const target = slug ? `/${locale}/product/${slug}` : `/${locale}/shop/footwear`;
  return Response.redirect(new URL(target, request.url), 307);
}
