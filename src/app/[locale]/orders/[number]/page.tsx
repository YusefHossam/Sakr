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
        <Link href="/account" className="self-start text-sm text-steel underline underline-offset-4 hover:text-bone">{t("viewOrders")} →</Link>
      </OrderView>
    </>
  );
}
