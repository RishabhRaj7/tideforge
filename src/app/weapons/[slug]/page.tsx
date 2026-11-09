import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReportIssue } from "@/components/ReportIssue";
import { ConfidenceBadge, Notice, PageHead, RarityStars } from "@/components/ui";
import { getWeapon, listWeapons } from "@/server/repos";
import { WeaponDetail } from "./WeaponDetail";

export function generateStaticParams() {
  return listWeapons().map((w) => ({ slug: w.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const w = getWeapon((await params).slug);
  return w ? { title: `${w.name} weapon`, description: `${w.name}, ${w.rarity}★ ${w.type}: passive ${w.passive?.name ?? ""} by rank.` } : {};
}

export default async function WeaponPage({ params }: { params: Promise<{ slug: string }> }) {
  const w = getWeapon((await params).slug);
  if (!w) notFound();
  return (
    <div>
      <PageHead kicker={`${w.type} · ${w.source || "Weapon"}`} title={w.name}>
        <RarityStars n={w.rarity} /> {w.resonator && <>Signature weapon of <Link className="text-accent" href={w.resonatorSlug ? `/characters/${w.resonatorSlug}` : "/characters"}>{w.resonator}</Link>.</>}
      </PageHead>
      {w.effectStatus === "unmodelled" && <div className="mb-4"><Notice>This passive is not modelled in the calculator yet, so it adds nothing to damage results.</Notice></div>}
      <WeaponDetail w={{ name: w.name, atk: w.atk, stat: w.stat, statValue: w.statValue, passive: w.passive, ranks: w.ranks, desc: w.desc }} />
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link href={`/calculator?weapon=${w.slug}`} className="btn btn-primary">Try in Calculator</Link>
        <ReportIssue />
        <span className="text-[12px] text-dim">Source: {w.provenance.sourceRef} <ConfidenceBadge level={w.provenance.confidence} /></span>
      </div>
    </div>
  );
}
