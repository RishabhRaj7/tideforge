import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfidenceBadge, PageHead } from "@/components/ui";
import { ReportIssue } from "@/components/ReportIssue";
import { getEcho, listEchoes, listSonatas } from "@/server/repos";

export function generateStaticParams() {
  return listEchoes().map((e) => ({ slug: e.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const e = getEcho((await params).slug);
  return e ? { title: `${e.name} Echo`, description: `${e.name}: ${e.cost}-cost ${e.class} Echo, Sonata sets and skill.` } : {};
}

export default async function EchoPage({ params }: { params: Promise<{ slug: string }> }) {
  const e = getEcho((await params).slug);
  if (!e) notFound();
  const sets = listSonatas().filter((s) => e.sonatas.includes(s.name));
  return (
    <div>
      <PageHead kicker={`${e.class} Echo · ${e.cost}-cost · ${e.no}`} title={e.name}>Equip cost {e.cost}. Skill text is shown at level 1 and level 5.</PageHead>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-5"><div className="label mb-2">Echo Skill, Lv 1</div><p className="whitespace-pre-line text-[13.5px] text-mute">{e.skill}</p></div>
        <div className="card p-5"><div className="label mb-2">Echo Skill, Lv 5</div><p className="whitespace-pre-line text-[13.5px] text-mute">{e.skillMax}</p></div>
      </div>
      <div className="mt-6"><div className="label mb-2">Sonata sets</div>
        <div className="flex flex-wrap gap-2">{sets.length ? sets.map((s) => <Link key={s.slug} href={`/sonatas/${s.slug}`} className="chip">{s.name}</Link>) : <span className="text-[13px] text-dim">No Sonata set listed in our data.</span>}</div>
      </div>
      <div className="mt-6 flex items-center gap-3"><ReportIssue /><span className="text-[12px] text-dim">Source: {e.provenance.sourceRef} <ConfidenceBadge level={e.provenance.confidence} /></span></div>
    </div>
  );
}
