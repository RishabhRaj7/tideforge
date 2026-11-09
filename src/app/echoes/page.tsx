import type { Metadata } from "next";
import { PageHead } from "@/components/ui";
import { listEchoes } from "@/server/repos";
import { EchoBrowser } from "./EchoBrowser";

export const metadata: Metadata = { title: "Echoes", description: "Every Echo with cost, class, Sonata sets and skill by level." };

export default function EchoesPage() {
  const rows = listEchoes().map((e) => ({ slug: e.slug, name: e.name, no: e.no, cost: e.cost, class: e.class, sonatas: e.sonatas }));
  return (
    <div>
      <PageHead kicker="Database" title="Echoes">{rows.length} Echoes. Filter by cost, class or Sonata set.</PageHead>
      <EchoBrowser rows={rows} />
    </div>
  );
}
