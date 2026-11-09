"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ELEMENTS, ELEMENT_COLOR, WEAPON_TYPES } from "@/lib/data";

export type CharLite = {
  slug: string;
  name: string;
  rarity: number;
  element: string;
  weapon: string;
  title: string;
  release: string;
  img?: string;
  roles: string[];
};

export default function CharacterGrid({ items }: { items: CharLite[] }) {
  const [q, setQ] = useState("");
  const [el, setEl] = useState<string>("");
  const [wp, setWp] = useState<string>("");
  const [rar, setRar] = useState<number>(0);
  const [sort, setSort] = useState("rarity");
  const list = useMemo(() => {
    let l = items.filter(
      (c) =>
        (!q || c.name.toLowerCase().includes(q.toLowerCase())) &&
        (!el || c.element === el) &&
        (!wp || c.weapon === wp) &&
        (!rar || c.rarity === rar)
    );
    l = [...l].sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : sort === "release"
          ? (b.release || "").localeCompare(a.release || "")
          : b.rarity - a.rarity || a.name.localeCompare(b.name)
    );
    return l;
  }, [items, q, el, wp, rar, sort]);

  return (
    <div>
      <div className="card mb-6 flex flex-wrap items-center gap-x-5 gap-y-3 p-3">
        <input type="search" placeholder="Search Resonators" value={q} onChange={(e) => setQ(e.target.value)} className="w-52" />
        <div className="flex flex-wrap gap-1.5">
          {ELEMENTS.map((e) => (
            <button key={e} className="chip" data-on={el === e} onClick={() => setEl(el === e ? "" : e)} style={el === e ? { borderColor: ELEMENT_COLOR[e] } : undefined}>
              <span style={{ width: 8, height: 8, background: ELEMENT_COLOR[e], display: "inline-block" }} />
              {e}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {WEAPON_TYPES.map((w) => (
            <button key={w} className="chip" data-on={wp === w} onClick={() => setWp(wp === w ? "" : w)}>
              {w}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {[5, 4].map((r) => (
            <button key={r} className="chip" data-on={rar === r} onClick={() => setRar(rar === r ? 0 : r)}>
              {r}★
            </button>
          ))}
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="ml-auto">
          <option value="rarity">Sort: rarity</option>
          <option value="name">Sort: name</option>
          <option value="release">Sort: newest</option>
        </select>
      </div>
      <div className="mb-3 text-[12px] text-dim">{list.length} Resonators</div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {list.map((c) => (
          <Link key={c.slug} href={`/characters/${c.slug}`} className="card group block overflow-hidden no-underline hover:border-line2">
            <div className="relative aspect-[3/4] overflow-hidden bg-panel2" style={{ borderBottom: `2px solid ${ELEMENT_COLOR[c.element] || "#444"}` }}>
              {c.img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.img} alt={c.name} loading="lazy" className="h-full w-full object-cover object-top" />
              ) : null}
              <span className="absolute left-2 top-2 bg-ink/80 px-1.5 py-0.5 text-[11px]" style={{ color: c.rarity === 5 ? "#d7b46a" : "#a68ad0" }}>
                {c.rarity}★
              </span>
            </div>
            <div className="p-2.5">
              <div className="truncate text-[14px] font-medium">{c.name}</div>
              <div className="mt-0.5 flex items-center justify-between text-[12px] text-mute">
                <span style={{ color: ELEMENT_COLOR[c.element] }}>{c.element}</span>
                <span>{c.weapon}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
