"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { GameImage } from "@/components/GameImage";
import { OwnedButton } from "@/components/OwnedButton";
import { ElementBadge, RarityStars, WeaponBadge } from "@/components/ui";
import { ELEMENTS, WEAPON_TYPES } from "@/engine/constants";
import { ELEMENT_COLOR } from "@/lib/game";
import { usePrefs } from "@/store/prefs";

type Card = { slug: string; name: string; rarity: number; element: string; weapon: string; release: string; releaseVersion: string | null; images: { card?: string; icon?: string }; title: string; limited?: boolean; baseStatsConfidence: string; hasRows: boolean; tier: string | null; role: string | null };
const TIER_ORDER = ["T0", "T0.5", "T1", "T1.5", "T2"];

export function CharacterBrowser({ cards }: { cards: Card[] }) {
  const sp = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const roster = usePrefs((s) => s.roster);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const q = sp.get("q") ?? "";
  const el = sp.get("el") ?? "";
  const wp = sp.get("wp") ?? "";
  const ra = sp.get("ra") ?? "";
  const sort = sp.get("sort") ?? "rarity";
  const owned = sp.get("owned") === "1";
  const set = (k: string, v: string) => {
    const n = new URLSearchParams(sp.toString());
    if (v) n.set(k, v); else n.delete(k);
    router.replace(`${path}${n.size ? `?${n}` : ""}`, { scroll: false });
  };

  const list = useMemo(() => {
    const f = cards.filter((c) => (!q || c.name.toLowerCase().includes(q.toLowerCase())) && (!el || c.element === el) && (!wp || c.weapon === wp) && (!ra || String(c.rarity) === ra) && (!owned || roster.includes(c.slug)));
    const by: Record<string, (a: Card, b: Card) => number> = {
      rarity: (a, b) => b.rarity - a.rarity || a.name.localeCompare(b.name),
      name: (a, b) => a.name.localeCompare(b.name),
      release: (a, b) => b.release.localeCompare(a.release),
      tier: (a, b) => (a.tier ? TIER_ORDER.indexOf(a.tier) : 99) - (b.tier ? TIER_ORDER.indexOf(b.tier) : 99) || a.name.localeCompare(b.name),
    };
    return [...f].sort(by[sort] ?? by.rarity);
  }, [cards, q, el, wp, ra, owned, roster, sort]);

  return (
    <div>
      <div className="mb-5 grid gap-3">
        <div className="flex flex-wrap gap-2">
          <input type="search" aria-label="Search Resonators" placeholder="Search by name…" defaultValue={q} onChange={(e) => set("q", e.target.value)} className="w-full sm:w-64" />
          <select aria-label="Sort" value={sort} onChange={(e) => set("sort", e.target.value === "rarity" ? "" : e.target.value)}>
            <option value="rarity">Sort: Rarity</option><option value="name">Sort: Name</option><option value="release">Sort: Newest</option><option value="tier">Sort: Tier</option>
          </select>
          <button className="chip" data-on={owned} aria-pressed={owned} onClick={() => set("owned", owned ? "" : "1")}>My roster ({mounted ? roster.length : 0})</button>
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Element">
          {ELEMENTS.map((e) => <button key={e} className="chip" data-on={el === e} aria-pressed={el === e} onClick={() => set("el", el === e ? "" : e)} style={{ borderLeft: `3px solid ${ELEMENT_COLOR[e]}` }}>{e}</button>)}
          <span className="mx-1 w-px bg-line2" aria-hidden />
          {[5, 4].map((r) => <button key={r} className="chip" data-on={ra === String(r)} aria-pressed={ra === String(r)} onClick={() => set("ra", ra === String(r) ? "" : String(r))}>{r}★</button>)}
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Weapon">
          {WEAPON_TYPES.map((w) => <button key={w} className="chip" data-on={wp === w} aria-pressed={wp === w} onClick={() => set("wp", wp === w ? "" : w)}>{w}</button>)}
        </div>
      </div>
      <p className="mb-3 text-[12.5px] text-dim" aria-live="polite">{list.length} of {cards.length} Resonators</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <AnimatePresence mode="popLayout">
          {list.map((c) => (
            <motion.div key={c.slug} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
              <Link href={`/characters/${c.slug}`} data-element={c.element} className="card-raised group relative block overflow-hidden no-underline transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:shadow-[0_8px_30px_-12px_var(--accent-glow)]">
                <GameImage src={c.images.card ?? c.images.icon} alt={c.name} element={c.element} className="aspect-[3/4] w-full transition-transform duration-300 group-hover:scale-[1.04]" rounded="0" />
                <div className="absolute left-2 top-2 flex gap-1">{c.tier && <span className="rounded-sm bg-black/70 px-1.5 text-[11px] font-semibold text-accent">{c.tier}</span>}{!c.hasRows && <span title="No calculator data" className="rounded-sm bg-black/70 px-1.5 text-[11px] text-bad">no kit data</span>}</div>
                <div className="p-3">
                  <div className="flex items-center justify-between gap-2"><span className="font-medium">{c.name}</span><RarityStars n={c.rarity} /></div>
                  <div className="mt-1 flex items-center justify-between gap-2"><ElementBadge element={c.element} /><WeaponBadge type={c.weapon} /></div>
                  <div className="mt-2 flex items-center justify-between"><span className="text-[11px] text-dim">{c.releaseVersion ? `v${c.releaseVersion}` : ""} {c.role ?? ""}</span><OwnedButton slug={c.slug} compact /></div>
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {list.length === 0 && <div className="card mt-4 p-10 text-center text-[13px] text-dim">No Resonators match. Clear a filter to see more.</div>}
    </div>
  );
}
