import type { BadgeView } from "@/lib/badges";

export function BadgeGrid({ badges, showHints = false }: { badges: BadgeView[]; showHints?: boolean }) {
  return (
    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-9">
      {badges.map((b) => (
        <li key={b.key} title={b.hint} className={`flex flex-col items-center gap-1 border p-3 text-center ${b.earned ? "border-bone/60 text-bone" : "border-ash text-dust opacity-50"}`}>
          <span className="font-display text-xl" aria-hidden>{b.icon}</span>
          <span className="text-[10px] tracking-[0.15em] uppercase">{b.label}</span>
          {showHints && <span className="text-[10px] leading-tight text-dust normal-case">{b.hint}</span>}
        </li>
      ))}
    </ul>
  );
}
