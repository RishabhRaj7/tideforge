"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CountUp, GrowBar } from "@/components/motion";
import { ConfidenceBadge, Notice } from "@/components/ui";
import { ReportIssue } from "@/components/ReportIssue";
import {
  calculate, CHAR_LEVELS, collectEffects, ECHO_MAIN, EMPTY_MANUAL, ENEMY_PRESETS, FORTE_OPTIONS, STAT_LABEL, statWeights, SUB_STATS, SUB_VALUES, WEAPON_LEVELS,
  type CalcInput, type EchoSlot, type EngineChar, type EngineSonata, type EngineWeapon, type Manual, type RotationItem, type Scaling, type StatKey,
} from "@/engine";
import { ELEMENT_COLOR, fmt } from "@/lib/game";

type CharLite = { slug: string; name: string; element: string; weapon: string; rarity: number; unusable: boolean; placeholder: boolean };
type CharData = { char: EngineChar; chain: { level: number; name: string; desc: string }[]; issues: string[] };
type Gear = { weapons: EngineWeapon[]; sonatas: EngineSonata[] };

const emptyEcho = (cost: number): EchoSlot => ({ cost, sonata: "", main: 0, subs: Array.from({ length: 5 }, () => ({ stat: "" as StatKey | "", tier: 4 })) });
const DEFAULT_COSTS = [4, 3, 3, 1, 1];
const typicalEcho = (cost: number): EchoSlot => ({
  ...emptyEcho(cost),
  subs: [{ stat: "critRate", tier: 4 }, { stat: "critDmg", tier: 4 }, { stat: "atkPct", tier: 4 }, { stat: "skill", tier: 4 }, { stat: "", tier: 4 }],
});
const rowKey = (type: string, label: string) => `${type}|${label}`;

type Snapshot = {
  charSlug: string; charLv: number; skillLevel: number; weaponSlug: string; weaponLv: number; rank: number; echoes: EchoSlot[];
  forte: [StatKey | "none", StatKey | "none"]; stacks: Record<string, number>; manual: Manual; enemyPreset: string; enemy: { level: number; res: number; resShred: number };
  counts: Record<string, number>; scaleOv: Record<string, Scaling>;
};

function Panel({ title, children, defaultOpen = true, badge }: { title: string; children: React.ReactNode; defaultOpen?: boolean; badge?: React.ReactNode }) {
  return (
    <details open={defaultOpen} className="card group">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3">
        <span className="font-display text-[15px]">{title}</span>
        <span className="flex items-center gap-2">{badge}<span aria-hidden className="text-dim transition-transform group-open:rotate-180">▾</span></span>
      </summary>
      <div className="border-t border-line p-4">{children}</div>
    </details>
  );
}
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (<label className="grid gap-1"><span className="label">{label}</span>{children}</label>);
const NumInput = ({ value, onChange, step = 1, min, max }: { value: number; onChange: (n: number) => void; step?: number; min?: number; max?: number }) => (
  <input type="number" value={Number.isFinite(value) ? value : 0} step={step} min={min} max={max} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} className="w-full" />
);

