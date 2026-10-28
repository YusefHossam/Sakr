/** Crew mode: members pool their lifetime spend; each unlocked tier gives every member one personal coupon. */
export const CREW_MAX = 8;
export const CREW_TIERS = [
  { spend: 25_000, percent: 5 },
  { spend: 75_000, percent: 10 },
  { spend: 150_000, percent: 15 },
] as const;
