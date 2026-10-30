import { getSuggestions } from "@/lib/catalog";

// GET /api/search/suggest?q=... — brands, kinds and a few products for what is being typed.
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim().slice(0, 80) ?? "";
  if (q.length < 2) return Response.json({ brands: [], types: [], products: [] });
  return Response.json(await getSuggestions(q), { headers: { "Cache-Control": "no-store" } });
}
