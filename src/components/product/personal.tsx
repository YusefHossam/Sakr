import { getTranslations } from "next-intl/server";
import { TryOn } from "@/components/lab/try-on";
import { ArTryOn } from "./ar-try-on";
import { Link } from "@/i18n/navigation";
import { getSession } from "@/lib/auth/session";
import { connectDB } from "@/lib/db";
import type { Category } from "@/lib/categories";
import { User } from "@/models/user";

const TOPS: Category[] = ["hoodies", "crewnecks", "jackets", "tees"];
const BOTTOMS: Category[] = ["pants", "sweatpants", "shorts"];

/** Per-visitor bits of the product page: "your size" from the size passport, and try-on. Rendered in <Suspense>. */
export async function PersonalBits({ category, subcategory, image, title }: { category: Category; subcategory?: string | null; image: string | null; title: string }) {
  const [t, tl, session] = await Promise.all([getTranslations("sizes"), getTranslations("lab"), getSession()]);
  let size: string | null = null;
  if (session) {
    await connectDB();
    const passport = (await User.findById(session.userId).select("sizePassport").lean())?.sizePassport;
    size = TOPS.includes(category) ? (passport?.top ?? null) : BOTTOMS.includes(category) ? (passport?.bottom ?? null) : (category === "footwear" || category === "slides") && passport?.shoeUS ? `US ${passport.shoeUS}` : null;
  }
  return (
    <div className="flex flex-col gap-3">
      {size ? (
        <p className="self-start border border-bone/60 px-3 py-1.5 text-xs text-bone">✓ {t("yourSize", { size })}</p>
      ) : (
        category !== "accessories" && (
          <Link href="/size-finder" className="self-start text-xs text-steel underline underline-offset-4 hover:text-bone">📏 {tl("sizeFinder")}</Link>
        )
      )}
      {category === "accessories" && image && (subcategory === "headwear" || subcategory === "sunglasses") && <ArTryOn image={image} kind={subcategory} />}
      {TOPS.includes(category) && image && <TryOn garmentUrl={image} description={title} loggedIn={!!session} />}
    </div>
  );
}
