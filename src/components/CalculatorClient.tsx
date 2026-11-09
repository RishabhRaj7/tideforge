"use client";
import { useEffect, useMemo, useState } from "react";
import calcChars from "@/data/calc-chars.json";
import weaponsJson from "@/data/weapons.json";
import echoesJson from "@/data/echoes.json";
import sonatasJson from "@/data/sonatas.json";
import {
  CHAR_LEVELS,
  ECHO_FIXED,
  ECHO_MAIN,
  FORTE_OPTIONS,
  STAT_LABEL,
  SUB_STATS,
  SUB_VALUES,
  WEAPON_LEVELS,
  collectBuffs,
  computeDamage,
  computeStats,
  fmt,
  inferType,
  rowMultiplier,
  type CalcChar,
  type CalcInput,
  type EchoSlotState,
  type Enemy,
  type Manual,
  type RotationItem,
  type SonataLite,
  type StatKey,
  type WeaponLite,
} from "@/lib/calc";
import { ELEMENT_COLOR } from "@/lib/data";

const CHARS = calcChars as unknown as CalcChar[];
type W = WeaponLite & { slug: string; icon: string | null; passive: string | null };
const WEAPONS = weaponsJson as unknown as W[];
type E = { name: string; cost: number; sonatas: string[]; icon: string | null };
const ECHOES = echoesJson as unknown as E[];
const SONATAS = sonatasJson as unknown as (SonataLite & { icon: string | null })[];

const ELEMENT_SET: Record<string, string> = {
  Glacio: "Freezing Frost",
  Fusion: "Molten Rift",
  Electro: "Void Thunder",
  Aero: "Sierra Gale",
  Spectro: "Celestial Light",
  Havoc: "Havoc Eclipse",
};
const COSTS = [4, 3, 3, 1, 1];
const TYPE_OPTIONS: (StatKey | "none")[] = ["basic", "heavy", "skill", "lib", "intro", "outro", "echoSkill", "none"];
const TYPE_LABEL: Record<string, string> = {
  basic: "Basic",
  heavy: "Heavy",
  skill: "Skill",
  lib: "Liberation",
  intro: "Intro",
  outro: "Outro",
  echoSkill: "Echo skill",
  none: "No type bonus",
};

function defaultEchoes(el: string): EchoSlotState[] {
  const set = ELEMENT_SET[el] || "Molten Rift";
  const subs = () => [
    { stat: "critRate" as StatKey, tier: 3 },
    { stat: "critDmg" as StatKey, tier: 3 },
    { stat: "atkPct" as StatKey, tier: 3 },
    { stat: "skill" as StatKey, tier: 3 },
    { stat: "atkFlat" as StatKey, tier: 2 },
  ];
  return COSTS.map((cost) => ({ echo: "", cost, sonata: set, main: 0, subs: subs() }));
}

type State = {
  charSlug: string;
  charLv: number;
  skillLv: number;
  weapon: string;
  weaponLv: number;
  rank: number;
  echoes: EchoSlotState[];
  forte: [StatKey | "none", StatKey | "none"];
  overrides: Record<string, number>;
  counts: Record<string, number>;
  types: Record<string, StatKey | "none">;
  customs: { id: string; label: string; mult: number; type: StatKey | "none"; count: number }[];
  manual: Manual;
  enemy: Enemy;
  name: string;
};

const DEFAULT_MANUAL: Manual = { atkPct: 0, atkFlat: 0, critRate: 0, critDmg: 0, dmgBonus: 0, deepen: 0, amplify: 0, er: 0 };
const DEFAULT_ENEMY: Enemy = { level: 90, res: 10, defIgnore: 0, resShred: 0 };

function bestWeapon(c: CalcChar, preferred?: string) {
  if (preferred && WEAPONS.find((w) => w.name === preferred)) return preferred;
  const list = WEAPONS.filter((w) => w.type === c.wp && w.rarity === 5);
  return (list[0] || WEAPONS.find((w) => w.type === c.wp))?.name || "";
}

