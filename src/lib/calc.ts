// Damage and stat engine for the build simulator.
// Formula: DMG = Multiplier x ATK x (1 + sum of DMG bonuses) x (1 + Deepen) x (1 + Amplify) x Crit x DEF multiplier x RES multiplier

export type StatKey =
  | "atkPct"
  | "atkFlat"
  | "hpPct"
  | "hpFlat"
  | "defPct"
  | "defFlat"
  | "critRate"
  | "critDmg"
  | "er"
  | "ele"
  | "basic"
  | "heavy"
  | "skill"
  | "lib"
  | "intro"
  | "outro"
  | "echoSkill"
  | "heal";

export const STAT_LABEL: Record<StatKey, string> = {
  atkPct: "ATK %",
  atkFlat: "ATK",
  hpPct: "HP %",
  hpFlat: "HP",
  defPct: "DEF %",
  defFlat: "DEF",
  critRate: "Crit. Rate",
  critDmg: "Crit. DMG",
  er: "Energy Regen",
  ele: "Elemental DMG Bonus",
  basic: "Basic Attack DMG Bonus",
  heavy: "Heavy Attack DMG Bonus",
  skill: "Resonance Skill DMG Bonus",
  lib: "Resonance Liberation DMG Bonus",
  intro: "Intro Skill DMG Bonus",
  outro: "Outro Skill DMG Bonus",
  echoSkill: "Echo Skill DMG Bonus",
  heal: "Healing Bonus",
};

export const FLAT_STATS: StatKey[] = ["atkFlat", "hpFlat", "defFlat"];
export const isPercentStat = (s: StatKey) => !FLAT_STATS.includes(s);

// --- level scaling (HP/ATK/DEF multipliers relative to level 1) ---
export const CHAR_LEVELS: { label: string; mult: number }[] = [
  ["1", 1],
  ["20", 2.6],
  ["20 (asc.)", 2830.09 / 866],
  ["40", 4288.87 / 866],
  ["40 (asc.)", 4858.26 / 866],
  ["50", 5594.36 / 866],
  ["50 (asc.)", 6174.58 / 866],
  ["60", 6902.02 / 866],
  ["60 (asc.)", 7480.51 / 866],
  ["70", 8211.24 / 866],
  ["70 (asc.)", 8788.17 / 866],
  ["80", 9517.34 / 866],
  ["80 (asc.)", 10095.67 / 866],
  ["90", 12.5],
].map(([label, mult]) => ({ label: label as string, mult: mult as number }));

export const WEAPON_LEVELS: { label: string; atk: number; stat: number }[] = [
  { label: "1", atk: 1, stat: 1 },
  { label: "20", atk: 122 / 47, stat: 1.7778 },
  { label: "20 (asc.)", atk: 153 / 47, stat: 1.7778 },
  { label: "40", atk: 232 / 47, stat: 2.5556 },
  { label: "40 (asc.)", atk: 264 / 47, stat: 2.5556 },
  { label: "50", atk: 303 / 47, stat: 2.9444 },
  { label: "50 (asc.)", atk: 335 / 47, stat: 2.9444 },
  { label: "60", atk: 374 / 47, stat: 3.3333 },
  { label: "60 (asc.)", atk: 406 / 47, stat: 3.3333 },
  { label: "70", atk: 445 / 47, stat: 3.7222 },
  { label: "70 (asc.)", atk: 476 / 47, stat: 3.7222 },
  { label: "80", atk: 516 / 47, stat: 4.1111 },
  { label: "80 (asc.)", atk: 547 / 47, stat: 4.1111 },
  { label: "90", atk: 587 / 47, stat: 4.5 },
];

// skill level multipliers relative to level 1 (identical curve for all skills)
export const SKILL_CURVE = [1, 1.082, 1.164, 1.2789, 1.3609, 1.4551, 1.5864, 1.7175, 1.8488, 1.9881];

