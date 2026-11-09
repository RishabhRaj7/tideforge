import type { Metadata } from "next";
import Link from "next/link";
import { PageHead, Notice } from "@/components/ui";
import { listCharacterCards } from "@/server/repos";
import { TIER_ENTRIES, TIER_META } from "@/content/tier-list";
import { TierBoard } from "./TierBoard";

export const metadata: Metadata = {
  title: "Wuthering Waves Tier List",
  description: "Editorial tier list for every rated Resonator, filterable by role and element, with a public changelog.",
};

export default function TierListPage() {
  const cards = listCharacterCards();
  const rated = cards
    .filter((c) => TIER_ENTRIES[c.slug])
    .map((c) => ({ slug: c.slug, name: c.name, element: c.element, weapon: c.weapon, rarity: c.rarity, ...TIER_ENTRIES[c.slug] }));
  const unrated = cards.filter((c) => !TIER_ENTRIES[c.slug]).map((c) => ({ slug: c.slug, name: c.name, element: c.element, rarity: c.rarity }));
  return (
    <div>
      <PageHead kicker="Meta" title="Tier List">
        An editorial ranking by role. It weighs damage ceiling, consistency and team value. Rankings are opinion, not a DPR measurement: test any Resonator in the{" "}
        <Link href="/calculator" className="text-accent">Damage Calculator</Link>.
      </PageHead>
      <div className="mb-6 flex flex-wrap items-center gap-3 text-[12.5px] text-dim">
        <span>Game version {TIER_META.version}</span>·<span>Last verified {TIER_META.verifiedAt}</span>·
        <Link href="/tier-list/history" className="text-accent">Changelog</Link>
      </div>
      <div className="mb-6">
        <Notice tone="info">
          Objective (engine DPR) scores are not published yet. We would rather show no number than an unverified one. See <Link href="/methodology" className="text-accent">Methodology</Link>.
        </Notice>
      </div>
      <TierBoard rated={rated} unrated={unrated} />
    </div>
  );
}
