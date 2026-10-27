export function PageHeader({ eyebrow, title, text }: { eyebrow?: string; title: string; text?: string }) {
  return (
    <header className="relative mb-10 overflow-hidden border-b border-ash pb-8 pt-6">
      <div className="smoke-layer opacity-60" aria-hidden="true" />
      <div className="relative flex flex-col gap-2">
        {eyebrow && <p className="text-[11px] tracking-[0.35em] text-dust uppercase">{eyebrow}</p>}
        <h1 className="street-heading text-[clamp(2.6rem,8vw,6rem)] leading-[0.9]" dir="auto">{title}</h1>
        {text && <p className="max-w-xl text-sm text-steel">{text}</p>}
      </div>
    </header>
  );
}
