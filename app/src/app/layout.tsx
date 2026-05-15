import type { Metadata } from "next";
import "./globals.css";
import LayoutShell from "@/components/LayoutShell";

export const metadata: Metadata = {
  title: "Ajucar",
  description: "Premium Korean used cars for international buyers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 antialiased">
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