// --- echo stat tables ---
export const ECHO_MAIN: Record<number, { stat: StatKey; v: number }[]> = {
  4: [
    { stat: "critRate", v: 22 },
    { stat: "critDmg", v: 44 },
    { stat: "heal", v: 26.4 },
    { stat: "atkPct", v: 33 },
    { stat: "hpPct", v: 33 },
    { stat: "defPct", v: 41.5 },
  ],
  3: [
    { stat: "ele", v: 30 },
    { stat: "er", v: 32 },
    { stat: "atkPct", v: 30 },
    { stat: "hpPct", v: 30 },
    { stat: "defPct", v: 38 },
  ],
  1: [
    { stat: "atkPct", v: 18 },
    { stat: "hpPct", v: 22.8 },
    { stat: "defPct", v: 18 },
  ],
};
export const ECHO_FIXED: Record<number, { stat: StatKey; v: number }> = {
  4: { stat: "atkFlat", v: 150 },
  3: { stat: "atkFlat", v: 100 },
  1: { stat: "hpFlat", v: 2280 },
};

export const SUB_VALUES: Record<string, number[]> = {
  critRate: [6.3, 6.9, 7.5, 8.1, 8.7, 9.3, 9.9, 10.5],
  critDmg: [12.6, 13.8, 15, 16.2, 17.4, 18.6, 19.8, 21],
  atkPct: [6.4, 7.1, 7.9, 8.6, 9.4, 10.1, 10.9, 11.6],
  atkFlat: [30, 40, 50, 60],
  hpPct: [6.4, 7.1, 7.9, 8.6, 9.4, 10.1, 10.9, 11.6],
  hpFlat: [320, 360, 390, 430, 470, 510, 540, 580],
  defPct: [8.1, 9, 10, 10.9, 11.8, 12.8, 13.8, 14.7],
  defFlat: [40, 50, 60, 70],
  er: [6.8, 7.6, 8.4, 9.2, 10, 10.8, 11.6, 12.4],
  basic: [6.4, 7.1, 7.9, 8.6, 9.4, 10.1, 10.9, 11.6],
  heavy: [6.4, 7.1, 7.9, 8.6, 9.4, 10.1, 10.9, 11.6],
  skill: [6.4, 7.1, 7.9, 8.6, 9.4, 10.1, 10.9, 11.6],
  lib: [6.4, 7.1, 7.9, 8.6, 9.4, 10.1, 10.9, 11.6],
};
export const SUB_STATS = Object.keys(SUB_VALUES) as StatKey[];

export const FORTE_OPTIONS: { stat: StatKey; v: number; label: string }[] = [
  { stat: "ele", v: 12, label: "Elemental DMG +12%" },
  { stat: "atkPct", v: 12, label: "ATK +12%" },
  { stat: "critRate", v: 8, label: "Crit. Rate +8%" },
  { stat: "critDmg", v: 16, label: "Crit. DMG +16%" },
  { stat: "hpPct", v: 12, label: "HP +12%" },
  { stat: "defPct", v: 15.2, label: "DEF +15.2%" },
  { stat: "heal", v: 12, label: "Healing Bonus +12%" },
  { stat: "none" as StatKey, v: 0, label: "None" },
];

// --- types ---
export type Hit = [number, number];
export type CalcRow = { l: string; h: Hit[]; k: string };
export type CalcSkill = { n: string; t: string; r: CalcRow[] };
export type CalcChar = {
  slug: string;
  name: string;
  el: string;
  wp: string;
  rar: number;
  b: { hp: number; atk: number; def: number };
  sk: CalcSkill[];
  img?: string | null;
  ch: { l: number; n: string; d: string }[];
};
export type CalcBuff = { id: string; label: string; source: string; stat: StatKey; value: number; stacks: number; text: string };

export type EchoSlotState = {
  echo: string; // echo name
  cost: number;
  sonata: string;
  main: number; // index into ECHO_MAIN[cost]
  subs: { stat: StatKey | ""; tier: number }[];
};

export type RotationItem = { id: string; label: string; skillType: string; count: number; type: StatKey | "none"; mult: number };

export type Enemy = { level: number; res: number; defIgnore: number; resShred: number };
export type Manual = {
  atkPct: number;
  atkFlat: number;
  critRate: number;
  critDmg: number;
  dmgBonus: number;
  deepen: number;
  amplify: number;
  er: number;
};

