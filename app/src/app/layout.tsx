import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import LayoutShell from "@/components/LayoutShell";
import I18nProvider from "@/lib/i18n/I18nProvider";
import {
  LANGUAGE_COOKIE,
  LANGUAGE_I18N_CODE,
  normalizeLanguage,
} from "@/lib/i18n/config";

export const metadata: Metadata = {
  title: "Ajucar",
  description: "Premium Korean used cars for international buyers",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  colorScheme: "light",
  themeColor: "#ffffff",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialLanguage = normalizeLanguage(
    cookieStore.get(LANGUAGE_COOKIE)?.value
  );

  return (
    <html lang={LANGUAGE_I18N_CODE[initialLanguage]}>
      <body className="bg-white text-gray-900 antialiased">
        <I18nProvider initialLanguage={initialLanguage}>
          <LayoutShell>{children}</LayoutShell>
        </I18nProvider>
      </body>
    </html>
  );
}
