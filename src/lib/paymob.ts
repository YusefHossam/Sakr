import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// Paymob (Egypt) Intention API, test mode. Card payments stay disabled until these are set.
const cfg = () => ({
  secretKey: process.env.PAYMOB_SECRET_KEY,
  publicKey: process.env.PAYMOB_PUBLIC_KEY,
  integrationId: process.env.PAYMOB_INTEGRATION_ID,
  hmacSecret: process.env.PAYMOB_HMAC_SECRET,
});

export const paymobEnabled = () => {
  const c = cfg();
  return !!(c.secretKey && c.publicKey && c.integrationId && c.hmacSecret);
};

type IntentionInput = {
  orderNumber: string;
  amountEgp: number;
  customer: { name: string; email: string; phone: string };
  address: { city: string; street: string; building: string; floor: string; apartment: string; country: string };
  returnUrl: string;
  webhookUrl: string;
};

/** Creates a payment intention and returns the hosted checkout URL. */
export async function createPaymobCheckout(input: IntentionInput): Promise<string> {
  const c = cfg();
  if (!paymobEnabled()) throw new Error("Paymob is not configured");
  const [first, ...rest] = input.customer.name.trim().split(/\s+/);
  const res = await fetch("https://accept.paymob.com/v1/intention/", {
    method: "POST",
    headers: { Authorization: `Token ${c.secretKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: Math.round(input.amountEgp * 100),
      currency: "EGP",
      payment_methods: [Number(c.integrationId)],
      special_reference: input.orderNumber,
      notification_url: input.webhookUrl,
      redirection_url: input.returnUrl,
      billing_data: {
        first_name: first || "SAKR",
        last_name: rest.join(" ") || "Customer",
        email: input.customer.email,
        phone_number: input.customer.phone,
        city: input.address.city,
        street: input.address.street,
        building: input.address.building || "NA",
        floor: input.address.floor || "NA",
        apartment: input.address.apartment || "NA",
        country: input.address.country,
      },
    }),
  });
  if (!res.ok) throw new Error(`Paymob intention failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { client_secret: string };
  return `https://accept.paymob.com/unifiedcheckout/?publicKey=${encodeURIComponent(c.publicKey!)}&clientSecret=${encodeURIComponent(data.client_secret)}`;
}

// Fields Paymob concatenates (in this order) to sign a transaction.
const HMAC_FIELDS = [
  "amount_cents", "created_at", "currency", "error_occured", "has_parent_transaction", "id", "integration_id",
  "is_3d_secure", "is_auth", "is_capture", "is_refunded", "is_standalone_payment", "is_voided", "order.id",
  "owner", "pending", "source_data.pan", "source_data.sub_type", "source_data.type", "success",
] as const;

/** Verifies a transaction's HMAC. `get` reads a field by its dotted name (webhook JSON or redirect query). */
export function verifyPaymobHmac(get: (field: string) => unknown, hmac: string | null): boolean {
  const secret = cfg().hmacSecret;
  if (!secret || !hmac) return false;
  const message = HMAC_FIELDS.map((f) => String(get(f) ?? "")).join("");
  const expected = createHmac("sha512", secret).update(message).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(hmac.toLowerCase());
  return a.length === b.length && timingSafeEqual(a, b);
}
