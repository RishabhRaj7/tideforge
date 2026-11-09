import type { Metadata } from "next";
import { PageHead } from "@/components/ui";
import { listWeapons } from "@/server/repos";
import { WeaponBrowser } from "./WeaponBrowser";

export const metadata: Metadata = { title: "Weapons", description: "All Wuthering Waves weapons with passives by Syntonization rank." };

export default function WeaponsPage() {
  const rows = listWeapons().map((w) => ({ slug: w.slug, name: w.name, type: w.type, rarity: w.rarity, atk: w.atk, stat: w.stat, statValue: w.statValue, passive: w.passive?.name ?? "", modelled: w.effectStatus === "modelled", resonator: w.resonator }));
  return (
    <div>
      <PageHead kicker="Database" title="Weapons">{rows.length} weapons. Open one to slide through Syntonization ranks and watch the passive numbers change.</PageHead>
      <WeaponBrowser rows={rows} />
    </div>
  );
}
