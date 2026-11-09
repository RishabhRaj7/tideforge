import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Notice, PageHead } from "@/components/ui";
import { ConvenePlanner } from "./ConvenePlanner";

export const metadata: Metadata = { title: "Convene Planner", description: "Wuthering Waves pity and probability planner for featured Resonator and weapon banners." };

export default function ConvenePage() {
  return (
    <div>
      <PageHead kicker="Plan" title="Convene Planner">
        Probability of landing your featured 5★ with the pulls you have. Resonator banners use the 50/50 rule and a guarantee; weapon banners guarantee the featured weapon.
      </PageHead>
      <Suspense fallback={<div className="skeleton h-72" />}><ConvenePlanner /></Suspense>
      <div className="mt-6 grid gap-3">
        <Notice tone="info">Official: 0.8% base 5★ rate and hard pity at 80. The soft-pity ramp starting around pull 66 is a community fit, not an official number. Choose the conservative model to assume a later, steeper ramp.</Notice>
        <p className="text-[12.5px] text-dim">Pity is shared across all Featured Resonator banners, and separately across Featured Weapon banners. See the <Link className="text-accent" href="/banners">banners page</Link> for what is live.</p>
      </div>
    </div>
  );
}
