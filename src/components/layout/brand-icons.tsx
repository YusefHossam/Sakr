// Brand marks in their own colours, drawn inline (no image files). Used by the footer and anywhere a channel is named.

export type SocialName = "whatsapp" | "instagram" | "snapchat" | "tiktok" | "x";

export function SocialIcon({ name, className = "size-6" }: { name: SocialName; className?: string }) {
  switch (name) {
    case "whatsapp":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path fill="#25D366" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2z" />
          <path fill="#fff" d="M16.6 14.4c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.5.1-.6.8-.8.9-.3.2-.5.1a5.6 5.6 0 0 1-2.8-2.4c-.2-.4.2-.4.6-1.2.1-.1 0-.3 0-.4l-.7-1.6c-.2-.4-.4-.4-.5-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.800 11.800 0 0 0 4.500 4c1.700.7 2.300.8 3.100.7a2.600 2.600 0 0 0 1.700-1.200 2.100 2.100 0 0 0 .1-1.200c-.1-.1-.3-.2-.5-.3z" />
        </svg>
      );
    case "instagram":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <defs>
            <linearGradient id="ig-grad" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="#FEDA75" />
              <stop offset=".35" stopColor="#FA7E1E" />
              <stop offset=".6" stopColor="#D62976" />
              <stop offset="1" stopColor="#4F5BD5" />
            </linearGradient>
          </defs>
          <rect x="2.5" y="2.5" width="19" height="19" rx="5.500" fill="url(#ig-grad)" />
          <circle cx="12" cy="12" r="4.200" fill="none" stroke="#fff" strokeWidth="1.800" />
          <circle cx="17.300" cy="6.700" r="1.200" fill="#fff" />
        </svg>
      );
    case "snapchat":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path fill="#FFFC00" stroke="#111" strokeWidth=".8" strokeLinejoin="round" d="M12 3c3 0 5 2.200 5 5v2.200l1.600-.5c.6.2.6.9 0 1.200l-1.800.9c.5 1.600 1.700 2.800 3.200 3.300-.3.8-1.500 1-2.600 1.200-.2.6-.3 1.200-1 1.200-1 0-1.800-.5-3.400.6-.7.5-1.400.9-2 .9s-1.300-.4-2-.9c-1.600-1.100-2.400-.6-3.400-.6-.7 0-.8-.6-1-1.200-1.100-.2-2.300-.4-2.600-1.200 1.500-.5 2.700-1.700 3.200-3.300l-1.800-.9c-.6-.3-.6-1 0-1.200l1.600.5V8c0-2.800 2-5 5-5z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path fill="#25F4EE" transform="translate(-.9 -.7)" d="M15.500 3c.3 2.500 1.900 4 4.400 4.200V10c-1.700 0-3.200-.5-4.400-1.400V15a6 6 0 1 1-6-6v2.900A3.100 3.100 0 1 0 12.500 15V3z" />
          <path fill="#FE2C55" transform="translate(.9 .7)" d="M15.500 3c.3 2.500 1.900 4 4.400 4.200V10c-1.700 0-3.200-.5-4.400-1.400V15a6 6 0 1 1-6-6v2.900A3.100 3.100 0 1 0 12.500 15V3z" />
          <path fill="#fff" d="M15.500 3c.3 2.500 1.900 4 4.400 4.200V10c-1.700 0-3.200-.5-4.400-1.400V15a6 6 0 1 1-6-6v2.900A3.100 3.100 0 1 0 12.500 15V3z" />
        </svg>
      );
    case "x":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path fill="#fff" d="M17.800 3h3.100l-6.800 7.700L22 21h-6.200l-4.900-6.400L5.300 21H2.200l7.300-8.300L2 3h6.400l4.400 5.800zM16.700 19h1.700L7.400 4.800H5.600z" />
        </svg>
      );
  }
}

