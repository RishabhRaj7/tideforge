import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Sora } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import { MotionProvider } from "@/components/motion";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const sora = Sora({ subsets: ["latin"], variable: "--font-sora", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Tideforge: Wuthering Waves meta, builds and damage calculator", template: "%s · Tideforge" },
  description: "Forge your resonance. Tier list, Resonator, weapon and Echo database, damage calculator and Convene planner for Wuthering Waves, with data confidence on every number.",
  openGraph: { title: "Tideforge", description: "Every number, every build. A Wuthering Waves companion.", type: "website", siteName: "Tideforge" },
};
export const viewport: Viewport = { themeColor: "#07090b", colorScheme: "dark" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable} ${mono.variable}`}>
      <body>
        <MotionProvider>
          <a href="#main" className="skip-link">Skip to content</a>
          <Header />
          <main id="main" className="mx-auto max-w-[1240px] px-4 pt-8 md:px-5">
            {children}
          </main>
          <Footer />
          <CommandPalette />
        </MotionProvider>
      </body>
    </html>
  );
}
