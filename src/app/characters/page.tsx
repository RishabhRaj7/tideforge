import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHead } from "@/components/ui";
import { TIER_ENTRIES } from "@/content/tier-list";
import { listCharacterCards } from "@/server/repos";
import { CharacterBrowser } from "./CharacterBrowser";

export const metadata: Metadata = { title: "Resonators", description: "Every Wuthering Waves Resonator with filters by element, weapon, rarity, role and release version." };

export default function CharactersPage() {
  const cards = listCharacterCards().map((c) => ({ ...c, tier: TIER_ENTRIES[c.slug]?.tier ?? null, role: TIER_ENTRIES[c.slug]?.role ?? null }));
  return (
    <div>
      <PageHead kicker="Database" title="Resonators">Filter by element, weapon, rarity or role. Mark the ones you own to personalise the tier list (saved on this device only).</PageHead>
      <Suspense fallback={<div className="skeleton h-64" />}>
        <CharacterBrowser cards={cards} />
      </Suspense>
    </div>
  );
}
