import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/ui";
import { characters, ELEMENT_COLOR } from "@/lib/data";

export const metadata: Metadata = { title: "Ascension Materials" };

function group(key: "boss" | "local" | "common") {
  const m = new Map<string, typeof characters>();
  for (const c of characters) {
    const k = c.materials[key];
    if (!k) continue;
    m.set(k, [...(m.get(k) || []), c]);
  }
  return [...m.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
}

export default function MaterialsPage() {
  const sections: [string, string, ReturnType<typeof group>][] = [
    ["Boss materials", "Weekly-reset and overworld boss drops used for ascension.", group("boss")],
    ["Local specialties", "Overworld flora collected for ascension.", group("local")],
    ["Common drops", "Dropped by regular enemies; upgrade tiers LF → MF → HF → FF.", group("common")],
  ];
  return (
    <div>
      <PageHead kicker="Planner" title="Ascension Materials">
        Which Resonators need which materials, so you can farm one target for several characters at once.
      </PageHead>
      {sections.map(([title, sub, list]) => (
        <section key={title} className="mb-10">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mb-3 text-[13px] text-mute">{sub}</p>
          <div className="card">
            <table className="tbl">
              <tbody>
                {list.map(([name, chars]) => (
                  <tr key={name}>
                    <td className="w-64 font-medium">{name}</td>
                    <td>
                      <div className="flex flex-wrap gap-1.5">
                        {chars.map((c) => (
                          <Link key={c.slug} href={`/characters/${c.slug}`} className="chip no-underline hover:text-fg" style={{ borderLeft: `3px solid ${ELEMENT_COLOR[c.element]}` }}>
                            {c.name}
                          </Link>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
