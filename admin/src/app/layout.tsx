import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ajucar - Admin",
  description: "Ajucar 어드민",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
