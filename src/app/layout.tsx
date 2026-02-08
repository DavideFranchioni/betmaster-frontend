import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "BetMaster - Calcolatori Match Betting Professionali",
    template: "%s | BetMaster",
  },
  description: "Strumenti professionali per il match betting: calcolatore punta-banca, dutching, surebet e molto altro. Massimizza i tuoi profitti con calcoli precisi.",
  keywords: ["match betting", "calcolatore punta banca", "betting exchange", "scommesse", "betfair", "arbitraggio"],
  authors: [{ name: "BetMaster" }],
  creator: "BetMaster",
  metadataBase: new URL("https://match.tradinglegend.ai"),
  openGraph: {
    type: "website",
    locale: "it_IT",
    url: "https://match.tradinglegend.ai",
    siteName: "BetMaster",
    title: "BetMaster - Calcolatori Match Betting Professionali",
    description: "Strumenti professionali per il match betting",
  },
  twitter: {
    card: "summary_large_image",
    title: "BetMaster - Calcolatori Match Betting",
    description: "Strumenti professionali per il match betting",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" className={inter.variable}>
      <body className="min-h-screen flex flex-col">
        <Providers>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
