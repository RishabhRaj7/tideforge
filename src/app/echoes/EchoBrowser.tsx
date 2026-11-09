"use client";
import Link from "next/link";
import { GameImage } from "@/components/GameImage";
import { useMemo, useState } from "react";

type Row = { slug: string; name: string; no: string; cost: number; class: string; sonatas: string[] };

export function EchoBrowser({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState("");
  const [cost, setCost] = useState(0);
  const [cls, setCls] = useState("");
  const [son, setSon] = useState("");
  const classes = [...new Set(rows.map((r) => r.class))];
  const sonatas = [...new Set(rows.flatMap((r) => r.sonatas))].sort();
  const list = useMemo(() => rows.filter((r) => (!q || r.name.toLowerCase().includes(q.toLowerCase())) && (!cost || r.cost === cost) && (!cls || r.class === cls) && (!son || r.sonatas.includes(son))), [rows, q, cost, cls, son]);
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <input type="search" aria-label="Search Echoes" placeholder="Search Echoes…" value={q} onChange={(e) => setQ(e.target.value)} className="w-full sm:w-60" />
        {[4, 3, 1].map((c) => <button key={c} className="chip" data-on={cost === c} aria-pressed={cost === c} onClick={() => setCost(cost === c ? 0 : c)}>{c}-cost</button>)}
        {classes.map((c) => <button key={c} className="chip" data-on={cls === c} aria-pressed={cls === c} onClick={() => setCls(cls === c ? "" : c)}>{c}</button>)}
        <select aria-label="Sonata set" value={son} onChange={(e) => setSon(e.target.value)}><option value="">Any Sonata set</option>{sonatas.map((s) => <option key={s}>{s}</option>)}</select>
      </div>
      <p className="mb-3 text-[12.5px] text-dim" aria-live="polite">{list.length} Echoes</p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((e) => (
          <Link key={e.slug} href={`/echoes/${e.slug}`} className="card-raised flex items-center justify-between gap-3 p-3 no-underline transition-colors hover:border-accent">
            <span className="flex min-w-0 items-center gap-3"><GameImage variant="icon" src={`/img/echoes/${e.slug}.webp`} alt="" className="h-12 w-12 shrink-0" /><span className="min-w-0"><span className="block truncate text-[14px]">{e.name}</span><span className="block truncate text-[11.5px] text-dim">{e.class} · {e.sonatas.length ? e.sonatas.join(", ") : "no set listed"}</span></span></span>
            <span className="chip num shrink-0">{e.cost}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
