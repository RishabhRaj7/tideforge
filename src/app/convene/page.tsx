import type { Metadata } from "next";
import ConvenePlanner from "@/components/ConvenePlanner";
import { PageHead } from "@/components/ui";
import { banners, charByName, weaponByName } from "@/lib/data";

export const metadata: Metadata = { title: "Convene Planner & Banner History" };

export default function ConvenePage() {
  const groups = new Map<string, typeof banners>();
  for (const b of banners) {
    const k = `${b.version}|${b.start}|${b.end}`;
    groups.set(k, [...(groups.get(k) || []), b]);
  }
  return (
    <div>
      <PageHead kicker="Tool" title="Convene Planner">
        Work out your odds before you pull, then browse every featured Resonator and weapon banner.
      </PageHead>
      <ConvenePlanner />
      <h2 className="mb-4 mt-14 text-xl font-semibold">Banner history</h2>
      <div className="space-y-3">
        {[...groups.entries()].map(([k, list]) => {
          const [v, s, e] = k.split("|");
          return (
            <div key={k} className="card p-4">
              <div className="mb-3 flex flex-wrap items-baseline gap-3">
                <span className="font-mono text-accent">v{v}</span>
                <span className="text-[13px] text-mute">
                  {s} – {e}
                </span>
              </div>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {list.map((b, i) => {
                  const c = b.type.includes("Resonator") ? charByName(b.featured[0] || "") : undefined;
                  const w = b.type.includes("Weapon") ? weaponByName(b.featured[0] || "") : undefined;
                  return (
                    <div key={i} className="flex items-center gap-3 border border-line p-2">
                      <div className="h-11 w-11 shrink-0 bg-panel2">
                        {c?.images.icon && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.images.icon} alt="" className="h-full w-full object-cover" />
                        )}
                        {w?.icon && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={w.icon} alt="" className="h-full w-full object-contain" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-[13px]">{b.name}</div>
                        <div className="truncate text-[11px] text-mute">
                          {b.type.replace("Featured ", "").replace(" Convene", "") || "Convene"}
                          {b.featured[0] ? ` · ${b.featured[0]}` : ""}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
