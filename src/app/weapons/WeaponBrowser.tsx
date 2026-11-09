"use client";
import Link from "next/link";
import { GameImage } from "@/components/GameImage";
import { useMemo, useState } from "react";
import { RarityStars } from "@/components/ui";
import { WEAPON_TYPES } from "@/engine/constants";

type Row = { slug: string; name: string; type: string; rarity: number; atk: number; stat: string; statValue: number; passive: string; modelled: boolean; resonator: string };

export function WeaponBrowser({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [rar, setRar] = useState(0);
  const list = useMemo(() => rows.filter((r) => (!q || r.name.toLowerCase().includes(q.toLowerCase()) || r.passive.toLowerCase().includes(q.toLowerCase())) && (!type || r.type === type) && (!rar || r.rarity === rar)).sort((a, b) => b.rarity - a.rarity || b.atk - a.atk), [rows, q, type, rar]);
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <input type="search" aria-label="Search weapons" placeholder="Search name or passive…" value={q} onChange={(e) => setQ(e.target.value)} className="w-full sm:w-64" />
        {WEAPON_TYPES.map((t) => <button key={t} className="chip" data-on={type === t} aria-pressed={type === t} onClick={() => setType(type === t ? "" : t)}>{t}</button>)}
        <span className="mx-1 w-px self-stretch bg-line2" aria-hidden />
        {[5, 4, 3].map((r) => <button key={r} className="chip" data-on={rar === r} aria-pressed={rar === r} onClick={() => setRar(rar === r ? 0 : r)}>{r}★</button>)}
      </div>
      <p className="mb-3 text-[12.5px] text-dim" aria-live="polite">{list.length} weapons</p>
      <div className="card overflow-x-auto scroll-thin">
        <table className="tbl">
          <thead><tr><th>Weapon</th><th>Type</th><th>★</th><th className="text-right">Base ATK (max)</th><th>2nd stat</th><th>Passive</th></tr></thead>
          <tbody>
            {list.map((w) => (
              <tr key={w.slug}>
                <td><div className="flex items-center gap-3"><GameImage variant="icon" src={`/img/weapons/${w.slug}.webp`} alt="" className="h-10 w-10 shrink-0" /><div><Link href={`/weapons/${w.slug}`} className="font-medium no-underline hover:text-accent">{w.name}</Link>{w.resonator && <span className="ml-2 text-[11px] text-dim">{w.resonator}</span>}</div></div></td>
                <td className="text-dim">{w.type}</td><td><RarityStars n={w.rarity} /></td>
                <td className="num text-right">{w.atk}</td><td className="text-dim">{w.stat} <span className="num">{w.statValue}%</span></td>
                <td className="text-dim">{w.passive}{!w.modelled && <span className="ml-1 text-[10px] text-warn" title="Not modelled in the calculator">○</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11.5px] text-dim">○ passive effect is not yet modelled in the calculator.</p>
    </div>
  );
}
