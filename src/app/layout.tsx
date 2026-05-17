import type { Metadata } from "next";
import { Inter, Instrument_Serif, Allura } from "next/font/google";
import CustomCursor from "@/components/CustomCursor";
import LenisProvider from "@/components/LenisProvider";
import { I18nProvider } from "@/components/I18nProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif",
  display: "swap",
});

const script = Allura({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-script",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SoftRent — Stay where you breathe easier",
  description:
    "A curated collection of tropical villas and mountain chalets, designed for slow, considered stays.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${inter.variable} ${serif.variable} ${script.variable}`}>
      <body className="grain min-h-screen">
        <I18nProvider>
          <LenisProvider>{children}</LenisProvider>
          <CustomCursor />
        </I18nProvider>
      </body>
    </html>
  );
}
