import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { CouponForm, PromoForm } from "@/components/admin/marketing-forms";
import { ActionButton } from "@/components/admin/ui";
import { deactivateCoupon, removePromo } from "@/lib/actions/admin";
import { influencerSales } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth/admin";
import { connectDB } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { Coupon } from "@/models/coupon";

export default async function Marketing() {
  const t = await getTranslations("admin.marketing");
  return (
    <div className="flex flex-col gap-12">
      <h1 className="street-heading text-5xl">{t("title")}</h1>
      <Suspense fallback={<div className="h-96 animate-pulse bg-smoke" />}>
        <Content />
      </Suspense>
    </div>
  );
}

async function Content() {
  await requireAdmin();
  await connectDB();
  const [t, settings, coupons, influencers] = await Promise.all([
    getTranslations("admin.marketing"),
    getSettings(),
    Coupon.find({ reason: { $in: ["manual", "influencer", "vip"] } }).sort({ createdAt: -1 }).limit(100).lean(),
    influencerSales(),
  ]);

  return (
    <>
      <section className="flex flex-col gap-4">
        <h2 className="street-heading text-3xl">{t("promos")}</h2>
        {settings.promos.length ? (
          <ul className="flex flex-col divide-y divide-ash border-y border-ash text-sm">
            {settings.promos.map((p, i) => (
              <li key={`${p.scope}-${p.key}-${i}`} className="flex flex-wrap items-center gap-4 py-3">
                <span className="font-display text-2xl text-blood" dir="ltr">−{p.percent}%</span>
                <span className="text-bone">{t(`scopes.${p.scope}`)}</span>
                {p.key && <span className="text-steel" dir="ltr">{p.key}</span>}
                {p.endsAt && <span className="text-dust" dir="ltr">→ {p.endsAt.slice(0, 10)}</span>}
                <span className="ms-auto"><ActionButton action={removePromo.bind(null, i)} label={t("remove")} danger /></span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-steel">{t("noPromos")}</p>
        )}
        <PromoForm />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="street-heading text-3xl">{t("coupons")}</h2>
        <CouponForm />
        {coupons.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.code} className={`border-b border-ash/60 ${c.active ? "" : "opacity-40"}`}>
                    <td className="py-2.5 font-display tracking-widest text-chrome" dir="ltr">{c.code}</td>
                    <td className="py-2.5 text-blood" dir="ltr">−{c.percent}%</td>
                    <td className="py-2.5 text-steel">{c.influencer ?? c.reason}</td>
                    <td className="py-2.5 text-dust" dir="ltr">{t("uses")} {c.uses}{c.maxUses ? `/${c.maxUses}` : ""}</td>
                    <td className="py-2.5 text-dust" dir="ltr">{c.expiresAt ? new Date(c.expiresAt).toISOString().slice(0, 10) : "∞"}</td>
                    <td className="py-2.5 text-end">{c.active && <ActionButton action={deactivateCoupon.bind(null, c.code)} label={t("deactivate")} />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-steel">{t("noCoupons")}</p>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="street-heading text-3xl">{t("influencers")}</h2>
        <ul className="grid gap-3 sm:grid-cols-3">
          {influencers.map((i) => (
            <li key={i._id} className="flex flex-col gap-1 border border-ash p-4">
              <span className="text-bone">{i._id}</span>
              <span className="font-display text-2xl text-chrome" dir="ltr">{i.revenue.toLocaleString("en")} EGP</span>
              <span className="text-xs text-dust" dir="ltr">{i.orders} orders · −{i.discount.toLocaleString("en")} EGP</span>
            </li>
          ))}
          {!influencers.length && <li className="text-sm text-steel">—</li>}
        </ul>
      </section>
    </>
  );
}
