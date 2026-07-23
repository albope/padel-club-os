import type { Metadata, Viewport } from "next";
import { Archivo, Instrument_Sans, Inter, Sora } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";
import Providers from "@/components/providers";
import { CLASE_TEMA_MARCADOR, temaMarcadorActivo } from "@/lib/feature-flags";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, SITE_LOCALE } from "@/lib/seo";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["400", "600", "700", "800"],
});

// Identidad «Marcador»: Instrument Sans (UI) y Archivo (display, eje wdth)
// reutilizan las variables --font-inter/--font-sora para no tocar Tailwind.
const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-inter",
});
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-sora",
  axes: ["wdth"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - Gestion de clubes de padel`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: SITE_LOCALE,
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} - Gestion de clubes de padel`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} - Gestion de clubes de padel`,
    description: SITE_DESCRIPTION,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PadelOS",
  },
  formatDetection: {
    telephone: false,
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export const viewport: Viewport = {
  themeColor: temaMarcadorActivo() ? "#157A54" : "#3b82f6",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  const temaMarcador = temaMarcadorActivo();
  const clasesBody = temaMarcador
    ? `${instrumentSans.variable} ${archivo.variable} font-sans ${CLASE_TEMA_MARCADOR}`
    : `${inter.variable} ${sora.variable} font-sans`;

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className={clasesBody}>
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}