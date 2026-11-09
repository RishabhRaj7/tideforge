import type { Metadata } from "next";
import Link from "next/link";
import { Notice, PageHead } from "@/components/ui";
import { ELEMENT_COLOR } from "@/lib/game";
import { listCharacters } from "@/server/repos";

export const metadata: Metadata = { title: "Ascension Materials", description: "Which Resonators need which ascension materials." };

type Key = "boss" | "local" | "common" | "weekly";
function group(key: Key) {
  const m = new Map<string, ReturnType<typeof listCharacters>>();
  for (const c of listCharacters()) {
    const k = c.materials[key];
    if (!k) continue;
    m.set(k, [...(m.get(k) || []), c]);
  }
  return [...m.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
}

export default function MaterialsPage() {
  const sections: [string, string, Key][] = [
    ["Boss materials", "Overworld boss drops used for ascension.", "boss"],
    ["Local specialties", "Overworld flora collected for ascension.", "local"],
    ["Common drops", "Dropped by regular enemies; upgrade tiers LF → MF → HF → FF.", "common"],
    ["Weekly boss materials", "Weekly-reset boss drops (many entries are still missing in our data).", "weekly"],
  ];
  const missing = listCharacters().filter((c) => c.issues.includes("missing-materials"));
  return (
    <div>
      <PageHead kicker="Plan" title="Ascension Materials">Which Resonators need which materials, so you can farm one target for several characters at once.</PageHead>
      <div className="mb-8"><Notice>Per-level quantities and Waveplate costs are not in the dataset yet, so this page lists <b>who needs what</b>, not totals. {missing.length} Resonators have incomplete material lists: {missing.map((c) => c.name).join(", ")}.</Notice></div>
      {sections.map(([title, sub, key]) => (
        <section key={key} className="mb-10">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mb-3 text-[13px] text-dim">{sub}</p>
          <div className="card overflow-x-auto scroll-thin">
            <table className="tbl"><tbody>
              {group(key).map(([name, chars]) => (
                <tr key={name}>
                  <td className="w-64 font-medium">{name}</td>
                  <td><div className="flex flex-wrap gap-1.5">{chars.map((c) => <Link key={c.slug} href={`/characters/${c.slug}`} className="chip no-underline hover:text-fg" style={{ borderLeft: `3px solid ${ELEMENT_COLOR[c.element]}` }}>{c.name}</Link>)}</div></td>
                </tr>
              ))}
            </tbody></table>
          </div>
        </section>
      ))}
    </div>
  );
}
