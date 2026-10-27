import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { OrderView } from "@/components/orders/order-view";
import { PageHeader } from "@/components/shop/page-header";
import { findOrderByPhone } from "@/lib/order-queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("track");
  return { title: t("title"), robots: { index: false } };
}

const field = "min-h-12 w-full border border-ash bg-smoke px-4 text-bone placeholder:text-dust focus:border-steel focus:outline-none";

export default async function TrackPage({ searchParams }: PageProps<"/[locale]/track">) {
  const t = await getTranslations("track");
  return (
    <div className="mx-auto max-w-[1100px] px-4 pt-4 md:px-8">
      <PageHeader title={t("title")} text={t("text")} />
      <Suspense fallback={null}>
        <TrackContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function TrackContent({ searchParams }: Pick<PageProps<"/[locale]/track">, "searchParams">) {
  const t = await getTranslations("track");
  const q = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim().slice(0, 40) ?? "";
  const number = one(q.order);
  const phone = one(q.phone);
  const order = number && phone ? await findOrderByPhone(number, phone) : null;

  return (
    <div className="flex flex-col gap-10">
      <form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <input name="order" defaultValue={number} required placeholder={t("number")} aria-label={t("number")} dir="ltr" className={field} />
        <input name="phone" defaultValue={phone} required type="tel" placeholder={t("phone")} aria-label={t("phone")} dir="ltr" className={field} />
        <button type="submit" className="min-h-12 border border-bone/70 px-8 font-display tracking-[0.3em] text-bone uppercase hover:bg-bone hover:text-ink">
          {t("submit")}
        </button>
      </form>
      {number && phone && !order && <p className="text-sm text-blood" role="alert">{t("notFound")}</p>}
      {order && <OrderView order={order} />}
    </div>
  );
}
