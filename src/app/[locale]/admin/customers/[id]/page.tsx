import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { CustomerTools, WalletControl } from "@/components/admin/more-forms";
import { Stat } from "@/components/admin/ui";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { connectDB } from "@/lib/db";
import { Coupon } from "@/models/coupon";
import { Order } from "@/models/order";
import { levelFor, User } from "@/models/user";

const egp = (n: number) => `${n.toLocaleString("en")} EGP`;

export default function AdminCustomer({ params }: PageProps<"/[locale]/admin/customers/[id]">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse bg-smoke" />}>
      <Detail params={params} />
    </Suspense>
  );
}

async function Detail({ params }: Pick<PageProps<"/[locale]/admin/customers/[id]">, "params">) {
  const admin = await requireAdmin();
  const { id } = await params;
  if (!/^[a-f\d]{24}$/i.test(id)) notFound();
  await connectDB();
  const [user, orders, coupons, ts, locale] = await Promise.all([
    User.findById(id).select("-passwordHash").lean(),
    Order.find({ userId: id }).sort({ createdAt: -1 }).limit(50).select("number total status createdAt").lean(),
    Coupon.find({ userId: id }).sort({ createdAt: -1 }).limit(20).select("code percent active uses maxUses reason").lean(),
    getTranslations("order.statuses"),
    getLocale(),
  ]);
  if (!user) notFound();
  const L = (ar: string, en: string) => (locale === "ar" ? ar : en);
  const level = levelFor(user.totalSpent);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/admin/customers" className="text-xs text-steel hover:text-bone">← {L("العملاء", "Customers")}</Link>
        <h1 className="street-heading mt-2 text-4xl">{user.name}{user.blocked && <span className="ms-3 text-2xl text-blood">{L("محظور", "BLOCKED")}</span>}</h1>
        <p className="text-sm text-steel" dir="ltr">{user.email} · {user.phone}{user.phone2 && ` · ${user.phone2}`} · {user.role}</p>
      </div>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={L("المستوى", "Level")} value={level.toUpperCase()} />
        <Stat label={L("إجمالي الشراء", "Lifetime spend")} value={egp(user.totalSpent)} />
        <Stat label={L("النقط", "Points")} value={user.points} />
        <Stat label={L("الأوردرات", "Orders")} value={orders.length} />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="street-heading text-2xl">{L("تحكم", "Controls")}</h2>
        <CustomerTools id={id} level={level} blocked={user.blocked} role={user.role} self={id === admin.userId} note={user.adminNote ?? ""} />
        <WalletControl id={id} balance={user.walletBalance ?? 0} />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="street-heading text-2xl">{L("الأوردرات", "Orders")}</h2>
        {orders.length ? (
          <ul className="flex flex-col divide-y divide-ash border-y border-ash text-sm">
            {orders.map((o) => (
              <li key={o.number} className="flex flex-wrap items-center gap-4 py-3">
                <Link href={`/admin/orders/${o.number}`} className="font-display tracking-widest text-bone" dir="ltr">{o.number}</Link>
                <span className="text-steel">{ts(o.status)}</span>
                <span className="text-bone" dir="ltr">{egp(o.total)}</span>
                <span className="text-dust" dir="ltr">{new Date(o.createdAt).toISOString().slice(0, 10)}</span>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-steel">{L("مفيش أوردرات.", "No orders yet.")}</p>}
      </section>
      {coupons.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="street-heading text-2xl">{L("الكوبونات", "Coupons")}</h2>
          <ul className="flex flex-wrap gap-2 text-xs">
            {coupons.map((c) => (
              <li key={c.code} className={`border px-3 py-1.5 ${c.active && c.uses < (c.maxUses || 1) ? "border-ash text-bone" : "border-ash/60 text-dust line-through"}`} dir="ltr">{c.code} · {c.percent}%</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
