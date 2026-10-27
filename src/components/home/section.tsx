import { Link } from "@/i18n/navigation";

export function Section({
  title,
  text,
  href,
  linkLabel,
  children,
}: {
  title: string;
  text?: string;
  href?: string;
  linkLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto mt-24 max-w-[1500px] px-4 md:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-ash pb-4">
        <div className="flex flex-col gap-2">
          <h2 className="street-heading text-[clamp(2rem,5vw,3.75rem)] leading-none">{title}</h2>
          {text && <p className="max-w-xl text-sm text-steel">{text}</p>}
        </div>
        {href && linkLabel && (
          <Link href={href} className="text-sm tracking-[0.2em] text-steel uppercase underline-offset-4 hover:text-chrome hover:underline">
            {linkLabel} →
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
