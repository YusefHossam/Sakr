// Monochrome payment marks for the footer (drawn inline; no brand image files).
export function PaymentIcons() {
  const box = "flex h-8 items-center justify-center rounded border border-ash bg-smoke px-2.5";
  return (
    <ul className="flex flex-wrap items-center gap-2" dir="ltr">
      <li className={box} aria-label="Visa">
        <span className="font-display text-sm tracking-wider text-bone italic">VISA</span>
      </li>
      <li className={box} aria-label="Mastercard">
        <svg viewBox="0 0 36 22" className="h-5" aria-hidden="true">
          <circle cx="13" cy="11" r="8" fill="#8a8a8a" />
          <circle cx="23" cy="11" r="8" fill="#5f5f5f" fillOpacity="0.9" />
        </svg>
      </li>
      <li className={box} aria-label="Apple Pay">
        <svg viewBox="0 0 24 24" className="h-4 fill-bone" aria-hidden="true">
          <path d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9s-1.8-.9-3-.8C7 7.4 5.6 8.3 4.8 9.7c-1.7 2.9-.4 7.2 1.2 9.5.8 1.1 1.7 2.4 2.9 2.4 1.2-.1 1.6-.8 3-.8s1.8.8 3 .8c1.3 0 2.1-1.1 2.8-2.3.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.6-1-2.6-4zM14.1 5.8c.6-.8 1.1-1.8 1-2.8-.9 0-2 .6-2.7 1.4-.6.7-1.1 1.7-1 2.7 1 .1 2-.5 2.7-1.3z" />
        </svg>
        <span className="ms-1 text-xs font-semibold text-bone">Pay</span>
      </li>
      <li className={box} aria-label="InstaPay">
        <span className="text-xs font-semibold tracking-wide text-bone">InstaPay</span>
      </li>
      <li className={box} aria-label="Vodafone Cash">
        <span className="text-xs font-semibold tracking-wide text-bone">Vodafone Cash</span>
      </li>
    </ul>
  );
}
