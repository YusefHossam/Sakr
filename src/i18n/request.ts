import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { locale as rootLocale } from "next/root-params";
import { routing } from "./routing";

export default getRequestConfig(async ({ locale: override }) => {
  // `override` is set when a locale is passed explicitly, e.g. getTranslations({ locale }).
  const requested = override ?? (await rootLocale());
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    timeZone: "Africa/Cairo",
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
