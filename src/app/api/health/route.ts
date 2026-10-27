import { connectDB } from "@/lib/db";

// Reports whether the app can reach MongoDB. Route handlers are not cached by default.
export async function GET() {
  const started = Date.now();
  try {
    const { connection } = await connectDB();
    await connection.db!.admin().ping();
    return Response.json({
      ok: true,
      db: connection.name,
      latencyMs: Date.now() - started,
    });
  } catch (error) {
    console.error("[health] MongoDB check failed:", error);
    return Response.json({ ok: false, error: "Database unreachable" }, { status: 503 });
  }
}
