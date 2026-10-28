"use client";

import { useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { addToCart } from "@/lib/actions/cart";
import { requestRestockNotice } from "@/lib/actions/engagement";
import { useLiveVariants } from "@/lib/live-stock";
import { enqueue } from "@/lib/offline-cart";
import { isLastPieces, LAST_PIECES_DISCOUNT, variantPrice } from "@/lib/pricing";
import type { ProductDetail } from "@/lib/catalog";
import { Price } from "./price";

type Variant = ProductDetail["variants"][number];
const CHANNELS = ["whatsapp", "snapchat", "instagram"] as const;

/** Color, size and quantity pickers, live stock warnings, add-to-cart and restock alerts. */
export function BuyBox({ product: initial }: { product: Pick<ProductDetail, "slug" | "price" | "variants" | "promo" | "preorder"> }) {
  const variants = useLiveVariants(initial.slug, initial.variants);
  const product = { ...initial, variants };
  const t = useTranslations("product");
  const locale = useLocale();
  const L = (ar: string, en: string) => (locale === "ar" ? ar : en);
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const colors = useMemo(() => [...new Set(product.variants.map((v) => v.color).filter((c): c is string => !!c))], [product.variants]);
  const [color, setColor] = useState<string | null>(colors[0] ?? null);
  const options = product.variants.filter((v) => (v.color ?? null) === color);
  const firstInStock = options.find((v) => v.stock > 0) ?? null;
  const [size, setSize] = useState<string | null>(options.length === 1 ? (options[0].size ?? null) : (firstInStock?.size ?? null));
  const [qty, setQty] = useState(1);
  const [status, setStatus] = useState<"idle" | "added" | "queued" | "stock" | "error">("idle");

  const variant: Variant | undefined = options.find((v) => (v.size ?? null) === size);
  const rawStock = variant?.stock ?? 0;
  // Out of stock but open for pre-order: the pre-order units left stand in for the stock.
  const preLeft = rawStock < 1 && product.preorder.enabled ? product.preorder.left : 0;
  const isPre = preLeft > 0;
  const stock = rawStock > 0 ? rawStock : preLeft;
  const low = isLastPieces(rawStock);
  const unit = variantPrice(product.price, variant ? rawStock : 0, product.promo);
  const salePrice = unit < product.price ? unit : null;

  function add() {
    if (!variant || stock < 1) return;
    const line = { slug: product.slug, size: variant.size ?? null, color: variant.color ?? null, qty };
    // Offline: keep the line and send it when the connection returns.
    if (!navigator.onLine) {
      enqueue(line);
      setStatus("queued");
      return;
    }
    startTransition(async () => {
      const res = await addToCart(line);
      if (res.ok) {
        setStatus("added");
        router.refresh();
      } else if (res.error === "login") {
        router.push(`/login?next=${encodeURIComponent(`/product/${product.slug}`)}`);
      } else setStatus(res.error === "stock" ? "stock" : "error");
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Price price={product.price} salePrice={salePrice} size="lg" />

      {colors.length > 1 && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-xs tracking-[0.25em] text-dust uppercase">{t("color")}: <span className="text-bone">{color}</span></legend>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setColor(c);
                  setSize(null);
                  setStatus("idle");
                }}
                aria-pressed={c === color}
                className={`border px-3 py-2 text-xs ${c === color ? "border-bone text-bone" : "border-ash text-steel hover:border-dust"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {options.some((v) => v.size) && (
        <fieldset>
          <legend className="mb-3 text-xs tracking-[0.25em] text-dust uppercase">{t("size")}</legend>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6" dir="ltr">
            {options.map((v) => {
              const out = v.stock < 1 && !(product.preorder.enabled && product.preorder.left > 0);
              const selected = (v.size ?? null) === size;
              return (
                <button
                  key={v.size ?? "one"}
                  type="button"
                  onClick={() => {
                    setSize(v.size ?? null);
                    setQty(1);
                    setStatus("idle");
                  }}
                  aria-pressed={selected}
                  className={`relative min-h-11 border px-2 py-2.5 text-sm transition-colors ${
                    selected ? "border-bone bg-bone text-ink" : out ? "border-ash text-dust line-through" : "border-ash text-bone hover:border-steel"
                  }`}
                >
                  {v.size}
                  {isLastPieces(v.stock) && <span className="absolute -top-1.5 -end-1.5 size-2.5 rounded-full bg-blood" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {variant && low && (
        <p className="border border-blood/50 bg-blood/10 px-4 py-3 text-sm text-bone" role="status">
          🔥 {t("lowStock", { count: stock })} <span className="sr-only">{Math.round(LAST_PIECES_DISCOUNT * 100)}%</span>
        </p>
      )}

      {variant && isPre && (
        <p className="border border-bone/40 bg-smoke px-4 py-3 text-sm text-bone" role="status">
          {L("طلب مسبق", "Pre-order")}
          {product.preorder.shipsAt ? ` · ${L("بيوصل", "ships")} ${product.preorder.shipsAt}` : ""} · {L(`فاضل ${preLeft} وحدة`, `${preLeft} left`)}
          <span className="mt-1 block text-xs text-steel">{L("بتدفع ٥٠٪ عربون دلوقتي والباقي قبل الشحن.", "Pay a 50% deposit now, the rest before it ships.")}</span>
        </p>
      )}

      {variant && stock < 1 ? (
        <RestockForm slug={product.slug} size={variant.size} color={variant.color} />
      ) : (
        <div className="flex gap-3">
          <label className="sr-only" htmlFor="qty">{t("quantity")}</label>
          <select
            id="qty"
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            disabled={!variant}
            className="min-h-12 border border-ash bg-smoke px-3 text-bone"
          >
            {Array.from({ length: Math.max(1, Math.min(10, stock)) }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={add}
            disabled={!variant || pending}
            className="min-h-12 flex-1 bg-bone font-display tracking-[0.3em] text-ink uppercase transition-colors hover:bg-chrome disabled:cursor-not-allowed disabled:opacity-50"
          >
            {!variant ? t("selectSize") : pending ? t("adding") : status === "added" ? `✓ ${t("added")}` : isPre ? L("اطلب مسبقًا", "Pre-order") : t("addToCart")}
          </button>
        </div>
      )}
      {status === "queued" && <p className="text-sm text-steel" role="status">{L("إنت أوفلاين. القطعة محفوظة وهتتضاف للسلة أول ما النت يرجع.", "You're offline. It's saved and will be added to your cart when the connection returns.")}</p>}
      {status === "stock" && <p className="text-sm text-blood" role="alert">{t("soldOutSize")}</p>}
    </div>
  );
}

function RestockForm({ slug, size, color }: { slug: string; size: string | null; color: string | null }) {
  const t = useTranslations("product");
  const [channel, setChannel] = useState<(typeof CHANNELS)[number]>("whatsapp");
  const [handle, setHandle] = useState("");
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  const labels = { whatsapp: "WhatsApp", snapchat: "Snapchat", instagram: "Instagram" };

  if (done) return <p className="border border-ash p-4 text-sm text-bone" role="status">✓ {t("notifyThanks", { channel: labels[channel] })}</p>;

  return (
    <form
      className="flex flex-col gap-3 border border-ash p-4"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const res = await requestRestockNotice({ slug, size, color, channel, handle });
          if (res.ok) setDone(true);
        });
      }}
    >
      <p className="street-heading text-lg">{t("notifyTitle")}</p>
      <p className="text-xs text-steel">{t("notifyText", { size: size ?? "" })}</p>
      <div className="flex gap-2" role="radiogroup" aria-label={t("notifyChannel")}>
        {CHANNELS.map((c) => (
          <button key={c} type="button" role="radio" aria-checked={c === channel} onClick={() => setChannel(c)} className={`border px-3 py-2 text-xs ${c === channel ? "border-bone text-bone" : "border-ash text-steel"}`}>
            {labels[c]}
          </button>
        ))}
      </div>
      <label className="sr-only" htmlFor="notify-handle">{t("notifyHandle")}</label>
      <input
        id="notify-handle"
        required
        minLength={3}
        value={handle}
        onChange={(e) => setHandle(e.target.value)}
        placeholder={t("notifyHandle")}
        dir="ltr"
        className="min-h-11 border border-ash bg-smoke px-3 text-bone placeholder:text-dust"
      />
      <button type="submit" disabled={pending} className="min-h-11 border border-bone/70 font-display tracking-[0.25em] text-bone uppercase hover:bg-bone hover:text-ink disabled:opacity-50">
        {t("notifySubmit")}
      </button>
    </form>
  );
}
