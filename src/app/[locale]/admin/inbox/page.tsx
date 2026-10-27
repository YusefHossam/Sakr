import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { ActionButton } from "@/components/admin/ui";
import { Link } from "@/i18n/navigation";
import { markRestockHandled, moderateReview, setExchangeStatus } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth/admin";
import { connectDB } from "@/lib/db";
import { NotifyRequest, Review } from "@/models/engagement";
import { ExchangeRequest } from "@/models/exchange";
import { Signup } from "@/models/signup";

export default async function Inbox() {
  const t = await getTranslations("admin.inbox");
  return (
    <div className="flex flex-col gap-12">
      <h1 className="street-heading text-5xl">{t("title")}</h1>
      <Suspense fallback={<div className="h-96 animate-pulse bg-smoke" />}>
        <Content />
      </Suspense>
    </div>
  );
}

const CHANNEL_LINK: Record<string, (h: string) => string> = {
  whatsapp: (h) => `https://wa.me/${h.replace(/\D/g, "").replace(/^0/, "20")}`,
  instagram: (h) => `https://instagram.com/${h.replace(/^@/, "")}`,
  snapchat: (h) => `https://snapchat.com/add/${h.replace(/^@/, "")}`,
};

async function Content() {
  await requireAdmin();
  await connectDB();
  const [t, tr, reviews, exchanges, restock, signups] = await Promise.all([
    getTranslations("admin.inbox"),
    getTranslations("account.reasons"),
    Review.find({ approved: false }).sort({ createdAt: -1 }).limit(50).lean(),
    ExchangeRequest.find({ status: "open" }).sort({ createdAt: -1 }).limit(50).lean(),
    NotifyRequest.find({ notified: false }).sort({ createdAt: -1 }).limit(100).lean(),
    Signup.find().sort({ createdAt: -1 }).limit(100).lean(),
  ]);
  const empty = <p className="text-sm text-steel">{t("empty")}</p>;

  return (
    <>
      <section className="flex flex-col gap-3">
        <h2 className="street-heading text-3xl">{t("reviews")} · {reviews.length}</h2>
        {reviews.length ? (
          <ul className="flex flex-col divide-y divide-ash border-y border-ash">
            {reviews.map((r) => (
              <li key={String(r._id)} className="flex flex-wrap items-start gap-4 py-4 text-sm">
                <div className="flex flex-1 flex-col gap-1">
                  <p className="text-bone"><span dir="ltr">{"★".repeat(r.rating)}</span> · {r.name} · <Link href={`/product/${r.productSlug}`} className="text-dust underline" dir="ltr">{r.productSlug}</Link></p>
                  <p className="text-steel" dir="auto">{r.text}</p>
                </div>
                <ActionButton action={moderateReview.bind(null, String(r._id), true)} label={t("approve")} />
                <ActionButton action={moderateReview.bind(null, String(r._id), false)} label={t("delete")} danger />
              </li>
            ))}
          </ul>
        ) : empty}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="street-heading text-3xl">{t("exchanges")} · {exchanges.length}</h2>
        {exchanges.length ? (
          <ul className="flex flex-col divide-y divide-ash border-y border-ash">
            {exchanges.map((x) => (
              <li key={String(x._id)} className="flex flex-wrap items-center gap-4 py-4 text-sm">
                <Link href={`/admin/orders/${x.orderNumber}`} className="font-display tracking-widest text-bone" dir="ltr">{x.orderNumber}</Link>
                <span className="text-steel">{tr(x.reason)}</span>
                {x.note && <span className="text-dust" dir="auto">{x.note}</span>}
                <span className="ms-auto flex gap-2">
                  <ActionButton action={setExchangeStatus.bind(null, String(x._id), "approved")} label={t("accept")} />
                  <ActionButton action={setExchangeStatus.bind(null, String(x._id), "rejected")} label={t("decline")} danger />
                </span>
              </li>
            ))}
          </ul>
        ) : empty}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="street-heading text-3xl">{t("restock")} · {restock.length}</h2>
        {restock.length ? (
          <ul className="flex flex-col divide-y divide-ash border-y border-ash">
            {restock.map((n) => (
              <li key={String(n._id)} className="flex flex-wrap items-center gap-4 py-3 text-sm">
                <Link href={`/admin/products/${n.productSlug}`} className="text-bone" dir="ltr">{n.productSlug}</Link>
                <span className="text-steel" dir="ltr">{n.size}{n.color && ` · ${n.color}`}</span>
                <a href={CHANNEL_LINK[n.channel]?.(n.handle)} target="_blank" rel="noreferrer" className="text-bone underline" dir="ltr">{n.channel}: {n.handle}</a>
                <span className="ms-auto"><ActionButton action={markRestockHandled.bind(null, String(n._id))} label="✓" /></span>
              </li>
            ))}
          </ul>
        ) : empty}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="street-heading text-3xl">{t("signups")} · {signups.length}</h2>
        {signups.length ? (
          <ul className="grid gap-1 text-sm text-steel sm:grid-cols-2" dir="ltr">
            {signups.map((s) => <li key={String(s._id)}>{s.channel}: {s.contact} <span className="text-dust">({s.source})</span></li>)}
          </ul>
        ) : empty}
      </section>
    </>
  );
}
