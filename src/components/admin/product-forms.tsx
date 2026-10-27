"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createProduct, saveProduct } from "@/lib/actions/admin";
import { CATEGORIES } from "@/lib/categories";
import { adminButton, adminField } from "./ui";

type Variant = { size: string | null; color: string | null; stock: number };

export function ProductEditor({
  slug,
  initial,
}: {
  slug: string;
  initial: { price: number; costPrice: number; active: boolean; promoPercent: number; variants: Variant[] };
}) {
  const t = useTranslations("admin.products");
  const router = useRouter();
  const [state, setState] = useState(initial);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const res = await saveProduct(slug, state);
          setStatus(res.ok ? "saved" : "error");
          router.refresh();
        });
      }}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs text-steel">
          {t("price")}
          <input type="number" min={1} value={state.price} onChange={(e) => setState({ ...state, price: Number(e.target.value) })} className={adminField} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-steel">
          {t("cost")}
          <input type="number" min={0} value={state.costPrice} onChange={(e) => setState({ ...state, costPrice: Number(e.target.value) })} className={adminField} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-steel">
          {t("promo")}
          <input type="number" min={0} max={90} value={state.promoPercent} onChange={(e) => setState({ ...state, promoPercent: Number(e.target.value) })} className={adminField} />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm text-steel">
        <input type="checkbox" checked={state.active} onChange={(e) => setState({ ...state, active: e.target.checked })} className="size-4 accent-[#b9b9b9]" />
        {t("active")}
      </label>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-xs tracking-[0.2em] text-dust uppercase">{t("stock")}</legend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6" dir="ltr">
          {state.variants.map((v, i) => (
            <label key={`${v.size}-${v.color}`} className="flex flex-col gap-1 text-xs text-steel">
              {v.size ?? "—"}{v.color ? ` · ${v.color}` : ""}
              <input
                type="number"
                min={0}
                value={v.stock}
                onChange={(e) => {
                  const variants = [...state.variants];
                  variants[i] = { ...v, stock: Number(e.target.value) };
                  setState({ ...state, variants });
                }}
                className={`${adminField} ${v.stock >= 1 && v.stock <= 3 ? "border-blood/70" : ""}`}
              />
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={adminButton}>{t("save")}</button>
        {status === "saved" && <span className="text-xs text-bone">✓ {t("saved")}</span>}
        {status === "error" && <span className="text-xs text-blood">!</span>}
      </div>
    </form>
  );
}

export function NewProductForm() {
  const t = useTranslations("admin.products");
  const tc = useTranslations("categories");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const d = new FormData(e.currentTarget);
        const lines = (name: string) => String(d.get(name) ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
        startTransition(async () => {
          const res = await createProduct({
            title: String(d.get("title")),
            brand: String(d.get("brand")),
            category: String(d.get("category")) as (typeof CATEGORIES)[number],
            price: Number(d.get("price")),
            costPrice: Number(d.get("costPrice") || 0),
            description: String(d.get("description") ?? ""),
            images: lines("images"),
            variants: lines("sizes").map((l) => {
              const [size, qty] = l.split("=");
              return { size: size.trim(), stock: Number(qty ?? 0) };
            }),
          });
          if (res.ok) router.push(`/admin/products/${res.message}`);
          else setError(res.error);
        });
      }}
    >
      <label className="flex flex-col gap-1 text-xs text-steel">{t("titleField")}<input name="title" required className={adminField} /></label>
      <label className="flex flex-col gap-1 text-xs text-steel">{t("brand")}<input name="brand" required placeholder="Dior" className={adminField} /></label>
      <label className="flex flex-col gap-1 text-xs text-steel">
        {t("category")}
        <select name="category" className={adminField}>{CATEGORIES.map((c) => <option key={c} value={c}>{tc(c)}</option>)}</select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-xs text-steel">{t("price")}<input name="price" type="number" min={1} required className={adminField} /></label>
        <label className="flex flex-col gap-1 text-xs text-steel">{t("cost")}<input name="costPrice" type="number" min={0} className={adminField} /></label>
      </div>
      <label className="flex flex-col gap-1 text-xs text-steel sm:col-span-2">{t("images")}<textarea name="images" rows={3} required dir="ltr" className={`${adminField} py-2`} /></label>
      <label className="flex flex-col gap-1 text-xs text-steel">{t("sizes")}<textarea name="sizes" rows={5} required dir="ltr" placeholder={"40=3\n41=5\n42=2"} className={`${adminField} py-2`} /></label>
      <label className="flex flex-col gap-1 text-xs text-steel">{t("description")}<textarea name="description" rows={5} className={`${adminField} py-2`} /></label>
      {error && <p className="text-xs text-blood sm:col-span-2" role="alert">{error}</p>}
      <button type="submit" disabled={pending} className={`${adminButton} sm:col-span-2 sm:justify-self-start`}>{t("create")}</button>
    </form>
  );
}