function initState(slug: string, weaponSlug?: string): State {
  const c = CHARS.find((x) => x.slug === slug) || CHARS.find((x) => x.slug === "jinhsi") || CHARS[0];
  const wpn = weaponSlug ? WEAPONS.find((w) => w.slug === weaponSlug && w.type === c.wp)?.name : undefined;
  return {
    charSlug: c.slug,
    charLv: CHAR_LEVELS.length - 1,
    skillLv: 10,
    weapon: bestWeapon(c, wpn),
    weaponLv: WEAPON_LEVELS.length - 1,
    rank: 1,
    echoes: defaultEchoes(c.el),
    forte: ["ele", "atkPct"],
    overrides: {},
    counts: {},
    types: {},
    customs: [],
    manual: { ...DEFAULT_MANUAL },
    enemy: { ...DEFAULT_ENEMY },
    name: "",
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label mb-1 block">{label}</span>
      {children}
    </label>
  );
}

function Num({ value, onChange, step = 1, min, max }: { value: number; onChange: (n: number) => void; step?: number; min?: number; max?: number }) {
  return (
    <input
      type="number"
      className="w-full"
      value={Number.isFinite(value) ? value : 0}
      step={step}
      min={min}
      max={max}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
    />
  );
}

export default function CalculatorClient({ initialChar, initialWeapon, code }: { initialChar?: string; initialWeapon?: string; code?: string }) {
  const [st, setSt] = useState<State>(() => initState(initialChar || "jinhsi", initialWeapon));
  const [saveMsg, setSaveMsg] = useState("");
  const [showCompare, setShowCompare] = useState(true);

  useEffect(() => {
    if (!code) return;
    fetch(`/api/builds?code=${encodeURIComponent(code)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((b) => {
        if (b?.data) setSt({ ...initState(b.characterSlug), ...b.data });
      })
      .catch(() => {});
  }, [code]);

  const char = CHARS.find((c) => c.slug === st.charSlug) || CHARS[0];
  const weapon = WEAPONS.find((w) => w.name === st.weapon);
  const set = <K extends keyof State>(k: K, v: State[K]) => setSt((s) => ({ ...s, [k]: v }));

  const sonataCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const e of st.echoes) if (e.sonata) m[e.sonata] = (m[e.sonata] || 0) + 1;
    return m;
  }, [st.echoes]);

  const activeSets = useMemo(
    () =>
      SONATAS.filter((s) => {
        const n = sonataCounts[s.name] || 0;
        return s.pieces.some((p) => n >= p);
      }).map((s) => ({ s, n: sonataCounts[s.name] })),
    [sonataCounts]
  );

  const buffs = useMemo(() => collectBuffs(char, weapon, st.rank, sonataCounts, SONATAS), [char, weapon, st.rank, sonataCounts]);
  const buffState = useMemo(() => {
    const m: Record<string, number> = {};
    for (const b of buffs) m[b.id] = Math.min(b.stacks, st.overrides[b.id] ?? b.stacks);
    return m;
  }, [buffs, st.overrides]);

  const rotationBase = useMemo(() => {
    const out: { id: string; label: string; skillType: string; hits: [number, number][] }[] = [];
    char.sk.forEach((s, si) =>
      s.r.forEach((r, ri) => {
        if (r.k !== "dmg") return;
        out.push({ id: `${si}:${ri}`, label: `${s.n} — ${r.l}`, skillType: s.t, hits: r.h });
      })
    );
    return out;
  }, [char]);

  const rotation: RotationItem[] = useMemo(() => {
    const base = rotationBase.map((r) => ({
      id: r.id,
      label: r.label,
      skillType: r.skillType,
      count: st.counts[r.id] ?? 1,
      type: st.types[r.id] ?? inferType(r.skillType, r.label),
      mult: rowMultiplier(r.hits, st.skillLv),
    }));
    const cust = st.customs.map((c) => ({ id: c.id, label: c.label || "Custom hit", skillType: "Custom", count: c.count, type: c.type, mult: c.mult / 100 }));
    return [...base, ...cust];
  }, [rotationBase, st.counts, st.types, st.skillLv, st.customs]);

  const input: CalcInput = {
    char,
    charLv: st.charLv,
    weapon,
    weaponLv: st.weaponLv,
    rank: st.rank,
    echoes: st.echoes,
    forte: st.forte,
    buffs,
    buffState,
    manual: st.manual,
    enemy: st.enemy,
    charLevel: parseInt(CHAR_LEVELS[st.charLv].label) || 90,
    rotation,
    skillLevel: st.skillLv,
  };
  const stats = computeStats(input);
  const dmg = computeDamage(input, stats);

  const compare = useMemo(() => {
    if (!showCompare) return [];
    return WEAPONS.filter((w) => w.type === char.wp && w.rarity >= 3)
      .map((w) => {
        const bf = collectBuffs(char, w, st.rank, sonataCounts, SONATAS);
        const bs: Record<string, number> = {};
        for (const b of bf) bs[b.id] = b.stacks;
        const inp: CalcInput = { ...input, weapon: w, buffs: bf, buffState: bs };
        const s = computeStats(inp);
        return { w, total: computeDamage(inp, s).total };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 12);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCompare, char, st.rank, st.echoes, st.forte, st.manual, st.enemy, st.charLv, st.weaponLv, st.skillLv, rotation, sonataCounts]);

  function changeChar(slug: string) {
    const c = CHARS.find((x) => x.slug === slug)!;
    setSt((s) => ({
      ...s,
      charSlug: slug,
      weapon: bestWeapon(c),
      echoes: defaultEchoes(c.el),
      counts: {},
      types: {},
      overrides: {},
    }));
  }

  function setEcho(i: number, patch: Partial<EchoSlotState>) {
    setSt((s) => ({ ...s, echoes: s.echoes.map((e, j) => (j === i ? { ...e, ...patch } : e)) }));
  }
  function setSub(i: number, j: number, patch: Partial<{ stat: StatKey | ""; tier: number }>) {
    setSt((s) => ({
      ...s,
      echoes: s.echoes.map((e, k) => (k === i ? { ...e, subs: e.subs.map((x, y) => (y === j ? { ...x, ...patch } : x)) } : e)),
    }));
  }
  function fillSubs(level: "avg" | "max") {
    setSt((s) => ({
      ...s,
      echoes: s.echoes.map((e) => ({
        ...e,
        subs: e.subs.map((x) => ({ ...x, tier: level === "max" ? (SUB_VALUES[x.stat || "atkPct"]?.length || 8) - 1 : Math.floor(((SUB_VALUES[x.stat || "atkPct"]?.length || 8) - 1) / 2) })),
      })),
    }));
  }
  function setAllCounts(n: number) {
    const c: Record<string, number> = {};
    rotationBase.forEach((r) => (c[r.id] = n));
    set("counts", c);
  }

  async function save() {
    setSaveMsg("Saving…");
    try {
      const res = await fetch("/api/builds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: st.name || `${char.name} build`, characterSlug: st.charSlug, data: st }),
      });
      const j = await res.json();
      if (j.code) {
        const url = `${window.location.origin}/calculator?b=${j.code}`;
        try {
          await navigator.clipboard.writeText(url);
        } catch {}
        setSaveMsg(`Saved. Link copied: ${url}`);
      } else setSaveMsg(j.error || "Could not save.");
    } catch {
      setSaveMsg("Could not save.");
    }
  }

  const weaponList = WEAPONS.filter((w) => w.type === char.wp);
  const topWeaponTotal = compare[0]?.total || 1;
  const curTotal = dmg.total;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        {/* Character + weapon */}
        <section className="card p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {char.img && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={char.img} alt={char.name} className="h-14 w-14 border border-line object-cover" style={{ borderColor: ELEMENT_COLOR[char.el] }} />
                )}
                <div className="flex-1">
                  <Field label="Resonator">
                    <select className="w-full" value={st.charSlug} onChange={(e) => changeChar(e.target.value)}>
                      {CHARS.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.name} ({c.el} · {c.wp})
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Level">
                  <select className="w-full" value={st.charLv} onChange={(e) => set("charLv", +e.target.value)}>
                    {CHAR_LEVELS.map((l, i) => (
                      <option key={i} value={i}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Skill level (all)">
                  <select className="w-full" value={st.skillLv} onChange={(e) => set("skillLv", +e.target.value)}>
                    {Array.from({ length: 10 }, (_, i) => (
                      <option key={i} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[0, 1].map((i) => (
                  <Field key={i} label={`Forte node ${i + 1}`}>
                    <select
                      className="w-full"
                      value={st.forte[i]}
                      onChange={(e) => {
                        const f = [...st.forte] as State["forte"];
                        f[i] = e.target.value as StatKey | "none";
                        set("forte", f);
                      }}
                    >
                      {FORTE_OPTIONS.map((o) => (
                        <option key={o.stat} value={o.stat}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                ))}
              </div>
              <p className="text-[11px] text-dim">Forte stat nodes differ per Resonator and aren&apos;t listed by the wiki; set the two bonuses yours has unlocked.</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-line bg-panel2">
                  {weapon?.icon && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={weapon.icon} alt="" className="h-12 w-12 object-contain" />
                  )}
                </div>
                <div className="flex-1">
                  <Field label={`Weapon (${char.wp})`}>
                    <select className="w-full" value={st.weapon} onChange={(e) => set("weapon", e.target.value)}>
                      {weaponList.map((w) => (
                        <option key={w.name} value={w.name}>
                          {w.rarity}★ {w.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Weapon level">
                  <select className="w-full" value={st.weaponLv} onChange={(e) => set("weaponLv", +e.target.value)}>
                    {WEAPON_LEVELS.map((l, i) => (
                      <option key={i} value={i}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Rank (refinement)">
                  <select className="w-full" value={st.rank} onChange={(e) => set("rank", +e.target.value)}>
                    {[1, 2, 3, 4, 5].map((r) => (
                      <option key={r} value={r}>
                        R{r}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              {weapon && (
                <p className="text-[12px] text-mute">
                  {weapon.passive ? <span className="text-fg">{weapon.passive}. </span> : null}
                  Base ATK {fmt(weapon.atk * WEAPON_LEVELS[st.weaponLv].atk)} · {weapon.stat} {fmt(weapon.statValue * WEAPON_LEVELS[st.weaponLv].stat, 1)}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Echoes */}
        <section>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold">Echoes</h2>
              <p className="text-[12px] text-dim">4 / 3 / 3 / 1 / 1 cost layout (12 total). Level 25 values.</p>
            </div>
            <div className="flex gap-2">
              <button className="btn" onClick={() => fillSubs("avg")}>
                Average rolls
              </button>
              <button className="btn" onClick={() => fillSubs("max")}>
                Max rolls
              </button>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {st.echoes.map((e, i) => {
              const options = ECHOES.filter((x) => x.cost === e.cost);
              const picked = ECHOES.find((x) => x.name === e.echo);
              const sonOpts = picked && picked.sonatas.length ? SONATAS.filter((s) => picked.sonatas.includes(s.name)) : SONATAS;
              return (
                <div key={i} className="card p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="chip">Cost {e.cost}</span>
                    {picked?.icon && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={picked.icon} alt="" className="h-8 w-8 object-contain" />
                    )}
                    <span className="ml-auto font-mono text-[12px] text-mute">
                      +{ECHO_FIXED[e.cost].v} {STAT_LABEL[ECHO_FIXED[e.cost].stat]}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <select
                      className="w-full"
                      value={e.echo}
                      onChange={(ev) => {
                        const p = ECHOES.find((x) => x.name === ev.target.value);
                        setEcho(i, { echo: ev.target.value, sonata: p && p.sonatas.length && !p.sonatas.includes(e.sonata) ? p.sonatas[0] : e.sonata });
                      }}
                    >
                      <option value="">Echo (optional)</option>
                      {options.map((x) => (
                        <option key={x.name} value={x.name}>
                          {x.name}
                        </option>
                      ))}
                    </select>
                    <select className="w-full" value={e.sonata} onChange={(ev) => setEcho(i, { sonata: ev.target.value })}>
                      {sonOpts.map((s) => (
                        <option key={s.name} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <select className="w-full" value={e.main} onChange={(ev) => setEcho(i, { main: +ev.target.value })}>
                      {ECHO_MAIN[e.cost].map((m, mi) => (
                        <option key={mi} value={mi}>
                          Main: {STAT_LABEL[m.stat]} {m.v}%
                        </option>
                      ))}
                    </select>
                    <div className="space-y-1.5 border-t border-line pt-2">
                      {e.subs.map((s, j) => (
                        <div key={j} className="grid grid-cols-[1fr_84px] gap-1.5">
                          <select value={s.stat} onChange={(ev) => setSub(i, j, { stat: ev.target.value as StatKey | "", tier: Math.min(s.tier, (SUB_VALUES[ev.target.value]?.length || 1) - 1) })}>
                            <option value="">— none —</option>
                            {SUB_STATS.map((k) => (
                              <option key={k} value={k}>
                                {STAT_LABEL[k]}
                              </option>
                            ))}
                          </select>
                          <select value={s.tier} disabled={!s.stat} onChange={(ev) => setSub(i, j, { tier: +ev.target.value })}>
                            {(s.stat ? SUB_VALUES[s.stat] : []).map((v, vi) => (
                              <option key={vi} value={vi}>
                                {v}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-[12px]">
            {activeSets.length === 0 && <span className="text-dim">No Sonata set bonus active.</span>}
            {activeSets.map(({ s, n }) => (
              <span key={s.name} className="chip" data-on="true">
                {s.name} ×{n}
              </span>
            ))}
          </div>
        </section>

        {/* Buffs */}
        <section className="card p-4">
          <h2 className="mb-1 text-lg font-semibold">Passives &amp; set effects</h2>
          <p className="mb-3 text-[12px] text-dim">Parsed from weapon and Sonata text. Turn conditional effects on or off, or set how many stacks are up.</p>
          <div className="divide-y divide-line">
            {buffs.length === 0 && <p className="py-2 text-[13px] text-mute">No numeric effects detected for this setup.</p>}
            {buffs.map((b) => (
              <div key={b.id} className="grid grid-cols-[1fr_auto] items-start gap-3 py-2 text-[13px]">
                <div>
                  <div>
                    <span className="text-fg">{b.label}</span> <span className="text-dim">· {b.source}</span> —{" "}
                    <span className="font-mono text-accent">
                      +{fmt(b.value, 1)}% {STAT_LABEL[b.stat] || b.stat}
                    </span>
                  </div>
                  <div className="text-[12px] text-dim">{b.text}</div>
                </div>
                <select value={buffState[b.id]} onChange={(e) => set("overrides", { ...st.overrides, [b.id]: +e.target.value })}>
                  {Array.from({ length: b.stacks + 1 }, (_, i) => (
                    <option key={i} value={i}>
                      {b.stacks === 1 ? (i ? "On" : "Off") : `${i} stack${i === 1 ? "" : "s"}`}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </section>

        {/* Rotation */}
        <section className="card p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold">Rotation</h2>
              <p className="text-[12px] text-dim">Set how many times each hit lands. Damage type decides which bonus applies and can be overridden.</p>
            </div>
            <div className="flex gap-2">
              <button className="btn" onClick={() => setAllCounts(1)}>
                All ×1
              </button>
              <button className="btn" onClick={() => setAllCounts(0)}>
                Clear
              </button>
            </div>
          </div>
          <div className="scroll-thin overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Hit</th>
                  <th>Mult.</th>
                  <th>Type</th>
                  <th className="w-20">Casts</th>
                  <th className="text-right">Avg / cast</th>
                  <th className="text-right">Total</th>
                  <th className="text-right">Share</th>
                </tr>
              </thead>
              <tbody>
                {rotation.map((r) => {
                  const res = dmg.rows.find((x) => x.id === r.id)!;
                  const isCustom = r.skillType === "Custom";
                  return (
                    <tr key={r.id}>
                      <td>
                        {isCustom ? (
                          <input
                            type="text"
                            className="w-full"
                            value={st.customs.find((c) => c.id === r.id)?.label || ""}
                            placeholder="Custom hit"
                            onChange={(e) => set("customs", st.customs.map((c) => (c.id === r.id ? { ...c, label: e.target.value } : c)))}
                          />
                        ) : (
                          <span className="text-[13px]">{r.label}</span>
                        )}
                      </td>
                      <td className="font-mono text-[12px]">
                        {isCustom ? (
                          <input
                            type="number"
                            className="w-24"
                            value={st.customs.find((c) => c.id === r.id)?.mult ?? 0}
                            onChange={(e) => set("customs", st.customs.map((c) => (c.id === r.id ? { ...c, mult: parseFloat(e.target.value) || 0 } : c)))}
                          />
                        ) : (
                          `${fmt(r.mult * 100, 1)}%`
                        )}
                      </td>
                      <td>
                        <select
                          value={r.type}
                          onChange={(e) =>
                            isCustom
                              ? set("customs", st.customs.map((c) => (c.id === r.id ? { ...c, type: e.target.value as StatKey | "none" } : c)))
                              : set("types", { ...st.types, [r.id]: e.target.value as StatKey | "none" })
                          }
                        >
                          {TYPE_OPTIONS.map((t) => (
                            <option key={t} value={t}>
                              {TYPE_LABEL[t]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          className="w-16"
                          value={r.count}
                          onChange={(e) => {
                            const n = Math.max(0, parseInt(e.target.value) || 0);
                            if (isCustom) set("customs", st.customs.map((c) => (c.id === r.id ? { ...c, count: n } : c)));
                            else set("counts", { ...st.counts, [r.id]: n });
                          }}
                        />
                      </td>
                      <td className="text-right font-mono">{fmt(res.perCast)}</td>
                      <td className="text-right font-mono">{fmt(res.total)}</td>
                      <td className="text-right font-mono text-mute">{dmg.total ? fmt((res.total / dmg.total) * 100, 1) : "0"}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {rotationBase.length === 0 && <p className="mt-3 text-[13px] text-mute">No damage multipliers are published for this Resonator yet. Add custom hits below.</p>}
          <button
            className="btn mt-3"
            onClick={() => set("customs", [...st.customs, { id: `c${Date.now()}`, label: "", mult: 100, type: "skill", count: 1 }])}
          >
            + Custom hit (e.g. Echo skill, Forte attack)
          </button>
        </section>

        {/* Weapon comparison */}
        <section className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Weapon comparison</h2>
              <p className="text-[12px] text-dim">Same Resonator, echoes and rotation. Every weapon at your selected level and rank, passives fully active.</p>
            </div>
            <label className="flex items-center gap-2 text-[12px] text-mute">
              <input type="checkbox" checked={showCompare} onChange={(e) => setShowCompare(e.target.checked)} /> Show
            </label>
          </div>
          {showCompare && (
            <div className="space-y-1.5">
              {compare.map(({ w, total }) => (
                <button key={w.name} onClick={() => set("weapon", w.name)} className="grid w-full grid-cols-[180px_1fr_110px] items-center gap-3 text-left text-[13px] hover:bg-panel2">
                  <span className="truncate">
                    {w.name} <span className="text-dim">{w.rarity}★</span>
                  </span>
                  <span className="h-2 bg-panel2">
                    <span className="block h-2" style={{ width: `${(total / topWeaponTotal) * 100}%`, background: w.name === st.weapon ? "#d7b46a" : "#59626b" }} />
                  </span>
                  <span className="text-right font-mono text-[12px]">
                    {fmt(total)} <span className="text-dim">{curTotal ? `${total >= curTotal ? "+" : ""}${fmt((total / curTotal - 1) * 100, 1)}%` : ""}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Results */}
      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="card p-4" style={{ borderTop: `3px solid ${ELEMENT_COLOR[char.el]}` }}>
          <div className="label">Rotation damage (average)</div>
          <div className="mt-1 font-mono text-4xl font-semibold text-accent">{fmt(dmg.total)}</div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
            <div>
              <div className="label">No crits</div>
              <div className="font-mono">{fmt(dmg.totalNoCrit)}</div>
            </div>
            <div>
              <div className="label">All crits</div>
              <div className="font-mono">{fmt(dmg.totalCrit)}</div>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="label mb-2">Final stats</div>
          <table className="w-full text-[13px]">
            <tbody>
              {[
                ["ATK", fmt(stats.atk)],
                ["HP", fmt(stats.hp)],
                ["DEF", fmt(stats.def)],
                ["Crit. Rate", `${fmt(stats.critRate, 1)}%${stats.critRate > 100 ? " (capped 100)" : ""}`],
                ["Crit. DMG", `${fmt(stats.critDmg, 1)}%`],
                ["Energy Regen", `${fmt(stats.er, 1)}%`],
                ["Elemental DMG", `+${fmt(stats.bonus.ele, 1)}%`],
                ["Basic / Heavy", `+${fmt(stats.bonus.basic, 1)}% / +${fmt(stats.bonus.heavy, 1)}%`],
                ["Skill / Liberation", `+${fmt(stats.bonus.skill, 1)}% / +${fmt(stats.bonus.lib, 1)}%`],
                ["Healing Bonus", `+${fmt(stats.heal, 1)}%`],
                ["Avg crit multiplier", `×${fmt(dmg.critAvg, 3)}`],
                ["DEF / RES multiplier", `×${fmt(dmg.defMult, 3)} / ×${fmt(dmg.resMult, 3)}`],
              ].map(([k, v]) => (
                <tr key={k} className="border-b border-line last:border-0">
                  <td className="py-1.5 text-mute">{k}</td>
                  <td className="py-1.5 text-right font-mono">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card space-y-3 p-4">
          <div className="label">Enemy</div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Level">
              <Num value={st.enemy.level} min={1} max={150} onChange={(n) => set("enemy", { ...st.enemy, level: n })} />
            </Field>
            <Field label="Resistance %">
              <Num value={st.enemy.res} onChange={(n) => set("enemy", { ...st.enemy, res: n })} />
            </Field>
            <Field label="RES shred %">
              <Num value={st.enemy.resShred} onChange={(n) => set("enemy", { ...st.enemy, resShred: n })} />
            </Field>
            <Field label="DEF ignore %">
              <Num value={st.enemy.defIgnore} onChange={(n) => set("enemy", { ...st.enemy, defIgnore: n })} />
            </Field>
          </div>
        </div>
        <div className="card space-y-3 p-4">
          <div className="label">Team buffs (manual)</div>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                ["atkPct", "ATK %"],
                ["atkFlat", "Flat ATK"],
                ["critRate", "Crit. Rate %"],
                ["critDmg", "Crit. DMG %"],
                ["dmgBonus", "DMG Bonus %"],
                ["deepen", "DMG Deepen %"],
                ["amplify", "DMG Amplify %"],
                ["er", "Energy Regen %"],
              ] as [keyof Manual, string][]
            ).map(([k, l]) => (
              <Field key={k} label={l}>
                <Num value={st.manual[k]} onChange={(n) => set("manual", { ...st.manual, [k]: n })} />
              </Field>
            ))}
          </div>
          <p className="text-[11px] text-dim">Use these for outro skills, teammate buffs and Resonance Chain effects, which are not modelled automatically.</p>
        </div>
        <div className="card space-y-2 p-4">
          <input type="text" placeholder="Build name" value={st.name} onChange={(e) => set("name", e.target.value)} className="w-full" />
          <button className="btn btn-primary w-full justify-center" onClick={save}>
            Save &amp; copy share link
          </button>
          {saveMsg && <p className="break-all text-[12px] text-mute">{saveMsg}</p>}
        </div>
      </aside>
    </div>
  );
}
