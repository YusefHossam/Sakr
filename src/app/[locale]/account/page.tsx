import { Suspense } from "react";
import type { Metadata } from "next";
import { locale as rootLocale } from "next/root-params";
import { getTranslations } from "next-intl/server";
import { ExchangeButton, LogoutButton, SizePassportForm } from "@/components/account/account-forms";
import { Price } from "@/components/product/price";
import { PageHeader } from "@/components/shop/page-header";
import { Link, redirect } from "@/i18n/navigation";
import { getSession } from "@/lib/auth/session";
import { connectDB } from "@/lib/db";
import { exchangeOpen, getOrdersForUser } from "@/lib/order-queries";
import { getSettings } from "@/lib/settings";
import { getMyCoupons } from "@/lib/shop-data";
import { EXCHANGE_DAYS, ExchangeRequest } from "@/models/exchange";
import { LEVEL_THRESHOLDS, levelFor, User } from "@/models/user";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("title"), robots: { index: false } };
}

export default async function AccountPage() {
  const t = await getTranslations("account");
  return (
    <div className="mx-auto max-w-[1100px] px-4 pt-4 md:px-8">
      <PageHeader title={t("title")} />
      <Suspense fallback={<div className="h-96 animate-pulse bg-smoke" />}>
        <AccountContent />
      </Suspense>
    </div>
  );
}

async function AccountContent() {
  const [t, to, locale] = await Promise.all([getTranslations("account"), getTranslations("order"), rootLocale()]);
  const session = await getSession();
  if (!session) redirect({ href: "/login?next=/account", locale });
  await connectDB();
  const [user, orders, coupons, settings, exchanges] = await Promise.all([
    User.findById(session!.userId).select("name totalSpent points sizePassport").lean(),
    getOrdersForUser(session!.userId),
    getMyCoupons(session!.userId),
    getSettings(),
    ExchangeRequest.find({ userId: session!.userId }).select("orderNumber").lean(),
  ]);
  if (!user) redirect({ href: "/login", locale });
  const level = levelFor(user!.totalSpent);
  const next = level === "rookie" ? "og" : level === "og" ? "legend" : null;
  const requested = new Set(exchanges.map((e) => e.orderNumber));
  const hours = settings.drop.vipEarlyHours;

  return (
    <div className="flex flex-col gap-14">
      <section className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-xl text-bone">{t("hello", { name: user!.name })}</p>
          <p className="text-xs tracking-[0.3em] text-dust uppercase">
            {t("level")}: <span className="font-display text-2xl tracking-[0.15em] text-chrome">{t(`levels.${level}`)}</span> · {t("points")}: <span className="text-bone">{user!.points}</span>
          </p>
          <p className="text-xs text-steel">
            {next ? t("nextLevel", { amount: (LEVEL_THRESHOLDS[next] - user!.totalSpent).toLocaleString("en"), level: t(`levels.${next}`) }) : t("maxLevel", { hours })}
          </p>
          <p className="text-[11px] text-dust">{t("vipPerk", { hours })}</p>
        </div>
        <LogoutButton />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="street-heading text-3xl">{t("orders")}</h2>
        {orders.length ? (
          <ul className="flex flex-col divide-y divide-ash border-y border-ash">
            {orders.map((o) => {
              const canExchange = exchangeOpen(o, EXCHANGE_DAYS);
              return (
                <li key={o.number} className="flex flex-wrap items-center gap-4 py-4">
                  <Link href={`/orders/${o.number}`} className="font-display tracking-widest text-bone hover:underline" dir="ltr">{o.number}</Link>
                  <span className="text-xs text-dust" dir="ltr">{o.createdAt.slice(0, 10)}</span>
                  <span className="text-xs text-steel">{to(`statuses.${o.status}`)}</span>
                  <span className="ms-auto"><Price price={o.total} /></span>
                  {o.status === "delivered" && (
                    <div className="w-full">
                      {requested.has(o.number) ? (
                        <span className="text-xs text-dust">{t("exchangeOpen")}</span>
                      ) : canExchange ? (
                        <ExchangeButton orderNumber={o.number} />
                      ) : (
                        <span className="text-xs text-dust">{t("exchangeClosed")}</span>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-steel">{t("noOrders")}</p>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="street-heading text-3xl">{t("coupons")}</h2>
        {coupons.length ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {coupons.map((c) => (
              <li key={c.code} className="flex items-center justify-between border border-dashed border-iron p-4">
                <span className="font-display text-lg tracking-widest text-chrome" dir="ltr">{c.code}</span>
                <span className="text-end text-xs text-steel">
                  −{c.percent}%{c.expiresAt && <span className="block text-dust">{t("expires", { date: c.expiresAt })}</span>}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-steel">{t("noCoupons")}</p>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="street-heading text-3xl">{t("sizePassport")}</h2>
        <p className="text-sm text-steel">{t("sizePassportText")}</p>
        <SizePassportForm
          initial={{
            top: user!.sizePassport?.top ?? null,
            bottom: user!.sizePassport?.bottom ?? null,
            shoeUS: user!.sizePassport?.shoeUS ?? null,
            heightCm: user!.sizePassport?.heightCm ?? null,
            weightKg: user!.sizePassport?.weightKg ?? null,
          }}
        />
      </section>
    </div>
  );
}
