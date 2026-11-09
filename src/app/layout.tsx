import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { SiteFooter, SiteHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: { default: "Resonance Index — Wuthering Waves database, builds and tools", template: "%s · Resonance Index" },
  description:
    "Every Resonator, weapon, Echo, Sonata set, event and Convene banner for Wuthering Waves, with a build and damage simulator.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        <main className="mx-auto max-w-[1240px] px-5 pt-8">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
