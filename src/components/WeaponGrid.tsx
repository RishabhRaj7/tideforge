"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { WEAPON_TYPES } from "@/lib/data";

export type WeaponLiteList = {
  slug: string;
  name: string;
  type: string;
  rarity: number;
  atk: number;
  stat: string;
  statValue: number;
  icon: string | null;
  passive: string | null;
};

export default function WeaponGrid({ items }: { items: WeaponLiteList[] }) {
  const [q, setQ] = useState("");
  const [t, setT] = useState("");
  const [r, setR] = useState(0);
  const list = useMemo(
    () => items.filter((w) => (!q || w.name.toLowerCase().includes(q.toLowerCase())) && (!t || w.type === t) && (!r || w.rarity === r)),
    [items, q, t, r]
  );
  return (
    <div>
      <div className="card mb-6 flex flex-wrap items-center gap-x-5 gap-y-3 p-3">
        <input type="search" placeholder="Search weapons" value={q} onChange={(e) => setQ(e.target.value)} className="w-52" />
        <div className="flex flex-wrap gap-1.5">
          {WEAPON_TYPES.map((w) => (
            <button key={w} className="chip" data-on={t === w} onClick={() => setT(t === w ? "" : w)}>
              {w}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {[5, 4, 3, 2, 1].map((n) => (
            <button key={n} className="chip" data-on={r === n} onClick={() => setR(r === n ? 0 : n)}>
              {n}★
            </button>
          ))}
        </div>
        <span className="ml-auto text-[12px] text-dim">{list.length} weapons</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((w) => (
          <Link key={w.slug} href={`/weapons/${w.slug}`} className="card flex gap-3 p-3 no-underline hover:border-line2">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center bg-panel2">
              {w.icon && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={w.icon} alt={w.name} loading="lazy" className="h-14 w-14 object-contain" />
              )}
            </div>
            <div className="min-w-0">
              <div className="truncate font-medium">{w.name}</div>
              <div className="text-[12px] text-mute">
                {w.type} · <span style={{ color: w.rarity === 5 ? "#d7b46a" : w.rarity === 4 ? "#a68ad0" : "#7fa0c4" }}>{w.rarity}★</span>
              </div>
              <div className="mt-1 truncate text-[12px] text-dim">
                ATK {Math.round(w.atk * 12.5)} · {w.stat} {(w.statValue * 4.5).toFixed(1)}
                {w.stat === "ATK" || w.stat === "HP" || w.stat === "DEF" || w.stat.includes("Crit") || w.stat.includes("Energy") ? "%" : ""}
                {w.passive ? ` · ${w.passive}` : ""}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
