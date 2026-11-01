import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { Bullets, InfoPage, InfoSection } from "@/components/shop/info-page";
import { Link } from "@/i18n/navigation";
import { sizeChartFor, type SizeChart } from "@/lib/size-charts";

export const metadata: Metadata = { title: "Size guide" };

function Chart({ chart }: { chart: SizeChart }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-center text-sm" dir="ltr">
        <thead>
          <tr className="border-b border-ash text-xs tracking-wider text-dust uppercase">
            {chart.columns.map((c) => <th key={c} scope="col" className="px-3 py-2 font-normal">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {chart.rows.map((row) => (
            <tr key={String(row[0])} className="border-b border-ash/60">
              {row.map((cell, i) => <td key={i} className={`px-3 py-2.5 ${i === 0 ? "text-bone" : ""}`}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function SizeGuidePage() {
  const ar = (await getLocale()) === "ar";
  return (
    <InfoPage
      eyebrow={ar ? "المقاسات" : "SIZES"}
      title={ar ? "دليل المقاسات" : "Size guide"}
      intro={ar ? "المقاسات بالسنتي. الأرقام تقريبية وبتختلف شوية من براند لبراند، وصفحة كل منتج فيها جدوله." : "Measurements in cm. They are approximate and vary a little by brand; every product page has its own chart."}
    >
      <p className="border border-bone/30 bg-smoke p-4 text-bone">
        {ar ? "أسهل طريقة: " : "Easiest way: "}
        <Link href="/size-finder" className="underline underline-offset-4">{ar ? "اعرف مقاسك بالكاميرا" : "find your size with the camera"}</Link>
        {ar ? ". صورة واحدة ويطلعلك مقاسك، والصورة مبتسيبش موبايلك." : ". One photo gives your size, and the photo never leaves your phone."}
      </p>
      <InfoSection title={ar ? "تيشيرتات وهوديز وجواكت" : "Tees, hoodies and jackets"}>
        <Chart chart={sizeChartFor("hoodies")!} />
      </InfoSection>
      <InfoSection title={ar ? "بناطيل وشورتات" : "Pants and shorts"}>
        <Chart chart={sizeChartFor("pants")!} />
      </InfoSection>
      <InfoSection title={ar ? "شوزات" : "Shoes"}>
        <Chart chart={sizeChartFor("footwear")!} />
      </InfoSection>
      <InfoSection title={ar ? "تقيس نفسك إزاي" : "How to measure"}>
        <Bullets
          items={
            ar
              ? ["الصدر: حوالين أعرض حتة في صدرك، والشريط مفرود.", "الوسط: حوالين وسطك عند السُرّة.", "طول الرجل: من بين الرجلين لحد الكعب.", "الرجل: قيس رجلك من الكعب لأطول صباع، واختار المقاس الأقرب في عمود CM.", "بتحب اللبس أوفرسايز؟ زوّد مقاس."]
              : ["Chest: around the widest part, tape level.", "Waist: around your natural waist at the navel.", "Inseam: from the crotch to the heel.", "Feet: heel to longest toe, then pick the closest CM.", "Like it oversized? Go one size up."]
          }
        />
      </InfoSection>
    </InfoPage>
  );
}
