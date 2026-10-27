import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CartLines } from "@/components/cart/cart-lines";
import { Price } from "@/components/product/price";
import { PageHeader } from "@/components/shop/page-header";
import { Link } from "@/i18n/navigation";
import { getSession } from "@/lib/auth/session";
import { getCartLines } from "@/lib/shop-data";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("cart");
  return { title: t("title"), robots: { index: false } };
}

export default async function CartPage() {
  const t = await getTranslations("cart");
  return (
    <div className="mx-auto max-w-[1100px] px-4 pt-4 md:px-8">
      <PageHeader title={t("title")} />
      <Suspense fallback={<div className="h-64 animate-pulse bg-smoke" />}>
        <CartContent />
      </Suspense>
    </div>
  );
}

async function CartContent() {
  const t = await getTranslations("cart");
  const session = await getSession();
  if (!session) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-steel">{t("loginNeeded")}</p>
        <Link href="/login?next=/cart" className="border border-bone/70 px-8 py-3 font-display tracking-[0.3em] text-bone uppercase hover:bg-bone hover:text-ink">
          {t("checkout")}
        </Link>
      </div>
    );
  }
  const lines = await getCartLines(session.userId);
  if (!lines.length) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-steel">{t("empty")}</p>
        <Link href="/shop" className="border border-bone/70 px-8 py-3 font-display tracking-[0.3em] text-bone uppercase hover:bg-bone hover:text-ink">
          {t("emptyCta")}
        </Link>
      </div>
    );
  }
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const blocked = lines.some((l) => l.qty > l.stock);
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
      <CartLines lines={lines} />
      <aside className="flex h-fit flex-col gap-4 border border-ash p-6 lg:sticky lg:top-32">
        <div className="flex items-center justify-between">
          <span className="text-sm text-steel">{t("subtotal")}</span>
          <Price price={subtotal} />
        </div>
        <Link
          href="/checkout"
          aria-disabled={blocked}
          className={`min-h-12 bg-bone text-center font-display leading-[3rem] tracking-[0.3em] text-ink uppercase hover:bg-chrome ${blocked ? "pointer-events-none opacity-40" : ""}`}
        >
          {t("checkout")}
        </Link>
      </aside>
    </div>
  );
}