export type PayName = "visa" | "mastercard" | "applepay" | "googlepay" | "instapay" | "vodafone" | "fawry" | "meeza" | "paypal" | "amex" | "cod";

const WHITE = "flex h-8 min-w-[3.25rem] items-center justify-center rounded bg-white px-2";

/** One payment method as a small white tile in its brand colours. */
export function PayIcon({ name }: { name: PayName }) {
  switch (name) {
    case "visa":
      return <span className={WHITE}><span className="text-sm font-black tracking-wider text-[#1A1F71] italic">VISA</span></span>;
    case "mastercard":
      return (
        <span className={WHITE}>
          <svg viewBox="0 0 36 22" className="h-5" aria-hidden="true">
            <circle cx="13" cy="11" r="9" fill="#EB001B" />
            <circle cx="23" cy="11" r="9" fill="#F79E1B" />
            <path d="M18 3.800a9 9 0 0 1 0 14.400 9 9 0 0 1 0-14.400z" fill="#FF5F00" />
          </svg>
        </span>
      );
    case "applepay":
      return (
        <span className={WHITE}>
          <svg viewBox="0 0 24 24" className="h-4 fill-black" aria-hidden="true">
            <path d="M16.400 12.600c0-2.300 1.900-3.400 2-3.500-1.100-1.600-2.800-1.800-3.400-1.800-1.400-.1-2.800.9-3.500.9s-1.800-.9-3-.8C7 7.400 5.600 8.300 4.800 9.700c-1.700 2.900-.4 7.200 1.200 9.500.8 1.100 1.700 2.400 2.900 2.400 1.200-.1 1.600-.8 3-.8s1.800.8 3 .8c1.300 0 2.100-1.100 2.800-2.300.9-1.300 1.300-2.600 1.300-2.700-.1 0-2.600-1-2.600-4zM14.100 5.800c.6-.8 1.100-1.800 1-2.800-.9 0-2 .6-2.700 1.400-.6.7-1.100 1.700-1 2.700 1 .1 2-.5 2.700-1.300z" />
          </svg>
          <span className="ms-1 text-xs font-semibold text-black">Pay</span>
        </span>
      );
    case "googlepay":
      return (
        <span className={WHITE}>
          <span className="text-sm font-bold"><span className="text-[#4285F4]">G</span><span className="text-[#EA4335]">o</span><span className="text-[#FBBC05]">o</span></span>
          <span className="ms-1 text-xs font-semibold text-[#5F6368]">Pay</span>
        </span>
      );
    case "instapay":
      return <span className={WHITE}><span className="text-xs font-bold tracking-wide text-[#5B2A86]">insta<span className="text-[#F26B21]">pay</span></span></span>;
    case "vodafone":
      return (
        <span className={WHITE}>
          <span className="me-1.5 grid size-5 place-items-center rounded-full bg-[#E60000] text-[11px] leading-none font-black text-white">”</span>
          <span className="text-[11px] font-bold text-[#E60000]">Vodafone Cash</span>
        </span>
      );
    case "fawry":
      return <span className="flex h-8 min-w-[3.25rem] items-center justify-center rounded bg-[#FFD400] px-2"><span className="text-xs font-black tracking-wide text-[#0A2A6B]">fawry</span></span>;
    case "meeza":
      return <span className={WHITE}><span className="text-xs font-black tracking-wide text-[#0B3C8C]">meeza</span></span>;
    case "paypal":
      return <span className={WHITE}><span className="text-xs font-bold italic"><span className="text-[#003087]">Pay</span><span className="text-[#009CDE]">Pal</span></span></span>;
    case "amex":
      return <span className="flex h-8 min-w-[3.25rem] items-center justify-center rounded bg-[#016FD0] px-2"><span className="text-[11px] font-black tracking-wider text-white">AMEX</span></span>;
    case "cod":
      return <span className="flex h-8 items-center justify-center gap-1 rounded border border-iron bg-smoke px-2 text-[11px] text-bone">EGP · COD</span>;
  }
}
