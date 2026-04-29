import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "중고차 수출 - Admin",
  description: "중고차 수출 어드민",
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
