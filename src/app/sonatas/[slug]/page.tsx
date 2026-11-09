import type { Metadata } from "next";
import Link from "next/link";
import { GameImage } from "@/components/GameImage";
import { notFound } from "next/navigation";
import { ConfidenceBadge, Notice, PageHead } from "@/components/ui";
import { getSonata, listEchoes, listSonatas } from "@/server/repos";

export function generateStaticParams() {
  return listSonatas().map((s) => ({ slug: s.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const s = getSonata((await params).slug);
  return s ? { title: `${s.name} Sonata set`, description: s.effects.join(" ") } : {};
}

export default async function SonataPage({ params }: { params: Promise<{ slug: string }> }) {
  const s = getSonata((await params).slug);
  if (!s) notFound();
  const echoes = listEchoes().filter((e) => e.sonatas.includes(s.name));
  return (
    <div>
      <GameImage variant="icon" src={`/img/sonatas/${s.slug}.webp`} alt={`${s.name} icon`} className="mb-4 h-20 w-20 border border-line" rounded="12px" />
      <PageHead kicker={`Sonata set · ${s.pieces.join(" / ")} pieces`} title={s.name}>Set bonuses and the Echoes that belong to this set.</PageHead>
      {s.effectStatus === "unmodelled" && <div className="mb-4"><Notice>This set&apos;s bonus is not machine-readable yet, so the calculator ignores it.</Notice></div>}
      <div className="grid gap-3">
        {s.effects.map((x, i) => (
          <div key={i} className="card flex gap-4 p-4"><span className="chip num h-fit">{s.pieces[i] ?? s.pieces[s.pieces.length - 1]}pc</span><p className="text-[14px] text-mute">{x}</p></div>
        ))}
      </div>
      <div className="mt-8"><div className="label mb-2">Echoes in this set ({echoes.length})</div>
        <div className="flex flex-wrap gap-1.5">{echoes.map((e) => <Link key={e.slug} href={`/echoes/${e.slug}`} className="chip">{e.name} · {e.cost}</Link>)}</div>
      </div>
      <p className="mt-6 text-[12px] text-dim">Source: {s.provenance.sourceRef} <ConfidenceBadge level={s.provenance.confidence} /></p>
    </div>
  );
}
