import { Suspense } from "react";
import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { CrewActions, CrewStart } from "@/components/social/crew-panel";
import { PageHeader } from "@/components/shop/page-header";
import { Link } from "@/i18n/navigation";
import { getSession } from "@/lib/auth/session";
import { CREW_MAX, CREW_TIERS } from "@/lib/crew";
import { connectDB } from "@/lib/db";
import { Crew } from "@/models/social";
import { User } from "@/models/user";

export const metadata: Metadata = { title: "Crew" };

export default function CrewPage() {
  return (
    <div className="mx-auto max-w-[1100px] px-4 pt-4 md:px-8">
      <Suspense fallback={<div className="h-96 animate-pulse bg-smoke" />}>
        <Content />
      </Suspense>
    </div>
  );
}

async function Content() {
  const [lang, session] = await Promise.all([getLocale().then((l) => (l === "ar" ? "ar" : "en")), getSession()]);
  const ar = lang === "ar";
  const header = (
    <PageHeader
      eyebrow="CREW"
      title={ar ? "الكرو" : "Crew mode"}
      text={ar ? `لمّ لحد ${CREW_MAX} صحاب. كل ما مصروف الكرو يكبر، كل واحد فيكم ياخد كوبون أكبر.` : `Gather up to ${CREW_MAX} friends. The more the crew spends together, the bigger everyone's coupon.`}
    />
  );
  if (!session)
    return (
      <>
        {header}
        <p className="py-10 text-steel">
          <Link href="/login?next=/crew" className="text-bone underline underline-offset-4">{ar ? "سجّل دخول" : "Log in"}</Link> {ar ? "عشان تعمل كرو أو تدخل واحد." : "to start or join a crew."}
        </p>
      </>
    );

  await connectDB();
  const crew = await Crew.findOne({ members: session.userId }).lean();
  if (!crew)
    return (
      <>
        {header}
        <CrewStart />
      </>
    );

  const users = await User.find({ _id: { $in: crew.members } }).select("name totalSpent").lean();
  const spend = users.reduce((s, u) => s + u.totalSpent, 0);
  const mine = crew.claimed.filter((c) => String(c.userId) === session.userId).map((c) => c.tier ?? 0);
  const unlocked = CREW_TIERS.map((t, i) => (spend >= t.spend ? i : -1)).filter((i) => i >= 0);
  const next = CREW_TIERS.find((t) => spend < t.spend);

  return (
    <>
      {header}
      <div className="flex flex-col gap-10">
        <section className="flex flex-col gap-2 border border-ash p-5">
          <p className="street-heading text-3xl" dir="auto">{crew.name}</p>
          <p className="text-xs tracking-[0.3em] text-dust uppercase">
            {ar ? "كود الدعوة" : "Invite code"}: <span className="font-display text-xl tracking-widest text-chrome" dir="ltr">{crew.code}</span> · {crew.members.length}/{CREW_MAX}
          </p>
          <p className="text-sm text-steel">
            {ar ? "مصروف الكرو" : "Crew spend"}: <span className="text-bone" dir="ltr">{spend.toLocaleString("en")} EGP</span>
            {next && <> · {ar ? "باقي" : "left to next tier"}: <span dir="ltr">{(next.spend - spend).toLocaleString("en")} EGP</span></>}
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="street-heading text-2xl">{ar ? "المستويات" : "Tiers"}</h2>
          <ul className="grid gap-3 sm:grid-cols-3">
            {CREW_TIERS.map((t, i) => (
              <li key={t.spend} className={`flex flex-col gap-1 border p-4 ${spend >= t.spend ? "border-bone/60" : "border-ash opacity-60"}`}>
                <span className="font-display text-3xl text-chrome">−{t.percent}%</span>
                <span className="text-xs text-steel" dir="ltr">{t.spend.toLocaleString("en")} EGP</span>
                <span className="text-[10px] tracking-[0.2em] text-dust uppercase">{spend >= t.spend ? (ar ? "مفتوح" : "Unlocked") : ar ? "مقفول" : "Locked"} · #{i + 1}</span>
              </li>
            ))}
          </ul>
          {unlocked.length > 0 && <CrewActions claimable={unlocked} mine={mine} />}
          {unlocked.length === 0 && <CrewActions claimable={[]} mine={[]} />}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="street-heading text-2xl">{ar ? "الأعضاء" : "Members"}</h2>
          <ul className="flex flex-wrap gap-2">
            {users.map((u) => (
              <li key={String(u._id)} className="border border-ash px-4 py-2 text-sm text-steel">
                {u.name.split(" ")[0]}
                {String(u._id) === String(crew.ownerId) && <span className="ms-2 text-[10px] text-dust">★</span>}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