export function inferType(skillType: string, label: string): StatKey | "none" {
  const lab = label.toLowerCase();
  if (skillType === "Basic Attack") return lab.includes("heavy") ? "heavy" : "basic";
  if (skillType === "Resonance Skill") return "skill";
  if (skillType === "Resonance Liberation") return "lib";
  if (skillType === "Intro Skill") return "intro";
  if (skillType === "Outro Skill") return "outro";
  if (lab.includes("heavy")) return "heavy";
  if (lab.includes("basic")) return "basic";
  if (lab.includes("liberation")) return "lib";
  if (lab.includes("intro")) return "intro";
  if (lab.includes("outro")) return "outro";
  return "skill";
}

export function rowMultiplier(hits: Hit[], skillLevel: number) {
  const base = hits.reduce((s, [v, n]) => s + v * n, 0);
  return (base * SKILL_CURVE[Math.max(0, Math.min(9, skillLevel - 1))]) / 100;
}

export type WeaponLite = {
  name: string;
  type: string;
  rarity: number;
  atk: number;
  stat: string;
  statValue: number;
  buffs: { stat: string; v: number[]; always: boolean; stacks: number; text: string; el?: string }[];
};
export type SonataLite = {
  name: string;
  pieces: number[];
  buffs: { stat: string; v: number[]; always: boolean; stacks: number; text: string; el?: string; piece?: number }[];
};

export function weaponSecondary(w: WeaponLite, lvMult: number): { stat: StatKey; v: number } | null {
  const map: Record<string, StatKey> = {
    "Crit. Rate": "critRate",
    "Crit. DMG": "critDmg",
    ATK: "atkPct",
    HP: "hpPct",
    DEF: "defPct",
    "Energy Regen": "er",
  };
  const k = map[w.stat];
  if (!k) return null;
  return { stat: k, v: w.statValue * lvMult };
}

export function collectBuffs(
  char: CalcChar,
  weapon: WeaponLite | undefined,
  rank: number,
  sonataCounts: Record<string, number>,
  sonatas: SonataLite[]
): CalcBuff[] {
  const out: CalcBuff[] = [];
  if (weapon) {
    weapon.buffs.forEach((b, i) => {
      if (b.el && b.el !== char.el) return;
      const v = b.v[Math.min(b.v.length - 1, rank - 1)];
      out.push({ id: `w${i}`, label: weapon.name, source: "Weapon", stat: b.stat as StatKey, value: v, stacks: b.stacks, text: b.text.replace(/^\|\s*/, "") });
    });
  }
  for (const s of sonatas) {
    const cnt = sonataCounts[s.name] || 0;
    s.buffs.forEach((b, i) => {
      if (!b.piece || cnt < b.piece) return;
      if (b.el && b.el !== char.el) return;
      out.push({ id: `s:${s.name}:${i}`, label: s.name, source: `${b.piece}pc`, stat: b.stat as StatKey, value: b.v[0], stacks: b.stacks, text: b.text });
    });
  }
  return out;
}

export type CalcInput = {
  char: CalcChar;
  charLv: number; // index
  weapon?: WeaponLite;
  weaponLv: number; // index
  rank: number;
  echoes: EchoSlotState[];
  forte: [StatKey | "none", StatKey | "none"];
  buffs: CalcBuff[];
  buffState: Record<string, number>; // stacks active
  manual: Manual;
  enemy: Enemy;
  charLevel: number;
  rotation: RotationItem[];
  skillLevel: number;
};

export type StatsOut = {
  atk: number;
  hp: number;
  def: number;
  critRate: number;
  critDmg: number;
  er: number;
  heal: number;
  bonus: Record<string, number>;
  baseAtk: number;
};

