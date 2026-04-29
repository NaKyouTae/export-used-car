import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "중고차 수출",
  description: "중고차 수출 서비스",
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
