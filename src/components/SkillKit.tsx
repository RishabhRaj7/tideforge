"use client";
import { useState } from "react";
import { CountUp } from "@/components/motion";
import { rowMultiplier, skillCurve } from "@/engine/damage";

type Row = { label: string; kind: string; hits: [number, number][]; scalesWith: string; tag: string };
type Skill = { name: string; type: string; desc: string; rows: Row[]; info: { label: string; value: string }[] };

export function SkillKit({ skills }: { skills: Skill[] }) {
  const [lv, setLv] = useState(10);
  const [open, setOpen] = useState(0);
  return (
    <div>
      <div className="card-raised mb-4 flex flex-wrap items-center gap-4 p-3">
        <label htmlFor="skill-lv" className="label">Skill level</label>
        <input id="skill-lv" type="range" min={1} max={10} value={lv} onChange={(e) => setLv(+e.target.value)} className="max-w-xs flex-1" aria-valuetext={`Level ${lv}`} />
        <span className="num w-10 text-center text-lg text-accent">{lv}</span>
        <span className="text-[12px] text-dim">Multipliers use one shared level curve (estimated). Hit values at level 1 are exact wiki numbers.</span>
      </div>
      <div className="grid gap-3">
        {skills.map((s, i) => (
          <section key={s.type + s.name} className="card">
            <button className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}>
              <span>
                <span className="label block">{s.type}</span>
                <span className="font-display text-[16px]">{s.name || s.type}</span>
              </span>
              <span aria-hidden className="text-dim">{open === i ? "−" : "+"}</span>
            </button>
            {open === i && (
              <div className="border-t border-line px-4 pb-4 pt-3">
                {s.desc && <p className="whitespace-pre-line text-[13.5px] text-mute">{s.desc}</p>}
                {s.rows.length > 0 && (
                  <div className="mt-4 overflow-x-auto scroll-thin">
                    <table className="tbl">
                      <thead><tr><th>Hit</th><th>Breakdown (Lv {lv})</th><th className="text-right">Total</th><th>Scales</th></tr></thead>
                      <tbody>
                        {s.rows.map((r) => (
                          <tr key={r.label}>
                            <td>{r.label}{r.kind === "heal" && <span className="ml-1 text-ok">heal</span>}</td>
                            <td className="num text-dim">{r.hits.map(([v, n]) => `${(v * skillCurve(lv)).toFixed(2)}%${n > 1 ? `×${n}` : ""}`).join(" + ")}</td>
                            <td className="text-right"><CountUp value={rowMultiplier(r.hits, lv) * 100} decimals={2} suffix="%" className="text-fg" /></td>
                            <td className="text-dim uppercase">{r.scalesWith}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {s.info.length > 0 && (
                  <dl className="mt-3 grid gap-x-6 gap-y-1 text-[12.5px] sm:grid-cols-2">
                    {s.info.map((x) => (<div key={x.label} className="flex justify-between gap-3 border-b border-line py-1"><dt className="text-dim">{x.label}</dt><dd className="num">{x.value}</dd></div>))}
                  </dl>
                )}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
