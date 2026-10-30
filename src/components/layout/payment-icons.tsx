import { PayIcon, type PayName } from "./brand-icons";

const METHODS: PayName[] = ["visa", "mastercard", "amex", "applepay", "googlepay", "paypal", "instapay", "vodafone", "fawry", "meeza", "cod"];

/** Accepted payment methods for the footer, in their brand colours. */
export function PaymentIcons() {
  return (
    <ul className="flex flex-wrap items-center gap-2" dir="ltr">
      {METHODS.map((m) => (
        <li key={m} aria-label={m}>
          <PayIcon name={m} />
        </li>
      ))}
    </ul>
  );
}
