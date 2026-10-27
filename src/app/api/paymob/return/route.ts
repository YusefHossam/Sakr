import { settleCardPayment } from "@/lib/orders";
import { verifyPaymobHmac } from "@/lib/paymob";

// GET /api/paymob/return?… — where Paymob sends the shopper back after paying.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams;
  const locale = q.get("locale") === "en" ? "en" : "ar";
  // The redirect flattens nested fields: "order.id" arrives as "order", "source_data.pan" as-is.
  const get = (field: string) => q.get(field === "order.id" ? "order" : field);
  const valid = verifyPaymobHmac(get, q.get("hmac"));
  const reference = q.get("merchant_order_id") ?? q.get("special_reference") ?? "";

  let target = `/${locale}/account`;
  if (valid && reference) {
    const success = q.get("success") === "true" && q.get("pending") === "false";
    await settleCardPayment(reference, success, q.get("id") ?? "", q.get("order") ?? "");
    target = `/${locale}/orders/${encodeURIComponent(reference)}?payment=${success ? "ok" : "failed"}`;
  }
  return Response.redirect(new URL(target, url), 303);
}