export function CalculatorClient({ chars, initial }: { chars: CharLite[]; initial: { char?: string; weapon?: string; build?: string } }) {
  const [gear, setGear] = useState<Gear | null>(null);
  const [data, setData] = useState<CharData | null>(null);
  const [loadErr, setLoadErr] = useState("");
  const [charSlug, setCharSlug] = useState(chars.find((c) => c.slug === initial.char)?.slug ?? (chars.find((c) => c.slug === "jinhsi") ?? chars.find((c) => !c.unusable && !c.placeholder)!).slug);
  const [charLv, setCharLv] = useState(CHAR_LEVELS.length - 1);
  const [skillLevel, setSkillLevel] = useState(10);
  const [weaponSlug, setWeaponSlug] = useState(initial.weapon ?? "");
  const [weaponLv, setWeaponLv] = useState(WEAPON_LEVELS.length - 1);
  const [rank, setRank] = useState(1);
  const [echoes, setEchoes] = useState<EchoSlot[]>(() => DEFAULT_COSTS.map(typicalEcho));
  const [forte, setForte] = useState<[StatKey | "none", StatKey | "none"]>(["ele", "atkPct"]);
  const [stacks, setStacks] = useState<Record<string, number>>({});
  const [manual, setManual] = useState<Manual>(EMPTY_MANUAL);
  const [enemyPreset, setEnemyPreset] = useState("l100");
  const [enemy, setEnemy] = useState({ level: 100, res: 10, resShred: 0 });
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [scaleOv, setScaleOv] = useState<Record<string, Scaling>>({});
  const [compareSlug, setCompareSlug] = useState("");
  const [share, setShare] = useState<{ state: "idle" | "saving" | "done" | "error"; url?: string; msg?: string }>({ state: "idle" });
  const pendingSnap = useRef<Snapshot | null>(null);

  // gear (weapons + sonatas) once
  useEffect(() => {
    fetch("/api/v1/engine-data").then((r) => r.json()).then(setGear).catch(() => setLoadErr("Could not load weapon data."));
  }, []);

  // restore a shared build
  useEffect(() => {
    if (!initial.build) return;
    fetch(`/api/v1/builds/${encodeURIComponent(initial.build)}`).then((r) => (r.ok ? r.json() : Promise.reject())).then((b: { data: Snapshot }) => {
      pendingSnap.current = b.data;
      setCharSlug(b.data.charSlug);
    }).catch(() => setLoadErr("That share code was not found."));
  }, [initial.build]);

  const defaultCounts = useCallback((c: EngineChar) => {
    const out: Record<string, number> = {};
    const seen: Record<string, number> = {};
    for (const s of c.skills) for (const r of s.rows) {
      const n = (seen[s.type] = (seen[s.type] ?? 0) + 1);
      const take = s.type === "Basic Attack" ? n <= 3 : ["Resonance Skill", "Resonance Liberation", "Intro Skill"].includes(s.type) ? n === 1 : s.type === "Forte Circuit" ? n === 1 : false;
      out[rowKey(s.type, r.label)] = take ? 1 : 0;
    }
    return out;
  }, []);

  // load Resonator data
  useEffect(() => {
    let alive = true;
    setData(null);
    fetch(`/api/v1/engine-data/${charSlug}`).then((r) => r.json()).then((d: CharData) => {
      if (!alive) return;
      setData(d);
      const snap = pendingSnap.current;
      if (snap && snap.charSlug === charSlug) {
        pendingSnap.current = null;
        setCharLv(snap.charLv); setSkillLevel(snap.skillLevel); setWeaponSlug(snap.weaponSlug); setWeaponLv(snap.weaponLv); setRank(snap.rank);
        setEchoes(snap.echoes); setForte(snap.forte); setStacks(snap.stacks); setManual(snap.manual); setEnemyPreset(snap.enemyPreset); setEnemy(snap.enemy);
        setCounts(snap.counts); setScaleOv(snap.scaleOv);
      } else {
        setCounts(defaultCounts(d.char));
        setScaleOv({});
      }
    }).catch(() => alive && setLoadErr("Could not load Resonator data."));
    return () => { alive = false; };
  }, [charSlug, defaultCounts]);

  const weapon = gear?.weapons.find((w) => w.slug === weaponSlug);
  const compare = gear?.weapons.find((w) => w.slug === compareSlug);
  const char = data?.char;
  const weaponChoices = useMemo(() => (gear && char ? gear.weapons.filter((w) => w.type === char.weapon).sort((a, b) => b.rarity - a.rarity || b.atk - a.atk) : []), [gear, char]);

  // default weapon once per Resonator (keeps a valid weapon from the URL / a shared build)
  const weaponInit = useRef("");
  useEffect(() => {
    if (!char || !gear || weaponInit.current === char.slug) return;
    weaponInit.current = char.slug;
    if (!weaponChoices.some((w) => w.slug === weaponSlug)) setWeaponSlug(weaponChoices[0]?.slug ?? "");
  }, [char, gear, weaponChoices, weaponSlug]);

  const sonataCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const e of echoes) if (e.cost && e.sonata) m[e.sonata] = (m[e.sonata] ?? 0) + 1;
    return m;
  }, [echoes]);

  const effects = useMemo(() => (char && gear ? collectEffects(char, weapon, rank, sonataCounts, gear.sonatas) : []), [char, gear, weapon, rank, sonataCounts]);

  const rotation: RotationItem[] = useMemo(() => {
    if (!char) return [];
    const out: RotationItem[] = [];
    for (const s of char.skills) for (const r of s.rows) {
      const k = rowKey(s.type, r.label);
      const c = counts[k] ?? 0;
      if (c <= 0) continue;
      out.push({ id: k, label: `${r.label} (${s.type})`, tag: r.tag, scalesWith: scaleOv[k] ?? r.scalesWith, basePct: r.hits.reduce((a, [v, n]) => a + v * n, 0), count: c });
    }
    return out;
  }, [char, counts, scaleOv]);

  const input: CalcInput | null = char ? { char, charLv, weapon, weaponLv, echoes, forte, effects, effectStacks: stacks, manual, enemy, skillLevel, rotation } : null;
  const result = useMemo(() => (input ? calculate(input) : null), [input]); // eslint-disable-line react-hooks/exhaustive-deps
  const weights = useMemo(() => (input && result && result.total > 0 ? statWeights(input) : []), [input, result]); // eslint-disable-line react-hooks/exhaustive-deps
  const compareResult = useMemo(() => {
    if (!input || !compare || !gear) return null;
    const effB = collectEffects(input.char, compare, rank, sonataCounts, gear.sonatas);
    const stacksB = { ...stacks };
    effects.filter((e) => e.source.kind === "weapon").forEach((e) => {
      const i = e.id.split(":").pop();
      if (!e.always) stacksB[`weapon:${compare.name}:${i}`] = stacks[e.id] ?? 0;
    });
    return calculate({ ...input, weapon: compare, effects: effB, effectStacks: stacksB });
  }, [input, compare, gear, rank, sonataCounts, stacks, effects]);

  const costTotal = echoes.reduce((a, e) => a + e.cost, 0);
  const setEcho = (i: number, patch: Partial<EchoSlot>) => setEchoes((es) => es.map((e, j) => (j === i ? { ...e, ...patch } : e)));

  async function doShare() {
    if (!char) return;
    setShare({ state: "saving" });
    const data: Snapshot = { charSlug, charLv, skillLevel, weaponSlug, weaponLv, rank, echoes, forte, stacks, manual, enemyPreset, enemy, counts, scaleOv };
    try {
      const r = await fetch("/api/v1/builds", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: `${char.name} build`, characterSlug: charSlug, data }) });
      const j = await r.json();
      if (!r.ok) return setShare({ state: "error", msg: j?.error?.message ?? "Could not save." });
      const url = `${location.origin}/calculator?build=${j.code}`;
      setShare({ state: "done", url });
      navigator.clipboard?.writeText(url).catch(() => {});
    } catch {
      setShare({ state: "error", msg: "Network error." });
    }
  }

  const meta = chars.find((c) => c.slug === charSlug);
  const topRow = result ? [...result.rows].sort((a, b) => b.average - a.average)[0] : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]" data-element={meta?.element}>
      <div className="grid content-start gap-4">
        {loadErr && <Notice tone="bad">{loadErr}</Notice>}
        <Panel title="Resonator" badge={char && <ConfidenceBadge level={char.baseConfidence} />}>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Resonator">
              <select value={charSlug} onChange={(e) => setCharSlug(e.target.value)}>
                {chars.map((c) => <option key={c.slug} value={c.slug}>{c.name}{c.unusable ? " (no kit data)" : c.placeholder ? " (placeholder stats)" : ""}</option>)}
              </select>
            </Field>
            <Field label="Level"><select value={charLv} onChange={(e) => setCharLv(+e.target.value)}>{CHAR_LEVELS.map((l, i) => <option key={l.label} value={i}>{l.label}</option>)}</select></Field>
            <Field label="Skill level"><select value={skillLevel} onChange={(e) => setSkillLevel(+e.target.value)}>{Array.from({ length: 10 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select></Field>
          </div>
          {meta?.unusable && <div className="mt-3"><Notice tone="bad">{meta.name} has no damage rows in our data, so nothing can be calculated yet.</Notice></div>}
          {meta?.placeholder && <div className="mt-3"><Notice tone="bad"><b>Placeholder base stats.</b> HP/ATK/DEF for {meta.name} are not real game values. Results are not meaningful.</Notice></div>}
          <p className="mt-3 text-[12px] text-dim">Level multipliers and the shared skill-level curve are community-derived (<ConfidenceBadge level="estimated" /> at Lv 20 and Lv 90).</p>
        </Panel>

        <Panel title="Weapon" badge={weapon && <span className="chip">{weapon.rarity}★</span>}>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Weapon"><select value={weaponSlug} onChange={(e) => setWeaponSlug(e.target.value)}><option value="">None</option>{weaponChoices.map((w) => <option key={w.name} value={w.slug}>{w.name} ({w.rarity}★)</option>)}</select></Field>
            <Field label="Level"><select value={weaponLv} onChange={(e) => setWeaponLv(+e.target.value)}>{WEAPON_LEVELS.map((l, i) => <option key={l.label} value={i}>{l.label}</option>)}</select></Field>
            <Field label="Syntonization"><select value={rank} onChange={(e) => setRank(+e.target.value)}>{[1, 2, 3, 4, 5].map((r) => <option key={r} value={r}>Rank {r}</option>)}</select></Field>
          </div>
          {weapon && weapon.effects.length === 0 && <div className="mt-3"><Notice>This weapon&apos;s passive is not modelled, so only its base ATK and secondary stat count. Add its bonus under Manual adjustments.</Notice></div>}
        </Panel>

        <Panel title="Echoes" badge={<span className={`chip ${costTotal > 12 ? "!border-bad !text-bad" : ""}`}>cost {costTotal}/12</span>}>
          <div className="mb-3 flex flex-wrap gap-2">
            <button className="chip" onClick={() => setEchoes(DEFAULT_COSTS.map(typicalEcho))}>Typical DPS preset</button>
            <button className="chip" onClick={() => setEchoes(DEFAULT_COSTS.map(emptyEcho))}>Clear subs</button>
            {Object.entries(sonataCounts).filter(([, n]) => n >= 2).map(([n, c]) => <span key={n} className="chip" data-on>{n} ({c}pc)</span>)}
          </div>
          {costTotal > 12 && <div className="mb-3"><Notice tone="bad">Total cost is over 12; the game will not let you equip this.</Notice></div>}
          <div className="grid gap-3">
            {echoes.map((e, i) => (
              <div key={i} className="card-raised p-3">
                <div className="grid gap-2 sm:grid-cols-4">
                  <Field label={`Echo ${i + 1} cost`}><select value={e.cost} onChange={(ev) => setEcho(i, { cost: +ev.target.value, main: 0 })}>{[4, 3, 1, 0].map((c) => <option key={c} value={c}>{c === 0 ? "Empty" : `${c}-cost`}</option>)}</select></Field>
                  <Field label="Sonata set"><select value={e.sonata} disabled={!e.cost} onChange={(ev) => setEcho(i, { sonata: ev.target.value })}><option value="">None</option>{gear?.sonatas.map((s) => <option key={s.name}>{s.name}</option>)}</select></Field>
                  <Field label="Main stat"><select value={e.main} disabled={!e.cost} onChange={(ev) => setEcho(i, { main: +ev.target.value })}>{(ECHO_MAIN[e.cost] ?? []).map((m, k) => <option key={k} value={k}>{STAT_LABEL[m.stat]} {m.v}%</option>)}</select></Field>
                </div>
                {e.cost > 0 && (
                  <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                    {e.subs.map((s, k) => (
                      <div key={k} className="flex gap-1.5">
                        <select aria-label={`Echo ${i + 1} substat ${k + 1}`} value={s.stat} onChange={(ev) => setEcho(i, { subs: e.subs.map((x, j) => (j === k ? { ...x, stat: ev.target.value as StatKey | "" } : x)) })} className="min-w-0 flex-1">
                          <option value="">— substat —</option>{SUB_STATS.map((st) => <option key={st} value={st}>{STAT_LABEL[st]}</option>)}
                        </select>
                        <select aria-label="Roll value" value={s.tier} disabled={!s.stat} onChange={(ev) => setEcho(i, { subs: e.subs.map((x, j) => (j === k ? { ...x, tier: +ev.target.value } : x)) })} className="w-24">
                          {(s.stat ? SUB_VALUES[s.stat] ?? [] : []).map((v, t) => <option key={t} value={t}>{v}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {[0, 1].map((i) => (
              <Field key={i} label={`Forte stat node ${i + 1}`}>
                <select value={forte[i]} onChange={(ev) => setForte((f) => (i === 0 ? [ev.target.value as StatKey, f[1]] : [f[0], ev.target.value as StatKey]))}>{FORTE_OPTIONS.map((o) => <option key={o.stat + o.label} value={o.stat}>{o.label}</option>)}</select>
              </Field>
            ))}
          </div>
          <p className="mt-2 text-[12px] text-dim">Forte nodes differ per Resonator; pick the two that match your character&apos;s tree.</p>
        </Panel>

        <Panel title={`Buffs (${effects.length})`} defaultOpen={effects.some((e) => !e.always)}>
          {effects.length === 0 ? <p className="text-[13px] text-dim">No weapon or Sonata effects apply yet. Pick a weapon, or equip 2+ Echoes of one set.</p> : (
            <ul className="grid gap-2">
              {effects.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 rounded border border-line bg-panel2 p-2.5 text-[13px]">
                  <div className="min-w-0 flex-1"><div><b>{e.label}</b> <span className="text-dim">{e.source.kind}</span> · <span className="num text-accent">+{e.value}{e.stat.endsWith("Flat") ? "" : "%"} {STAT_LABEL[e.stat as StatKey] ?? e.stat}</span></div><div className="line-clamp-2 text-[12px] text-dim" title={e.text}>{e.text}</div></div>
                  {e.always ? <span className="chip" data-on>always on</span> : (
                    <div className="flex items-center gap-2"><span className="label">Stacks</span><select value={stacks[e.id] ?? 0} onChange={(ev) => setStacks((s) => ({ ...s, [e.id]: +ev.target.value }))} aria-label={`${e.label} stacks`}>{Array.from({ length: e.maxStacks + 1 }, (_, n) => <option key={n} value={n}>{n === 0 ? "off" : n}</option>)}</select></div>
                  )}
                </li>
              ))}
            </ul>
          )}
          <details className="mt-4"><summary className="cursor-pointer text-[13px] text-mute">Manual adjustments (team buffs, outro, anything not modelled)</summary>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {([["atkPct", "ATK %"], ["atkFlat", "ATK flat"], ["critRate", "Crit. Rate %"], ["critDmg", "Crit. DMG %"], ["er", "Energy Regen %"], ["dmgBonus", "DMG Bonus % (all)"], ["deepen", "DMG Deepen %"], ["amplify", "DMG Amplify %"], ["defIgnore", "DEF Ignore %"]] as [keyof Manual, string][]).map(([k, l]) => (
                <Field key={k} label={l}><NumInput value={manual[k]} onChange={(n) => setManual((m) => ({ ...m, [k]: n }))} /></Field>
              ))}
            </div>
            <p className="mt-2 text-[12px] text-dim">Deepen and Amplify are separate multiplicative zones. Check the buff text in-game to see which one applies.</p>
          </details>
        </Panel>

        <Panel title="Enemy" badge={<ConfidenceBadge level={ENEMY_PRESETS.find((p) => p.id === enemyPreset)?.confidence ?? "estimated"} />}>
          <div className="grid gap-3 sm:grid-cols-4">
            <Field label="Preset"><select value={enemyPreset} onChange={(e) => { const p = ENEMY_PRESETS.find((x) => x.id === e.target.value)!; setEnemyPreset(p.id); if (p.id !== "custom") setEnemy((x) => ({ ...x, level: p.level, res: p.res })); }}>{ENEMY_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</select></Field>
            <Field label="Level"><NumInput value={enemy.level} min={1} max={150} onChange={(n) => { setEnemyPreset("custom"); setEnemy((x) => ({ ...x, level: n })); }} /></Field>
            <Field label="RES %"><NumInput value={enemy.res} onChange={(n) => { setEnemyPreset("custom"); setEnemy((x) => ({ ...x, res: n })); }} /></Field>
            <Field label="RES shred %"><NumInput value={enemy.resShred} onChange={(n) => setEnemy((x) => ({ ...x, resShred: n }))} /></Field>
          </div>
          <p className="mt-2 text-[12px] text-dim">{ENEMY_PRESETS.find((p) => p.id === enemyPreset)?.note} Enemy values are community figures. Effective RES: <span className="num">{enemy.res - enemy.resShred}%</span>.</p>
        </Panel>

        <Panel title="Rotation" badge={<span className="chip num">{rotation.reduce((a, r) => a + r.count, 0)} hits</span>}>
          {!char ? <div className="skeleton h-40" /> : (
            <div className="grid gap-4">
              {char.skills.filter((s) => s.rows.length).map((s) => (
                <div key={s.type + s.name}>
                  <div className="label mb-1">{s.type}: <span className="text-fg normal-case">{s.name}</span></div>
                  <div className="grid gap-1">
                    {s.rows.map((r) => {
                      const k = rowKey(s.type, r.label);
                      const c = counts[k] ?? 0;
                      return (
                        <div key={k} className={`flex items-center gap-2 rounded px-2 py-1 text-[13px] ${c > 0 ? "bg-accent/10" : ""}`}>
                          <span className="min-w-0 flex-1 truncate" title={r.label}>{r.label}</span>
                          <select aria-label={`${r.label} scales with`} value={scaleOv[k] ?? r.scalesWith} onChange={(e) => setScaleOv((o) => ({ ...o, [k]: e.target.value as Scaling }))} className="!w-[62px] !px-1 !py-0.5 text-[11px] uppercase text-dim"><option value="atk">ATK</option><option value="hp">HP</option><option value="def">DEF</option></select>
                          <div className="flex items-center gap-1">
                            <button className="chip !min-h-7 !px-2" aria-label={`Decrease ${r.label}`} onClick={() => setCounts((o) => ({ ...o, [k]: Math.max(0, c - 1) }))}>−</button>
                            <span className="num w-6 text-center">{c}</span>
                            <button className="chip !min-h-7 !px-2" aria-label={`Increase ${r.label}`} onClick={() => setCounts((o) => ({ ...o, [k]: c + 1 }))}>+</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="mt-3 text-[12px] text-dim">Hits are summed (no timing, energy or cooldown validation yet; the timeline simulator is on the roadmap). Scaling stat is auto-detected from the hit label; override it if wrong.</p>
        </Panel>
      </div>

      {/* Results */}
      <aside className="lg:sticky lg:top-20 lg:h-fit">
        <div className="glass grid gap-4 rounded-lg p-4" aria-live="polite">
          {!result || !char ? <div className="grid gap-3"><div className="skeleton h-10" /><div className="skeleton h-32" /></div> : (
            <>
              <div>
                <div className="label">Average rotation damage</div>
                <div className="font-display text-4xl text-accent"><CountUp value={result.total} /></div>
                <div className="mt-1 flex gap-4 text-[12px] text-dim"><span>no crit <span className="num text-mute">{fmt(result.totalNonCrit)}</span></span><span>all crit <span className="num text-mute">{fmt(result.totalCrit)}</span></span></div>
              </div>
              {compareResult && (
                <div className="rounded border border-line bg-panel2 p-3 text-[13px]">
                  <div className="label mb-1">Compare: {compare?.name}</div>
                  <div className="flex items-baseline justify-between"><span className="num">{fmt(compareResult.total)}</span><span className={`num font-semibold ${compareResult.total >= result.total ? "text-ok" : "text-bad"}`}>{((compareResult.total / (result.total || 1) - 1) * 100).toFixed(2)}%</span></div>
                </div>
              )}
              {result.stats.critRate > 100 && <Notice>Crit. Rate is {result.stats.critRate.toFixed(1)}%. Anything above 100% is wasted.</Notice>}
              {result.stats.er < 100 && <Notice tone="info">Energy Regen below 100% is impossible in-game; check your inputs.</Notice>}

              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-[13px]">
                {([["ATK", result.stats.atk, 0], ["HP", result.stats.hp, 0], ["DEF", result.stats.def, 0], ["Crit. Rate", Math.min(100, result.stats.critRate), 1], ["Crit. DMG", result.stats.critDmg, 1], ["Energy Regen", result.stats.er, 1]] as [string, number, number][]).map(([k, v, d]) => (
                  <div key={k} className="flex justify-between border-b border-line py-1"><dt className="text-dim">{k}</dt><dd><CountUp value={v} decimals={d} suffix={d ? "%" : ""} /></dd></div>
                ))}
                <div className="flex justify-between border-b border-line py-1"><dt className="text-dim">DEF zone</dt><dd className="num">×{result.zones.def.toFixed(3)}</dd></div>
                <div className="flex justify-between border-b border-line py-1"><dt className="text-dim">RES zone</dt><dd className="num">×{result.zones.res.toFixed(3)}</dd></div>
              </dl>

              <div>
                <div className="label mb-2">Damage by hit</div>
                {result.rows.length === 0 ? <p className="text-[13px] text-dim">Add hits in the Rotation panel.</p> : (
                  <ul className="grid gap-2.5">
                    {result.rows.map((r) => (
                      <li key={r.id} className="text-[12.5px]">
                        <div className="flex justify-between gap-2"><span className="truncate" title={r.label}>{r.count > 1 ? `${r.count}× ` : ""}{r.label}</span><span className="num shrink-0">{fmt(r.average)}</span></div>
                        <GrowBar pct={(r.average / (topRow?.average || 1)) * 100} color={ELEMENT_COLOR[char.element]} />
                        <details className="mt-0.5"><summary className="cursor-pointer text-[11px] text-dim">Explain</summary>
                          <table className="mt-1 w-full text-[11.5px]"><tbody>
                            {r.trace.map((t) => <tr key={t.zone}><td className="py-0.5 pr-2 text-dim">{t.zone}</td><td className="num pr-2 text-right">{t.zone.startsWith("Base") ? fmt(t.value) : `×${t.value.toFixed(4)}`}</td><td className="text-dim">{t.note}</td></tr>)}
                            <tr><td className="pt-1 text-dim">Non-crit / crit / avg (per hit)</td><td colSpan={2} className="num pt-1 text-right">{fmt(r.nonCrit / r.count)} / {fmt(r.crit / r.count)} / {fmt(r.average / r.count)}</td></tr>
                          </tbody></table>
                        </details>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {weights.length > 0 && (
                <div>
                  <div className="label mb-2">Stat weights <span className="normal-case text-dim">(+1 average roll)</span></div>
                  <ul className="grid gap-1.5">
                    {weights.map((w) => (
                      <li key={w.stat} className="grid grid-cols-[1fr_auto] items-center gap-x-3 text-[12.5px]"><span>{STAT_LABEL[w.stat]} <span className="text-dim">+{w.roll.toFixed(1)}</span></span><span className="num text-ok">+{w.gain.toFixed(2)}%</span>
                        <div className="col-span-2"><GrowBar pct={(w.gain / (weights[0].gain || 1)) * 100} color="var(--color-tide)" /></div></li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid gap-2 border-t border-line pt-3">
                <Field label="Compare weapon (A/B)"><select value={compareSlug} onChange={(e) => setCompareSlug(e.target.value)}><option value="">Off</option>{weaponChoices.map((w) => <option key={w.name} value={w.slug}>{w.name}</option>)}</select></Field>
                <div className="flex flex-wrap items-center gap-2">
                  <button className="btn btn-primary" onClick={doShare} disabled={share.state === "saving"}>{share.state === "saving" ? "Saving…" : "Share build"}</button>
                  <ReportIssue kind="calc-mismatch" label="Report mismatch" />
                </div>
                {share.state === "done" && <div className="break-all text-[12px] text-ok">Link copied: <a href={share.url} className="underline">{share.url}</a></div>}
                {share.state === "error" && <div className="text-[12px] text-bad">{share.msg}</div>}
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
