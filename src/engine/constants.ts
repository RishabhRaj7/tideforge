// Static game tables used by the engine. Pure data, no imports from React / DB / Next.
// Each table is tagged with a confidence level so the UI can show where numbers come from.
import type { Confidence, StatKey } from "./types";

export const ELEMENTS = ["Glacio", "Fusion", "Electro", "Aero", "Spectro", "Havoc"] as const;
export const WEAPON_TYPES = ["Broadblade", "Sword", "Pistols", "Gauntlets", "Rectifier"] as const;

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

export const DAMAGE_TAGS = ["basic", "heavy", "skill", "lib", "intro", "outro", "echoSkill"] as const;

/** Base stats of a Resonator at level 1 are multiplied by these factors. Anchors come from community stat
 *  tables (Lv20..80). Lv20 (not ascended) and Lv90 are interpolated: confidence "estimated". */
export const CHAR_LEVELS: { label: string; level: number; mult: number }[] = [
  { label: "1", level: 1, mult: 1 },
  { label: "20", level: 20, mult: 2.6 },
  { label: "20 (asc.)", level: 20, mult: 2830.09 / 866 },
  { label: "40", level: 40, mult: 4288.87 / 866 },
  { label: "40 (asc.)", level: 40, mult: 4858.26 / 866 },
  { label: "50", level: 50, mult: 5594.36 / 866 },
  { label: "50 (asc.)", level: 50, mult: 6174.58 / 866 },
  { label: "60", level: 60, mult: 6902.02 / 866 },
  { label: "60 (asc.)", level: 60, mult: 7480.51 / 866 },
  { label: "70", level: 70, mult: 8211.24 / 866 },
  { label: "70 (asc.)", level: 70, mult: 8788.17 / 866 },
  { label: "80", level: 80, mult: 9517.34 / 866 },
  { label: "80 (asc.)", level: 80, mult: 10095.67 / 866 },
  { label: "90", level: 90, mult: 12.5 },
];
export const CHAR_LEVEL_CONFIDENCE: Confidence = "estimated";

/** (ascension, level) in the datamine for every CHAR_LEVELS / WEAPON_LEVELS label. */
export const LEVEL_ASC: Record<string, [number, number]> = {
  "1": [0, 1], "20": [0, 20], "20 (asc.)": [1, 20], "40": [1, 40], "40 (asc.)": [2, 40], "50": [2, 50], "50 (asc.)": [3, 50],
  "60": [3, 60], "60 (asc.)": [4, 60], "70": [4, 70], "70 (asc.)": [5, 70], "80": [5, 80], "80 (asc.)": [6, 80], "90": [6, 90],
};

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

/** Skill level multipliers relative to level 1. One curve for all skills (community-derived, estimated). */
export const SKILL_CURVE = [1, 1.082, 1.164, 1.2789, 1.3609, 1.4551, 1.5864, 1.7175, 1.8488, 1.9881];

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

export const SUB_VALUES: Partial<Record<StatKey, number[]>> = {
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

/** Average substat roll: mean of the tier table (tier probabilities are not in our data yet). */
export const avgRoll = (s: StatKey) => {
  const a = SUB_VALUES[s];
  return a ? a.reduce((x, y) => x + y, 0) / a.length : 0;
};

export const FORTE_OPTIONS: { stat: StatKey | "none"; v: number; label: string }[] = [
  { stat: "ele", v: 12, label: "Elemental DMG +12%" },
  { stat: "atkPct", v: 12, label: "ATK +12%" },
  { stat: "critRate", v: 8, label: "Crit. Rate +8%" },
  { stat: "critDmg", v: 16, label: "Crit. DMG +16%" },
  { stat: "hpPct", v: 12, label: "HP +12%" },
  { stat: "defPct", v: 15.2, label: "DEF +15.2%" },
  { stat: "heal", v: 12, label: "Healing Bonus +12%" },
  { stat: "none", v: 0, label: "None" },
];

export type EnemyPreset = { id: string; label: string; level: number; res: number; note: string; confidence: Confidence };
export const ENEMY_PRESETS: EnemyPreset[] = [
  { id: "l90", label: "Level 90 enemy, 10% RES", level: 90, res: 10, note: "Typical field enemy.", confidence: "community" },
  { id: "l100", label: "Level 100 enemy, 10% RES", level: 100, res: 10, note: "Endgame add / non-elemental boss.", confidence: "community" },
  { id: "l100e", label: "Level 100 boss, 40% RES", level: 100, res: 40, note: "Boss resistant to its own element; use for off-element tests.", confidence: "community" },
  { id: "l80", label: "Level 80 enemy, 10% RES", level: 80, res: 10, note: "Mid-game content.", confidence: "community" },
  { id: "custom", label: "Custom", level: 100, res: 10, note: "Enter your own numbers.", confidence: "estimated" },
];

/** Convene (gacha) constants. Base rate / hard pity are official; soft pity onset is community-derived. */
export const CONVENE = {
  baseRate5: 0.008,
  hardPity: 80,
  softPityStart: 66,
  fourStarRate: 0.06,
  fourStarGuarantee: 10,
  astritePerPull: 160,
  featuredResonatorWinRate: 0.5,
} as const;