export function computeStats(inp: CalcInput): StatsOut {
  const lv = CHAR_LEVELS[inp.charLv].mult;
  const baseHp = inp.char.b.hp * lv;
  const baseAtkChar = inp.char.b.atk * lv;
  const baseDef = inp.char.b.def * lv;
  const sums: Record<string, number> = {};
  const add = (k: string, v: number) => {
    sums[k] = (sums[k] || 0) + v;
  };
  let weaponAtk = 0;
  if (inp.weapon) {
    const wl = WEAPON_LEVELS[inp.weaponLv];
    weaponAtk = inp.weapon.atk * wl.atk;
    const sec = weaponSecondary(inp.weapon, wl.stat);
    if (sec) add(sec.stat, sec.v);
  }
  for (const e of inp.echoes) {
    if (!e.cost) continue;
    const main = ECHO_MAIN[e.cost]?.[e.main];
    if (main) add(main.stat, main.v);
    const fx = ECHO_FIXED[e.cost];
    if (fx) add(fx.stat, fx.v);
    for (const s of e.subs) {
      if (!s.stat) continue;
      const arr = SUB_VALUES[s.stat];
      if (arr) add(s.stat, arr[Math.min(s.tier, arr.length - 1)]);
    }
  }
  for (const f of inp.forte) {
    const o = FORTE_OPTIONS.find((x) => x.stat === f);
    if (o && f !== "none") add(o.stat, o.v);
  }
  for (const b of inp.buffs) {
    const st = inp.buffState[b.id] ?? 0;
    if (!st) continue;
    add(b.stat, b.value * st);
  }
  add("atkPct", inp.manual.atkPct);
  add("atkFlat", inp.manual.atkFlat);
  add("critRate", inp.manual.critRate);
  add("critDmg", inp.manual.critDmg);
  add("er", inp.manual.er);
  const baseAtk = baseAtkChar + weaponAtk;
  const atk = baseAtk * (1 + (sums.atkPct || 0) / 100) + (sums.atkFlat || 0);
  const hp = baseHp * (1 + (sums.hpPct || 0) / 100) + (sums.hpFlat || 0);
  const def = baseDef * (1 + (sums.defPct || 0) / 100) + (sums.defFlat || 0);
  return {
    atk,
    hp,
    def,
    critRate: 5 + (sums.critRate || 0),
    critDmg: 150 + (sums.critDmg || 0),
    er: 100 + (sums.er || 0),
    heal: sums.heal || 0,
    baseAtk,
    bonus: {
      ele: sums.ele || 0,
      basic: sums.basic || 0,
      heavy: sums.heavy || 0,
      skill: sums.skill || 0,
      lib: sums.lib || 0,
      intro: sums.intro || 0,
      outro: sums.outro || 0,
      echoSkill: sums.echoSkill || 0,
    },
  };
}

export type RowResult = { id: string; label: string; count: number; type: string; perCast: number; perCastCrit: number; perCastNoCrit: number; total: number };

export function computeDamage(inp: CalcInput, stats: StatsOut) {
  const cr = Math.max(0, Math.min(100, stats.critRate)) / 100;
  const cd = stats.critDmg / 100;
  const critAvg = 1 + cr * (cd - 1);
  const cl = inp.charLevel;
  const defNum = 800 + 8 * cl;
  const enemyDef = (8 * inp.enemy.level + 792) * (1 - Math.min(100, inp.enemy.defIgnore) / 100);
  const defMult = defNum / (defNum + enemyDef);
  const res = inp.enemy.res - inp.enemy.resShred;
  const resMult = res >= 0 ? 1 - res / 100 : 1 - res / 200;
  const deepen = 1 + inp.manual.deepen / 100;
  const amplify = 1 + inp.manual.amplify / 100;
  const rows: RowResult[] = inp.rotation.map((r) => {
    const typeBonus = r.type !== "none" ? stats.bonus[r.type] || 0 : 0;
    const bonus = 1 + (stats.bonus.ele + typeBonus + inp.manual.dmgBonus) / 100;
    const base = r.mult * stats.atk * bonus * deepen * amplify * defMult * resMult;
    return {
      id: r.id,
      label: r.label,
      count: r.count,
      type: r.type,
      perCast: base * critAvg,
      perCastCrit: base * cd,
      perCastNoCrit: base,
      total: base * critAvg * r.count,
    };
  });
  const total = rows.reduce((s, r) => s + r.total, 0);
  const totalNoCrit = rows.reduce((s, r) => s + r.perCastNoCrit * r.count, 0);
  const totalCrit = rows.reduce((s, r) => s + r.perCastCrit * r.count, 0);
  return { rows, total, totalNoCrit, totalCrit, critAvg, defMult, resMult };
}

export const fmt = (n: number, d = 0) => n.toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d });
