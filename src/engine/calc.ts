import { avgRoll, CHAR_LEVELS, ECHO_FIXED, ECHO_MAIN, FORTE_OPTIONS, SUB_VALUES, WEAPON_LEVELS } from "./constants";
import { critMultiplier, defMultiplier, resMultiplier, skillCurve } from "./damage";
import type {
  CalcResult, DmgTag, EchoSlot, Effect, EngineChar, EngineWeapon, Enemy, HitResult, Manual, RotationItem, StatBlock, StatKey,
} from "./types";

export type CalcInput = {
  char: EngineChar;
  charLv: number; // index into CHAR_LEVELS
  attackerLevel?: number; // defaults to CHAR_LEVELS[charLv].level
  weapon?: EngineWeapon;
  weaponLv: number; // index into WEAPON_LEVELS
  echoes: EchoSlot[];
  forte: [StatKey | "none", StatKey | "none"];
  effects: Effect[];
  effectStacks: Record<string, number>;
  manual: Manual;
  enemy: Enemy;
  skillLevel: number;
  rotation: RotationItem[];
  /** extra stat points added on top (used by the stat-weight finite difference) */
  extra?: Partial<Record<StatKey, number>>;
};

export const EMPTY_MANUAL: Manual = { atkPct: 0, atkFlat: 0, critRate: 0, critDmg: 0, dmgBonus: 0, deepen: 0, amplify: 0, er: 0, defIgnore: 0 };

const SECONDARY: Record<string, StatKey> = {
  "Crit. Rate": "critRate",
  "Crit. DMG": "critDmg",
  ATK: "atkPct",
  HP: "hpPct",
  DEF: "defPct",
  "Energy Regen": "er",
};

export function weaponSecondary(w: EngineWeapon, lvMult: number): { stat: StatKey; v: number } | null {
  const k = SECONDARY[w.stat];
  return k ? { stat: k, v: w.statValue * lvMult } : null;
}

export function computeStats(inp: CalcInput): StatBlock {
  const lv = CHAR_LEVELS[inp.charLv]?.mult ?? 1;
  const sums: Record<string, number> = {};
  const sources: StatBlock["sources"] = [];
  const add = (k: string, v: number, from: string) => {
    sums[k] = (sums[k] || 0) + v;
    sources.push({ stat: k, value: v, from });
  };

  let weaponAtk = 0;
  if (inp.weapon) {
    const wl = WEAPON_LEVELS[inp.weaponLv] ?? WEAPON_LEVELS[WEAPON_LEVELS.length - 1];
    const real = inp.weapon.levelCurve?.[wl.label];
    weaponAtk = real ? real[0] : inp.weapon.atk * wl.atk;
    const sec = weaponSecondary(inp.weapon, wl.stat);
    if (sec && real) sec.v = real[1];
    if (sec) add(sec.stat, sec.v, `${inp.weapon.name} (secondary)`);
  }
  inp.echoes.forEach((e, i) => {
    if (!e.cost) return;
    const main = ECHO_MAIN[e.cost]?.[e.main];
    if (main) add(main.stat, main.v, `Echo ${i + 1} main`);
    const fx = ECHO_FIXED[e.cost];
    if (fx) add(fx.stat, fx.v, `Echo ${i + 1} fixed`);
    for (const s of e.subs) {
      if (!s.stat) continue;
      const arr = SUB_VALUES[s.stat];
      if (arr) add(s.stat, arr[Math.min(s.tier, arr.length - 1)], `Echo ${i + 1} sub`);
    }
  });
  for (const f of inp.forte) {
    const o = FORTE_OPTIONS.find((x) => x.stat === f);
    if (o && o.stat !== "none") add(o.stat, o.v, "Forte node");
  }
  for (const eff of inp.effects) {
    const stacks = eff.always ? eff.maxStacks : Math.min(eff.maxStacks, inp.effectStacks[eff.id] ?? 0);
    if (stacks > 0) add(eff.stat, eff.value * stacks, eff.label);
  }
  const m = inp.manual;
  add("atkPct", m.atkPct, "Manual");
  add("atkFlat", m.atkFlat, "Manual");
  add("critRate", m.critRate, "Manual");
  add("critDmg", m.critDmg, "Manual");
  add("er", m.er, "Manual");
  add("all", m.dmgBonus, "Manual");
  for (const [k, v] of Object.entries(inp.extra ?? {})) add(k, v as number, "Extra");

  // Prefer exact datamined stats for this level; fall back to the estimated multiplier table.
  const exact = inp.char.levelStats?.[CHAR_LEVELS[inp.charLv]?.label ?? ""];
  const baseAtk = (exact ? exact[1] : inp.char.base.atk * lv) + weaponAtk;
  const baseHp = exact ? exact[0] : inp.char.base.hp * lv;
  const baseDef = exact ? exact[2] : inp.char.base.def * lv;
  const s = (k: string) => sums[k] || 0;
  const bonus: Record<string, number> = { ele: s("ele"), all: s("all") };
  for (const t of ["basic", "heavy", "skill", "lib", "intro", "outro", "echoSkill"]) bonus[t] = s(t);

  return {
    baseAtk,
    baseHp,
    baseDef,
    atk: baseAtk * (1 + s("atkPct") / 100) + s("atkFlat"),
    hp: baseHp * (1 + s("hpPct") / 100) + s("hpFlat"),
    def: baseDef * (1 + s("defPct") / 100) + s("defFlat"),
    critRate: 5 + s("critRate"),
    critDmg: 150 + s("critDmg"),
    er: 100 + s("er"),
    heal: s("heal"),
    bonus,
    deepen: m.deepen,
    amplify: m.amplify,
    defIgnore: m.defIgnore,
    sources,
  };
}

