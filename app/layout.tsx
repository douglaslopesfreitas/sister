import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SISTER",
  description: "Sistema integrado ao ArcGIS Enterprise da SPM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
