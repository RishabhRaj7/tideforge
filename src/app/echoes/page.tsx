import type { Metadata } from "next";
import EchoGrid from "@/components/EchoGrid";
import { PageHead } from "@/components/ui";
import { echoes, sonatas } from "@/lib/data";

export const metadata: Metadata = { title: "Echoes" };

export default function EchoesPage() {
  return (
    <div>
      <PageHead kicker="Database" title="Echoes">
        All {echoes.length} Echoes, including Nightmare variants, with cost, class, possible Sonata sets and echo skill text. Cost 4 echoes are Overlords and Calamities, cost 3 are Elites, cost 1 are Common.
      </PageHead>
      <EchoGrid items={echoes} sonataNames={sonatas.map((s) => s.name)} />
    </div>
  );
}
