import type { Metadata } from "next";
import { Geist_Mono, Itim } from "next/font/google";
import "./globals.css";

const itim = Itim({
  variable: "--font-itim",
  subsets: ["latin", "thai"],
  weight: "400",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Goose Wander",
  description: "Realtime goose wandering experience",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${itim.variable} ${geistMono.variable} h-full`}>
      <body className={`${itim.className} min-h-full flex flex-col antialiased`}>{children}</body>
    </html>
  );
}
