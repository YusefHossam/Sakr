import { z } from "zod";
import { getReport } from "@/lib/admin-data";
import { getSession } from "@/lib/auth/session";
import { buildReportPdf } from "@/lib/report-pdf";

const querySchema = z.object({
  kind: z.enum(["month", "year"]),
  year: z.coerce.number().int().min(2020).max(2100),
  month: z.coerce.number().int().min(1).max(12).default(1),
});

// GET /api/admin/reports?kind=month&year=2026&month=10 — PDF download, admins only.
export async function GET(request: Request) {
  const session = await getSession();
  if (session?.role !== "admin") return new Response("Not found", { status: 404 });
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 });
  const { kind, year, month } = parsed.data;
  const report = await getReport(kind, year, month);
  const bytes = await buildReportPdf(report, kind);
  const name = kind === "month" ? `SAKR-report-${year}-${String(month).padStart(2, "0")}.pdf` : `SAKR-report-${year}.pdf`;
  return new Response(new Uint8Array(bytes), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${name}"`, "Cache-Control": "private, no-store" },
  });
}
