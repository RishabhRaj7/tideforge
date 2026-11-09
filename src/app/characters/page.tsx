import type { Metadata } from "next";
import CharacterGrid from "@/components/CharacterGrid";
import { PageHead } from "@/components/ui";
import { characters } from "@/lib/data";

export const metadata: Metadata = { title: "Characters" };

export default function CharactersPage() {
  const items = characters.map((c) => ({
    slug: c.slug,
    name: c.name,
    rarity: c.rarity,
    element: c.element,
    weapon: c.weapon,
    title: c.title,
    release: c.release,
    img: c.images.card || c.images.icon,
    roles: c.roles,
  }));
  return (
    <div>
      <PageHead kicker="Database" title="Resonators">
        Every playable Resonator, with kit, skill multipliers, Resonance Chain, ascension materials and a one-click path into the build simulator.
      </PageHead>
      <CharacterGrid items={items} />
    </div>
  );
}
