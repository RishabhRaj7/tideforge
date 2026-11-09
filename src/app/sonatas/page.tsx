import type { Metadata } from "next";
import { PageHead } from "@/components/ui";
import { echoes, sonatas } from "@/lib/data";

export const metadata: Metadata = { title: "Sonata Sets" };

export default function SonatasPage() {
  const groups = [
    ["2 / 5-piece sets", sonatas.filter((s) => s.pieces.includes(5))],
    ["3-piece sets", sonatas.filter((s) => s.pieces.length === 1 && s.pieces[0] === 3)],
    ["1-piece sets", sonatas.filter((s) => s.pieces.length === 1 && s.pieces[0] === 1)],
  ] as const;
  return (
    <div>
      <PageHead kicker="Database" title="Sonata Sets">
        Echoes carry one Sonata. Equip two or five of the same set for most sets (three or one for the special sets) to unlock the bonuses.
      </PageHead>
      {groups.map(([title, list]) => (
        <section key={title} className="mb-10">
          <h2 className="mb-3 text-lg font-semibold">
            {title} <span className="text-[13px] font-normal text-dim">{list.length}</span>
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {list.map((s) => {
              const members = echoes.filter((e) => e.sonatas.includes(s.name) && e.cost > 1);
              return (
                <div key={s.name} className="card p-4">
                  <div className="flex items-center gap-3">
                    {s.icon && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.icon} alt="" className="h-10 w-10 object-contain" />
                    )}
                    <h3 className="font-semibold">{s.name}</h3>
                  </div>
                  <div className="mt-3 space-y-2 text-[13px]">
                    {s.pieces.map((p, i) => (
                      <div key={p} className="grid grid-cols-[44px_1fr] gap-2">
                        <span className="font-mono text-accent">{p}pc</span>
                        <span className="text-[#c3c8cc]">{s.effects[i]}</span>
                      </div>
                    ))}
                  </div>
                  {members.length > 0 && (
                    <div className="mt-3 border-t border-line pt-2 text-[12px] text-dim">
                      Echoes: {members.slice(0, 14).map((m) => m.name).join(", ")}
                      {members.length > 14 ? ` +${members.length - 14} more` : ""}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
