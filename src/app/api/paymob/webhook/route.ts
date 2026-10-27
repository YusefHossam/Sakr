import { settleCardPayment } from "@/lib/orders";
import { verifyPaymobHmac } from "@/lib/paymob";

type Txn = Record<string, unknown> & { order?: { id?: unknown; merchant_order_id?: unknown }; source_data?: Record<string, unknown> };

// POST /api/paymob/webhook?hmac=… — Paymob's server-to-server transaction callback.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { type?: string; obj?: Txn } | null;
  const obj = body?.obj;
  if (body?.type !== "TRANSACTION" || !obj) return Response.json({ ok: true });

  const get = (field: string) => field.split(".").reduce<unknown>((v, k) => (v as Record<string, unknown> | undefined)?.[k], obj);
  if (!verifyPaymobHmac(get, new URL(request.url).searchParams.get("hmac"))) {
    return Response.json({ error: "bad hmac" }, { status: 401 });
  }
  const reference = String(obj.order?.merchant_order_id ?? (obj as { special_reference?: unknown }).special_reference ?? "");
  if (reference) await settleCardPayment(reference, obj.success === true && obj.pending === false, String(obj.id), String(obj.order?.id ?? ""));
  return Response.json({ ok: true });
}
