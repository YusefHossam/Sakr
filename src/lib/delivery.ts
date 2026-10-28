// Same-day delivery rules. Pure and client-safe: the checkout, the product page and the server all use the same maths.

export const SAME_DAY = {
  /** Order before this hour (Cairo time) to get it today. */
  cutoffHour: 14,
  fee: 150,
  /** Greater Cairo. */
  governorates: ["cairo", "giza", "qalyubia"],
} as const;

const CAIRO = "Africa/Cairo";
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** The clock as it reads in Cairo. */
export function cairoClock(now: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: CAIRO, hourCycle: "h23", weekday: "short", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    weekday: WEEKDAYS.indexOf(parts.weekday),
    seconds: Number(parts.hour) * 3600 + Number(parts.minute) * 60 + Number(parts.second),
  };
}

export type SameDayStatus = { eligible: boolean; secondsLeft: number; date: string };

/** Whether an order placed now to this destination can arrive today. Friday is the weekend: no deliveries. */
export function sameDayStatus(country: string, governorate: string, now: Date): SameDayStatus {
  const clock = cairoClock(now);
  const secondsLeft = SAME_DAY.cutoffHour * 3600 - clock.seconds;
  const inZone = country === "EG" && (SAME_DAY.governorates as readonly string[]).includes(governorate);
  return { eligible: inZone && secondsLeft > 0 && clock.weekday !== 5, secondsLeft: Math.max(0, secondsLeft), date: clock.date };
}

export function countdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}
