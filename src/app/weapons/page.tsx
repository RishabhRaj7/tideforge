import type { Metadata } from "next";
import WeaponGrid from "@/components/WeaponGrid";
import { PageHead } from "@/components/ui";
import { weapons } from "@/lib/data";

export const metadata: Metadata = { title: "Weapons" };

export default function WeaponsPage() {
  const items = weapons.map((w) => ({
    slug: w.slug,
    name: w.name,
    type: w.type,
    rarity: w.rarity,
    atk: w.atk,
    stat: w.stat,
    statValue: w.statValue,
    icon: w.icon,
    passive: w.passive,
  }));
  return (
    <div>
      <PageHead kicker="Database" title="Weapons">
        All Broadblades, Swords, Pistols, Gauntlets and Rectifiers with level 90 stats and rank 1–5 passives.
      </PageHead>
      <WeaponGrid items={items} />
    </div>
  );
}