export function calculate(inp: CalcInput): CalcResult {
  const stats = computeStats(inp);
  const attackerLevel = inp.attackerLevel ?? CHAR_LEVELS[inp.charLv]?.level ?? 90;
  const def = defMultiplier(attackerLevel, inp.enemy.level, stats.defIgnore);
  const res = resMultiplier(inp.enemy.res - inp.enemy.resShred);
  const crit = critMultiplier(stats.critRate, stats.critDmg, "average");
  const critOnly = critMultiplier(stats.critRate, stats.critDmg, "crit");
  const deepen = 1 + stats.deepen / 100;
  const amplify = 1 + stats.amplify / 100;
  const curve = skillCurve(inp.skillLevel);

  const rows: HitResult[] = inp.rotation.map((r) => {
    const bonusSum = stats.bonus.ele + stats.bonus.all + (stats.bonus[r.tag as DmgTag] ?? 0);
    const bonusZone = 1 + bonusSum / 100;
    const mult = (r.basePct * curve) / 100;
    const baseStat = r.scalesWith === "hp" ? stats.hp : r.scalesWith === "def" ? stats.def : stats.atk;
    const common = mult * baseStat * bonusZone * deepen * amplify * def * res;
    const nonCrit = common;
    const critDmg = common * critOnly;
    const avg = common * crit;
    return {
      id: r.id,
      label: r.label,
      count: r.count,
      multiplier: mult,
      baseStat,
      nonCrit: nonCrit * r.count,
      crit: critDmg * r.count,
      average: avg * r.count,
      trace: [
        { zone: "Multiplier", value: mult, note: `${(mult * 100).toFixed(2)}% at skill level ${inp.skillLevel}` },
        { zone: `Base ${r.scalesWith.toUpperCase()}`, value: baseStat, note: "Final stat after all % and flat sources" },
        { zone: "DMG Bonus", value: bonusZone, note: `1 + (${stats.bonus.ele.toFixed(1)}% element + ${(stats.bonus[r.tag] ?? 0).toFixed(1)}% ${r.tag} + ${stats.bonus.all.toFixed(1)}% other)` },
        { zone: "Deepen", value: deepen, note: `${stats.deepen}%` },
        { zone: "Amplify", value: amplify, note: `${stats.amplify}%` },
        { zone: "DEF", value: def, note: `Attacker Lv ${attackerLevel} vs enemy Lv ${inp.enemy.level}, ${stats.defIgnore}% DEF ignore` },
        { zone: "RES", value: res, note: `${inp.enemy.res - inp.enemy.resShred}% effective RES` },
        { zone: "Crit (avg)", value: crit, note: `CR ${Math.min(100, stats.critRate).toFixed(1)}% / CD ${stats.critDmg.toFixed(1)}%` },
      ],
    };
  });

  return {
    stats,
    rows,
    total: rows.reduce((a, r) => a + r.average, 0),
    totalNonCrit: rows.reduce((a, r) => a + r.nonCrit, 0),
    totalCrit: rows.reduce((a, r) => a + r.crit, 0),
    zones: { def, res, crit, bonus: 0, deepen, amplify },
  };
}

/** Marginal value of one average substat roll for the current build, as % change in total rotation damage. */
export function statWeights(inp: CalcInput) {
  const base = calculate(inp).total;
  if (base <= 0) return [];
  const tags = new Set(inp.rotation.filter((r) => r.count > 0).map((r) => r.tag));
  const scal = new Set(inp.rotation.filter((r) => r.count > 0).map((r) => r.scalesWith));
  const cand: StatKey[] = ["critRate", "critDmg", "atkPct", "atkFlat", "hpPct", "defPct", "basic", "heavy", "skill", "lib"];
  const out: { stat: StatKey; roll: number; gain: number }[] = [];
  for (const stat of cand) {
    if (stat === "atkPct" || stat === "atkFlat") {
      if (!scal.has("atk")) continue;
    } else if (stat === "hpPct") {
      if (!scal.has("hp")) continue;
    } else if (stat === "defPct") {
      if (!scal.has("def")) continue;
    } else if (["basic", "heavy", "skill", "lib"].includes(stat) && !tags.has(stat as DmgTag)) continue;
    const roll = avgRoll(stat);
    const next = calculate({ ...inp, extra: { ...(inp.extra ?? {}), [stat]: (inp.extra?.[stat] ?? 0) + roll } }).total;
    out.push({ stat, roll, gain: (next / base - 1) * 100 });
  }
  return out.sort((a, b) => b.gain - a.gain);
}
