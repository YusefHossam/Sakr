import type { Metadata, Viewport } from "next";
import { Anton, IBM_Plex_Sans_Arabic, UnifrakturMaguntia } from "next/font/google";
import { notFound } from "next/navigation";
import Script from "next/script";
import { locale as rootLocale } from "next/root-params";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Bats } from "@/components/layout/bats";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Intro } from "@/components/layout/intro";
import { MusicPlayer } from "@/components/layout/music-player";
import { MusicProvider } from "@/components/providers/music-provider";
import { RegionProvider } from "@/components/providers/region-provider";
import { localeDirection, routing } from "@/i18n/routing";
import { INTRO_KEY } from "@/lib/constants";
import { getRates } from "@/lib/rates";
import "../globals.css";

const plex = IBM_Plex_Sans_Arabic({
  variable: "--font-plex",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});
const anton = Anton({ variable: "--font-anton", subsets: ["latin"], weight: "400", display: "swap" });
const gothic = UnifrakturMaguntia({ variable: "--font-gothic-face", subsets: ["latin"], weight: "400", display: "block" });

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#000000",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");
  return { title: { default: `SAKR — ${t("tagline")}`, template: "%s — SAKR" }, description: t("tagline") };
}

// Runs before first paint: hides the intro for visitors who already pressed ENTER this session.
const skipIntroScript = `try{if(sessionStorage.getItem(${JSON.stringify(INTRO_KEY)}))document.documentElement.dataset.entered="1"}catch(e){}`;

export default async function LocaleLayout({ children }: LayoutProps<"/[locale]">) {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) notFound();
  const rates = await getRates();

  return (
    <html
      lang={locale}
      dir={localeDirection[locale]}
      className={`${plex.variable} ${anton.variable} ${gothic.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="grain vhs flex min-h-full flex-col">
        <Script id="skip-intro" strategy="beforeInteractive">
          {skipIntroScript}
        </Script>
        <NextIntlClientProvider>
          <RegionProvider rates={rates}>
            <MusicProvider>
              <Intro />
              <Bats />
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
              <MusicPlayer />
            </MusicProvider>
          </RegionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
