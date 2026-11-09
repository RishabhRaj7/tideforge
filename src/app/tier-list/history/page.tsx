import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/ui";
import { TIER_CHANGELOG } from "@/content/tier-list";

export const metadata: Metadata = { title: "Tier List Changelog" };

export default function TierHistory() {
  return (
    <div>
      <PageHead kicker="Meta" title="Tier List Changelog">Every change to the tier list, with the patch and the reason.</PageHead>
      <ol className="grid gap-4">
        {TIER_CHANGELOG.map((c) => (
          <li key={c.date + c.title} className="card p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold">{c.title}</h2>
              <span className="num text-[12px] text-dim">{c.date} · patch {c.patch}</span>
            </div>
            <ul className="mt-3 list-disc pl-5 text-[13.5px] text-mute">{c.changes.map((x) => <li key={x}>{x}</li>)}</ul>
          </li>
        ))}
      </ol>
      <p className="mt-6 text-[13px] text-dim"><Link href="/tier-list" className="text-accent">← Back to the tier list</Link></p>
    </div>
  );
}
