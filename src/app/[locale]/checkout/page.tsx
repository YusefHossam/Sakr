import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { PageHeader } from "@/components/shop/page-header";
import { redirect } from "@/i18n/navigation";
import { getSession } from "@/lib/auth/session";
import { connectDB } from "@/lib/db";
import { paymobEnabled } from "@/lib/paymob";
import { getSettings } from "@/lib/settings";
import { getCartLines, getMyCoupons } from "@/lib/shop-data";
import { User } from "@/models/user";
import { locale as rootLocale } from "next/root-params";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("checkout");
  return { title: t("title"), robots: { index: false } };
}

export default async function CheckoutPage() {
  const t = await getTranslations("checkout");
  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-4 md:px-8">
      <PageHeader title={t("title")} />
      <Suspense fallback={<div className="h-96 animate-pulse bg-smoke" />}>
        <CheckoutContent />
      </Suspense>
    </div>
  );
}

async function CheckoutContent() {
  const locale = await rootLocale();
  const session = await getSession();
  if (!session) redirect({ href: "/login?next=/checkout", locale });
  await connectDB();
  const [lines, coupons, settings, user] = await Promise.all([
    getCartLines(session!.userId),
    getMyCoupons(session!.userId),
    getSettings(),
    User.findById(session!.userId).select("name email phone phone2").lean(),
  ]);
  if (!lines.length) redirect({ href: "/cart", locale });

  return (
    <CheckoutForm
      lines={lines}
      coupons={coupons}
      profile={{ name: user?.name ?? "", email: user?.email ?? "", phone: user?.phone ?? "", phone2: user?.phone2 ?? "" }}
      shipping={{ egypt: settings.shippingEgypt, intl: settings.shippingIntl }}
      transfer={{ instapay: settings.transferInstapay, wallet: settings.transferWallet }}
      cardEnabled={paymobEnabled()}
    />
  );
}
