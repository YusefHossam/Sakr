import { connectDB } from "@/lib/db";
import { Brand } from "@/models/brand";

// GET /api/brands — every brand with its categories, for the navbar dropdowns.
export async function GET() {
  await connectDB();
  const brands = await Brand.find().sort({ productCount: -1 }).select("-_id name slug categories productCount modelCount").lean();
  return Response.json({ brands });
}
