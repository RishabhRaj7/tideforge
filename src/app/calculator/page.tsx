import type { Metadata } from "next";
import { PageHead } from "@/components/ui";
import { listCharacters } from "@/server/repos";
import { CalculatorClient } from "./CalculatorClient";

export const metadata: Metadata = {
  title: "Damage Calculator",
  description: "Wuthering Waves damage calculator: real DEF and RES zones, HP/DEF scaling, Echo builds, enemy presets, stat weights and a full explain panel.",
};

export default async function CalculatorPage({ searchParams }: { searchParams: Promise<{ char?: string; weapon?: string; build?: string }> }) {
  const sp = await searchParams;
  const chars = listCharacters().map((c) => ({
    slug: c.slug, name: c.name, element: c.element, weapon: c.weapon, rarity: c.rarity,
    unusable: c.issues.includes("no-skill-rows"), placeholder: c.issues.includes("placeholder-base-stats"),
  }));
  return (
    <div>
      <PageHead kicker="Tools" title="Damage Calculator">
        Build a Resonator, pick an enemy, choose the hits in your rotation and see exactly where every point of damage comes from. Open <b>Explain</b> on any row to see each zone.
      </PageHead>
      <CalculatorClient chars={chars} initial={{ char: sp.char, weapon: sp.weapon, build: sp.build }} />
    </div>
  );
}
