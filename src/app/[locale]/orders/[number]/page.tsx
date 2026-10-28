import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";
import { getTranslations } from "next-intl/server";
import { OrderView } from "@/components/orders/order-view";
import { PageHeader } from "@/components/shop/page-header";
import { Link, redirect } from "@/i18n/navigation";
import { getSession } from "@/lib/auth/session";
import { getOrderForUser } from "@/lib/order-queries";

export const metadata: Metadata = { robots: { index: false } };

export default function OrderPage({ params, searchParams }: PageProps<"/[locale]/orders/[number]">) {
  return (
    <div className="mx-auto max-w-[1100px] px-4 pt-4 md:px-8">
      <Suspense fallback={<div className="h-96 animate-pulse bg-smoke" />}>
        <OrderContent params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function OrderContent({ params, searchParams }: Pick<PageProps<"/[locale]/orders/[number]">, "params" | "searchParams">) {
  const [{ number }, query, t, locale] = await Promise.all([params, searchParams, getTranslations("order"), rootLocale()]);
  const session = await getSession();
  if (!session) redirect({ href: `/login?next=/orders/${number}`, locale });
  const order = await getOrderForUser(number, session!.userId);
  if (!order) notFound();

  return (
    <>
      <PageHeader title={t("title", { number: order.number })} />
      <OrderView order={order}>
        {query.placed && (
          <div className="flex flex-col gap-2 border border-bone/40 bg-smoke p-5" role="status">
            <p className="street-heading text-2xl">{t("thanks")}</p>
            {order.rewardCoupon && (
              <p className="text-sm text-steel">
                {t("bigOrderCoupon")} <span className="font-display tracking-widest text-bone" dir="ltr">{order.rewardCoupon}</span>
              </p>
            )}
          </div>
        )}
        {order.paymentStatus === "pending" && order.paymentMethod === "card" && order.status === "awaiting_payment" && (
          <p className="border border-blood/50 bg-blood/10 p-4 text-sm text-bone" role="status">
            {locale === "ar" ? "لسه ما كمّلتش الدفع؟ القطعة محجوزة ليك شوية. لو الدفع وقف معاك كلمنا على واتساب وهنكمّله سوا." : "Haven't finished paying? Your pieces are held for a short while. If payment stalled, message us on WhatsApp and we'll finish it together."}
          </p>
        )}
        {order.paymentStatus === "awaiting_review" && (
          <p className="border border-ash p-4 text-sm text-steel" role="status">
            {locale === "ar" ? "صورة التحويل وصلتنا. بنراجعها ودقايق ونأكدلك الأوردر." : "We have your transfer screenshot. We're checking it and will confirm the order shortly."}
          </p>
        )}
        {(order.sameDay || order.gift || order.preorderShipsAt !== null || order.walletUsed > 0) && (
          <ul className="flex flex-col gap-1 border border-ash p-4 text-sm text-steel">
            {order.sameDay && <li>{locale === "ar" ? "شحن نفس اليوم" : "Same-day delivery"}</li>}
            {order.preorderShipsAt !== null && (
              <li>
                {locale === "ar" ? "طلب مسبق" : "Pre-order"}
                {order.preorderShipsAt ? ` · ${locale === "ar" ? "بيتشحن من" : "ships from"} ${order.preorderShipsAt}` : ""}.{" "}
                {locale === "ar" ? "الباقي بيتدفع قبل الشحن." : "The balance is due before it ships."}
              </li>
            )}
            {order.walletUsed > 0 && <li dir="auto">{locale === "ar" ? "اتدفع من المحفظة" : "Paid from wallet"}: {order.walletUsed.toLocaleString("en")} EGP</li>}
            {order.gift && (
              <li dir="auto">
                {locale === "ar" ? "هدية" : "Gift"}
                {order.gift.to ? ` · ${order.gift.to}` : ""}
                {order.gift.message ? ` · "${order.gift.message}"` : ""}
              </li>
            )}
          </ul>
        )}
        <Link href="/account" className="self-start text-sm text-steel underline underline-offset-4 hover:text-bone">{t("viewOrders")} →</Link>
      </OrderView>
    </>
  );
}
