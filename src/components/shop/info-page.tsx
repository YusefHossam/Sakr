import { PageHeader } from "@/components/shop/page-header";

/** Shared frame for the help and policy pages: header, then readable sections. */
export function InfoPage({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro?: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[900px] px-4 pt-4 pb-16 md:px-8">
      <PageHeader eyebrow={eyebrow} title={title} text={intro} />
      <div className="flex flex-col gap-10 text-sm leading-relaxed text-steel">{children}</div>
    </div>
  );
}

export function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="street-heading text-2xl">{title}</h2>
      {children}
    </section>
  );
}

export function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((t) => (
        <li key={t} className="flex gap-2">
          <span aria-hidden="true" className="text-dust">—</span>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}
