"use client";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { ELEMENTS } from "@/engine/constants";
import { ELEMENT_COLOR, ELEMENT_GLYPH } from "@/lib/game";
import { ROLES, TIERS, type Role, type Tier } from "@/content/tier-list";
import { usePrefs } from "@/store/prefs";

type Rated = { slug: string; name: string; element: string; weapon: string; rarity: number; role: Role; tier: Tier; note: string; expert?: boolean };
type Unrated = { slug: string; name: string; element: string; rarity: number };

const TIER_STYLE: Record<Tier, string> = {
  T0: "linear-gradient(135deg,#ff6b6b,#ffb86b)",
  "T0.5": "#d7b46a",
  T1: "#9ad1ff",
  "T1.5": "#8fe3c0",
  T2: "#b9c2ca",
};

export function TierBoard({ rated, unrated }: { rated: Rated[]; unrated: Unrated[] }) {
  const [role, setRole] = useState<Role | "All">("All");
  const [el, setEl] = useState<string>("All");
  const [mine, setMine] = useState(false);
  const roster = usePrefs((s) => s.roster);
  const list = useMemo(
    () => rated.filter((r) => (role === "All" || r.role === role) && (el === "All" || r.element === el) && (!mine || roster.includes(r.slug))),
    [rated, role, el, mine, roster],
  );
  return (
    <div>
      <div className="mb-6 grid gap-3">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Role filter">
          {(["All", ...ROLES] as const).map((r) => (
            <button key={r} className="chip" data-on={role === r} aria-pressed={role === r} onClick={() => setRole(r)}>{r}</button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Element filter">
          {["All", ...ELEMENTS].map((e) => (
            <button key={e} className="chip" data-on={el === e} aria-pressed={el === e} onClick={() => setEl(e)} style={e !== "All" ? { borderLeft: `3px solid ${ELEMENT_COLOR[e]}` } : undefined}>
              {e !== "All" && <span aria-hidden>{ELEMENT_GLYPH[e]}</span>}{e}
            </button>
          ))}
          <button className="chip ml-auto" data-on={mine} aria-pressed={mine} onClick={() => setMine((m) => !m)}>My roster only</button>
        </div>
      </div>

      <div className="card divide-y divide-line overflow-hidden">
        {TIERS.map((t) => {
          const row = list.filter((r) => r.tier === t);
          return (
            <div key={t} className="grid grid-cols-[64px_1fr] md:grid-cols-[88px_1fr]">
              <div className="grid place-items-center py-4 font-display text-lg font-bold text-black md:text-xl" style={{ background: TIER_STYLE[t] }}>{t}</div>
              <div className="flex min-h-[72px] flex-wrap gap-2 p-3">
                <AnimatePresence mode="popLayout">
                  {row.map((r) => (
                    <motion.div key={r.slug} layout initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} transition={{ duration: 0.2 }}>
                      <Link href={`/characters/${r.slug}`} className="card-raised group block w-[148px] p-2.5 no-underline transition-colors hover:border-accent" style={{ borderTop: `2px solid ${ELEMENT_COLOR[r.element]}` }} title={r.note}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{r.name}</span>
                          <span aria-hidden style={{ color: ELEMENT_COLOR[r.element] }}>{ELEMENT_GLYPH[r.element]}</span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-dim">
                          {r.role}
                          {r.expert && <span className="rounded-sm border border-warn/50 px-1 text-[9px] uppercase text-warn">Expert</span>}
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {row.length === 0 && <span className="self-center text-[12px] text-dim">No Resonators match these filters.</span>}
              </div>
            </div>
          );
        })}
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Unrated ({unrated.length})</h2>
        <p className="mb-3 text-[13px] text-dim">New releases and Resonators with incomplete kit data. We rate them once we can measure them.</p>
        <div className="flex flex-wrap gap-1.5">
          {unrated.map((c) => (
            <Link key={c.slug} href={`/characters/${c.slug}`} className="chip no-underline" style={{ borderLeft: `3px solid ${ELEMENT_COLOR[c.element]}` }}>{c.name}</Link>
          ))}
        </div>
      </section>
    </div>
  );
}
