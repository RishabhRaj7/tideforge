import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/ui";
import { formatDate } from "@/lib/game";
import { listBanners, listCharacterCards, listEvents, versions } from "@/server/repos";

export const metadata: Metadata = { title: "Patches", description: "Version-by-version overview: new Resonators, banners and events." };

export default function PatchesPage() {
  const cards = listCharacterCards();
  const vs = versions();
  return (
    <div>
      <PageHead kicker="Meta" title="Patches">What shipped in each version, derived from our banner, event and Resonator data. Automatic before/after diffs of kit numbers need versioned snapshots (on the roadmap).</PageHead>
      <div className="grid gap-4">
        {vs.map((v) => {
          const newChars = cards.filter((c) => c.releaseVersion === v.version);
          const bn = listBanners().filter((b) => b.version === v.version);
          const ev = listEvents().filter((e) => e.version === v.version);
          return (
            <article key={v.version} className="card p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-xl font-semibold">Version {v.version}</h2>
                <span className="text-[12px] text-dim">{formatDate(v.start)} → {formatDate(v.end)}</span>
              </div>
              <div className="mt-3 grid gap-4 text-[13.5px] md:grid-cols-3">
                <div><div className="label mb-1">New Resonators</div>{newChars.length ? <div className="flex flex-wrap gap-1.5">{newChars.map((c) => <Link key={c.slug} className="chip" href={`/characters/${c.slug}`}>{c.name}</Link>)}</div> : <span className="text-dim">None in our data</span>}</div>
                <div><div className="label mb-1">Banners</div><span className="text-mute">{bn.length} Convenes: {[...new Set(bn.flatMap((b) => b.featured.map((f) => f.name)))].slice(0, 6).join(", ")}</span></div>
                <div><div className="label mb-1">Events</div><span className="text-mute">{ev.length} events</span></div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
