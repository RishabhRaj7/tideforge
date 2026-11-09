export type Element = "Glacio" | "Fusion" | "Electro" | "Aero" | "Spectro" | "Havoc";
export type Confidence = "datamined" | "official" | "tested" | "community" | "estimated";
export type Scaling = "atk" | "hp" | "def";

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

export type DmgTag = "basic" | "heavy" | "skill" | "lib" | "intro" | "outro" | "echoSkill";

/** Damage zones. "stat" feeds the stat pipeline; "bonus" is the additive DMG-bonus zone. */
export type EffectZone = "stat" | "bonus" | "deepen" | "amplify" | "defIgnore" | "resShred";

export type Effect = {
  id: string;
  label: string;
  source: { kind: "weapon" | "sonata" | "forte" | "manual" | "echo"; ref: string };
  scope: "self" | "team" | "enemy";
  stat: StatKey | "deepen" | "amplify" | "defIgnore" | "resShred";
  zone: EffectZone;
  /** value per single stack, in percent points (or flat for flat stats) */
  value: number;
  maxStacks: number;
  always: boolean;
  text: string;
  confidence: Confidence;
};

export type HitRow = { label: string; kind: string; hits: [number, number][]; scalesWith: Scaling; tag: DmgTag };

export type EngineChar = {
  slug: string;
  name: string;
  element: Element;
  weapon: string;
  base: { hp: number; atk: number; def: number };
  baseConfidence: Confidence;
  skills: { name: string; type: string; rows: HitRow[] }[];
};

export type EngineWeapon = {
  slug: string;
  name: string;
  type: string;
  rarity: number;
  atk: number;
  stat: string;
  statValue: number;
  effects: { stat: string; v: number[]; always: boolean; stacks: number; text: string; el?: string }[];
};

export type EngineSonata = {
  name: string;
  pieces: number[];
  effects: { stat: string; v: number[]; always: boolean; stacks: number; text: string; el?: string; piece?: number }[];
};

export type EchoSlot = {
  cost: number; // 0 = empty
  sonata: string;
  main: number; // index into ECHO_MAIN[cost]
  subs: { stat: StatKey | ""; tier: number }[];
};

export type Manual = {
  atkPct: number;
  atkFlat: number;
  critRate: number;
  critDmg: number;
  dmgBonus: number;
  deepen: number;
  amplify: number;
  er: number;
  defIgnore: number;
};

export type Enemy = { level: number; res: number; resShred: number };

export type StatBlock = {
  baseAtk: number;
  baseHp: number;
  baseDef: number;
  atk: number;
  hp: number;
  def: number;
  critRate: number; // percent, uncapped
  critDmg: number; // percent
  er: number;
  heal: number;
  bonus: Record<string, number>; // percent by tag + "ele" + "all"
  deepen: number;
  amplify: number;
  defIgnore: number;
  sources: { stat: string; value: number; from: string }[];
};

export type RotationItem = {
  id: string;
  label: string;
  tag: DmgTag;
  scalesWith: Scaling;
  /** sum of multiplier hits for the chosen skill level, in percent (before skill-level scaling) */
  basePct: number;
  count: number;
};

export type TraceEntry = { zone: string; value: number; note: string };

export type HitResult = {
  id: string;
  label: string;
  count: number;
  multiplier: number; // fraction
  baseStat: number;
  nonCrit: number;
  crit: number;
  average: number;
  trace: TraceEntry[];
};

export type CalcResult = {
  stats: StatBlock;
  rows: HitResult[];
  total: number;
  totalNonCrit: number;
  totalCrit: number;
  zones: { def: number; res: number; crit: number; bonus: number; deepen: number; amplify: number };
};
