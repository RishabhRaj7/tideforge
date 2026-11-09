"use client";
import { useMemo, useState } from "react";

export type EchoLite = {
  name: string;
  no: string;
  cost: number;
  class: string;
  sonatas: string[];
  skill: string;
  skillMax: string;
  icon: string | null;
};

export default function EchoGrid({ items, sonataNames }: { items: EchoLite[]; sonataNames: string[] }) {
  const [q, setQ] = useState("");
  const [cost, setCost] = useState(0);
  const [cls, setCls] = useState("");
  const [son, setSon] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const list = useMemo(
    () =>
      items.filter(
        (e) =>
          (!q || e.name.toLowerCase().includes(q.toLowerCase())) &&
          (!cost || e.cost === cost) &&
          (!cls || e.class === cls) &&
          (!son || e.sonatas.includes(son))
      ),
    [items, q, cost, cls, son]
  );
  return (
    <div>
      <div className="card mb-6 flex flex-wrap items-center gap-x-5 gap-y-3 p-3">
        <input type="search" placeholder="Search echoes" value={q} onChange={(e) => setQ(e.target.value)} className="w-52" />
        <div className="flex gap-1.5">
          {[1, 3, 4].map((c) => (
            <button key={c} className="chip" data-on={cost === c} onClick={() => setCost(cost === c ? 0 : c)}>
              Cost {c}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["Common", "Elite", "Overlord", "Calamity"].map((c) => (
            <button key={c} className="chip" data-on={cls === c} onClick={() => setCls(cls === c ? "" : c)}>
              {c}
            </button>
          ))}
        </div>
        <select value={son} onChange={(e) => setSon(e.target.value)}>
          <option value="">All Sonata sets</option>
          {sonataNames.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <span className="ml-auto text-[12px] text-dim">{list.length} echoes</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {list.map((e, i) => {
          const id = `${e.name}-${i}`;
          return (
            <div key={id} className="card p-3">
              <button className="flex w-full items-center gap-3 text-left" onClick={() => setOpen(open === id ? null : id)}>
                <div className="flex h-14 w-14 shrink-0 items-center justify-center bg-panel2">
                  {e.icon && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.icon} alt={e.name} loading="lazy" className="h-12 w-12 object-contain" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{e.name}</div>
                  <div className="text-[12px] text-mute">
                    Cost {e.cost} · {e.class} · {e.no}
                  </div>
                  <div className="mt-0.5 truncate text-[12px] text-dim">{e.sonatas.join(" · ") || "—"}</div>
                </div>
                <span className="text-dim">{open === id ? "−" : "+"}</span>
              </button>
              {open === id && (
                <div className="mt-3 space-y-2 border-t border-line pt-3 text-[13px]">
                  {e.skill ? (
                    <>
                      <div>
                        <div className="label">Echo skill (Lv 1)</div>
                        <p className="whitespace-pre-line text-[#c3c8cc]">{e.skill}</p>
                      </div>
                      {e.skillMax !== e.skill && (
                        <div>
                          <div className="label">Echo skill (Lv 5)</div>
                          <p className="whitespace-pre-line text-[#c3c8cc]">{e.skillMax}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-mute">Skill text unavailable.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
