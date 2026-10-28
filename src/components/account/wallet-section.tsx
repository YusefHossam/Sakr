import { getLocale } from "next-intl/server";
import { connectDB } from "@/lib/db";
import { CASHBACK } from "@/lib/wallet";
import { levelFor, User } from "@/models/user";
import { WalletTx } from "@/models/wallet";

const REASONS: Record<string, { ar: string; en: string }> = {
  refund: { ar: "استرداد", en: "Refund" },
  cashback: { ar: "كاش باك", en: "Cashback" },
  gift: { ar: "هدية من SAKR", en: "Gift from SAKR" },
  adjustment: { ar: "تعديل", en: "Adjustment" },
  order: { ar: "دفع أوردر", en: "Order payment" },
  "order-cancelled": { ar: "أوردر اتلغى", en: "Order cancelled" },
};

/** Store credit: the balance, what earns more of it, and the last movements. */
export async function WalletSection({ userId }: { userId: string }) {
  const lang = (await getLocale()) === "ar" ? "ar" : "en";
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);
  await connectDB();
  const [user, moves] = await Promise.all([
    User.findById(userId).select("walletBalance totalSpent").lean(),
    WalletTx.find({ userId }).sort({ createdAt: -1 }).limit(8).lean(),
  ]);
  const level = levelFor(user?.totalSpent ?? 0);
  const rate = Math.round(CASHBACK[level] * 100);

  return (
    <section className="flex flex-col gap-4">
      <h2 className="street-heading text-3xl">{L("المحفظة", "Wallet")}</h2>
      <p className="font-display text-4xl text-chrome" dir="ltr">{(user?.walletBalance ?? 0).toLocaleString("en")} <span className="text-xl text-steel">EGP</span></p>
      <p className="text-xs text-steel">
        {rate > 0
          ? L(`مستواك بيرجّعلك ${rate}٪ كاش باك على كل أوردر بيوصل. الرصيد بتدفع بيه في الدفع، وفلوس الاسترداد بترجع هنا.`, `Your level returns ${rate}% cashback on every delivered order. Spend the balance at checkout; refunds land here.`)
          : L("الكاش باك بيبدأ من مستوى OG. الرصيد بتدفع بيه في الدفع، وفلوس الاسترداد بترجع هنا.", "Cashback starts at OG. Spend the balance at checkout; refunds land here.")}
      </p>
      {moves.length > 0 && (
        <ul className="flex flex-col divide-y divide-ash border-y border-ash text-sm">
          {moves.map((m) => (
            <li key={String(m._id)} className="flex flex-wrap items-center gap-3 py-2.5">
              <span className="text-bone">{REASONS[m.reason]?.[lang] ?? m.reason}</span>
              {m.orderNumber && <span className="text-xs text-dust" dir="ltr">{m.orderNumber}</span>}
              <span className="text-xs text-dust" dir="ltr">{new Date(m.createdAt).toISOString().slice(0, 10)}</span>
              <span className={`ms-auto ${m.amount > 0 ? "text-bone" : "text-steel"}`} dir="ltr">{m.amount > 0 ? "+" : "−"}{Math.abs(m.amount).toLocaleString("en")}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
