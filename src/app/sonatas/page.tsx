import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/ui";
import { listSonatas } from "@/server/repos";

export const metadata: Metadata = { title: "Sonata Sets", description: "All Echo Sonata set bonuses." };

export default function SonatasPage() {
  const sets = listSonatas();
  return (
    <div>
      <PageHead kicker="Database" title="Sonata Sets">{sets.length} sets. The calculator applies bonuses marked as modelled.</PageHead>
      <div className="grid gap-3 md:grid-cols-2">
        {sets.map((s) => (
          <Link key={s.slug} href={`/sonatas/${s.slug}`} className="card-raised block p-4 no-underline transition-colors hover:border-accent">
            <div className="flex items-center justify-between"><span className="font-display text-[15px]">{s.name}</span><span className="chip">{s.pieces.join(" / ")}pc</span></div>
            <ul className="mt-2 grid gap-1 text-[12.5px] text-dim">{s.effects.slice(0, 2).map((x, i) => <li key={i} className="line-clamp-2">{x}</li>)}</ul>
            {s.effectStatus === "unmodelled" && <div className="mt-2 text-[11px] text-warn">Not modelled in calculator</div>}
          </Link>
        ))}
      </div>
    </div>
  );
}
