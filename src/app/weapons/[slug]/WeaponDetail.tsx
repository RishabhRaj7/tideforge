"use client";
import { useState } from "react";
import { CountUp } from "@/components/motion";
import { WEAPON_LEVELS } from "@/engine/constants";

type W = { name: string; atk: number; stat: string; statValue: number; passive: { name: string; template: string; params: number[][] } | null; ranks: string[]; desc: string };

export function WeaponDetail({ w }: { w: W }) {
  const [rank, setRank] = useState(1);
  const [lv, setLv] = useState(WEAPON_LEVELS.length - 1);
  const L = WEAPON_LEVELS[lv];
  const maxL = WEAPON_LEVELS[WEAPON_LEVELS.length - 1];
  // Stats in the dataset are the maximum (Lv 90) values; scale down by the level table.
  const atk = (w.atk / maxL.atk) * L.atk;
  const sec = (w.statValue / maxL.stat) * L.stat;

  const parts = w.passive
    ? w.passive.template.split(/(\{\d+\})/).map((p, i) => {
        const m = p.match(/^\{(\d+)\}$/);
        if (!m) return <span key={i}>{p}</span>;
        const v = w.passive!.params[+m[1]]?.[rank - 1];
        return <b key={`${i}-${rank}`} className="flash rounded-sm px-0.5 text-accent num">{v}</b>;
      })
    : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <div className="card h-fit p-5">
        <label htmlFor="wlv" className="label">Level</label>
        <input id="wlv" type="range" min={0} max={WEAPON_LEVELS.length - 1} value={lv} onChange={(e) => setLv(+e.target.value)} aria-valuetext={`Level ${L.label}`} />
        <div className="num mb-4 text-center text-lg text-accent">{L.label}</div>
        <dl className="grid gap-2 text-[14px]">
          <div className="flex justify-between"><dt className="text-dim">Base ATK</dt><dd><CountUp value={atk} decimals={0} /></dd></div>
          <div className="flex justify-between"><dt className="text-dim">{w.stat}</dt><dd><CountUp value={sec} decimals={1} suffix="%" /></dd></div>
        </dl>
        <p className="mt-3 text-[11.5px] text-dim">Level scaling uses a shared curve (estimated); Lv 90 values are exact.</p>
      </div>
      <div className="card p-5">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
          <div><div className="label">Passive</div><h2 className="font-display text-xl">{w.passive?.name ?? "Passive"}</h2></div>
          <div className="flex items-center gap-3">
            <label htmlFor="wrank" className="label">Syntonization</label>
            <input id="wrank" type="range" min={1} max={5} value={rank} onChange={(e) => setRank(+e.target.value)} className="!w-32" aria-valuetext={`Rank ${rank}`} />
            <span className="num w-8 text-center text-lg text-accent">R{rank}</span>
          </div>
        </div>
        {parts ? <p className="mt-3 whitespace-pre-line text-[14px] text-mute">{parts}</p> : w.ranks[rank - 1] ? <p className="mt-3 whitespace-pre-line text-[14px] text-mute">{w.ranks[rank - 1]}</p> : <p className="mt-3 text-[13px] text-bad">Passive text is not available in our data yet.</p>}
        {w.desc && <p className="mt-5 border-t border-line pt-4 text-[12.5px] italic text-dim">{w.desc}</p>}
      </div>
    </div>
  );
}
