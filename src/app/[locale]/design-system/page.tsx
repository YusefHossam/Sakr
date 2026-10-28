import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { Price } from "@/components/product/price";
import { PageHeader } from "@/components/shop/page-header";

export const metadata: Metadata = { title: "Design system", robots: { index: false } };

const COLORS = [
  ["ink", "bg-ink"], ["pitch", "bg-pitch"], ["smoke", "bg-smoke"], ["ash", "bg-ash"], ["iron", "bg-iron"],
  ["dust", "bg-dust"], ["steel", "bg-steel"], ["bone", "bg-bone"], ["chrome", "bg-chrome"], ["blood", "bg-blood"], ["tile", "bg-tile"],
] as const;

const MOODS = [["drip", "Drip"], ["clean", "Clean"], ["opium", "Opium"], ["old-money", "Old Money"]] as const;

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-ash pt-6">
      <h2 className="text-xs tracking-[0.3em] text-dust uppercase">{title}</h2>
      {children}
    </section>
  );
}

/** Every building block of the store in one place: colours, type, buttons, fields, cards, states. */
export default async function DesignSystemPage() {
  const ar = (await getLocale()) === "ar";
  const L = (a: string, e: string) => (ar ? a : e);
  return (
    <div className="mx-auto max-w-[1100px] px-4 pt-4 md:px-8">
      <PageHeader eyebrow="DESIGN SYSTEM" title="SAKR" text={L("كل مكوّن في المتجر في صفحة واحدة: الألوان والخطوط والأزرار والحقول والكروت.", "Every building block of the store on one page: colours, type, buttons, fields, cards.")} />
      <div className="flex flex-col gap-12 pb-16">
        <Block title={L("الألوان", "Colours")}>
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {COLORS.map(([name, cls]) => (
              <li key={name} className="flex flex-col gap-1">
                <span className={`h-16 border border-iron ${cls}`} />
                <span className="text-xs text-steel" dir="ltr">{name}</span>
              </li>
            ))}
          </ul>
        </Block>

        <Block title={L("المودات (بتغيّر ألوان الموقع كله)", "Moods (they re-tint the whole site)")}>
          <ul className="flex flex-wrap gap-3">
            {MOODS.map(([key, name]) => (
              <li key={key} data-mood={key} className="flex items-center gap-3 border border-ash bg-smoke px-4 py-3">
                <span className="size-4 bg-blood" aria-hidden />
                <span className="size-4 bg-chrome" aria-hidden />
                <span className="text-sm text-bone">{name}</span>
              </li>
            ))}
          </ul>
        </Block>

        <Block title={L("الخطوط", "Typography")}>
          <p className="chrome-text font-gothic text-6xl leading-none">Sakr</p>
          <p className="street-heading text-5xl">Street heading</p>
          <p className="font-display text-2xl tracking-[0.2em] uppercase text-bone">Display / Anton</p>
          <p className="text-base text-bone">Body text in IBM Plex Sans Arabic. نص عربي بنفس الخط.</p>
          <p className="text-xs tracking-[0.3em] text-dust uppercase">Eyebrow label</p>
        </Block>

        <Block title={L("الأزرار", "Buttons")}>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="min-h-12 bg-bone px-8 font-display tracking-[0.3em] text-ink uppercase transition-colors hover:bg-chrome">Primary</button>
            <button type="button" className="min-h-11 border border-bone/70 px-6 font-display tracking-[0.25em] text-bone uppercase hover:bg-bone hover:text-ink">Outline</button>
            <button type="button" className="min-h-11 border border-ash px-6 text-xs tracking-[0.3em] text-steel uppercase hover:text-bone">Quiet</button>
            <button type="button" disabled className="min-h-11 border border-bone/70 px-6 font-display tracking-[0.25em] text-bone uppercase opacity-60">Disabled</button>
            <button type="button" className="text-xs text-dust underline underline-offset-4 hover:text-bone">Text link</button>
          </div>
        </Block>

        <Block title={L("الحقول", "Fields")}>
          <div className="grid max-w-xl gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs text-dust">Text<input placeholder="Placeholder" className="min-h-11 border border-ash bg-smoke px-3 text-bone placeholder:text-dust" /></label>
            <label className="flex flex-col gap-1 text-xs text-dust">Select<select className="min-h-11 border border-ash bg-smoke px-3 text-bone"><option>Option</option></select></label>
            <label className="flex items-center gap-2 text-sm text-steel"><input type="checkbox" className="size-4" /> Checkbox</label>
          </div>
        </Block>

        <Block title={L("السعر", "Price")}>
          <div className="flex flex-wrap gap-8">
            <Price price={4500} />
            <Price price={4500} salePrice={3600} size="lg" />
          </div>
        </Block>

        <Block title={L("الحالات", "States")}>
          <div className="grid gap-3 md:grid-cols-2">
            <p className="border border-bone/40 bg-smoke p-4 text-sm text-bone" role="status">{L("نجاح / معلومة", "Success / info")}</p>
            <p className="border border-blood/50 bg-blood/10 p-4 text-sm text-bone" role="alert">{L("تنبيه / خطأ", "Warning / error")}</p>
            <div className="h-16 animate-pulse bg-smoke" aria-label="Loading" />
            <p className="flex items-center gap-2 text-xs text-steel"><span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-blood opacity-75" /><span className="relative inline-flex size-2 rounded-full bg-blood" /></span>{L("بث مباشر", "Live")}</p>
          </div>
        </Block>

        <Block title={L("كارت المنتج", "Product card")}>
          <div className="grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-3">
            {["Corteiz Alcatraz Cargo", "Chrome Hearts Cross Hoodie", "Nike Air Force 1"].map((t) => (
              <div key={t} className="flex flex-col gap-1">
                <span className="aspect-square bg-tile" />
                <span className="text-[10px] tracking-[0.2em] text-dust uppercase" dir="ltr">Brand</span>
                <span className="text-xs text-steel" dir="ltr">{t}</span>
                <Price price={3200} />
              </div>
            ))}
          </div>
        </Block>
      </div>
    </div>
  );
}
