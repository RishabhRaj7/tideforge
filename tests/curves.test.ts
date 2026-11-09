import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { computeStats, EMPTY_MANUAL, CHAR_LEVELS, LEVEL_ASC, WEAPON_LEVELS, type CalcInput, type EngineChar, type EngineWeapon } from "../src/engine";

const GEN = path.join(__dirname, "../src/data/generated");
const read = <T>(p: string): T => JSON.parse(fs.readFileSync(path.join(GEN, p), "utf8"));
type CharCurves = Record<string, { id: number; stats: Record<string, Record<string, [number, number, number]>> }>;
type WeaponCurves = Record<string, { id: number; sub: string; curve: Record<string, Record<string, [number, number]>>; ranks: string[][] }>;

const chars = read<CharCurves>("curves/characters.json");
const weapons = read<WeaponCurves>("curves/weapons.json");

describe("datamined curves: golden values", () => {
  it("Jinhsi Lv90 (ascension 6) matches the in-game stat page", () => {
    const [hp, atk, def] = chars.jinhsi.stats["6"]["90"];
    expect(hp).toBeCloseTo(10825, 0);
    expect(atk).toBeCloseTo(412.5, 1);
    expect(def).toBeCloseTo(1258.89, 1);
  });
  it("Ages of Harvest: Lv1 ATK 47, Lv90 ATK 587.5", () => {
    expect(weapons["ages-of-harvest"].curve["0"]["1"][0]).toBe(47);
    expect(weapons["ages-of-harvest"].curve["6"]["90"][0]).toBeCloseTo(587.5, 1);
  });
  it("percent secondary stats are exposed in percent (Crit. Rate 24.3% at Lv90)", () => {
    const w = weapons["ages-of-harvest"];
    expect(w.sub).toBe("Crit. Rate");
    expect(w.curve["6"]["90"][1]).toBeCloseTo(24.3, 2);
  });
});

describe("datamined curves: invariants", () => {
  it("every Resonator has ascensions 0-6 and every engine level label resolves", () => {
    for (const [slug, c] of Object.entries(chars)) {
      for (let a = 0; a <= 6; a++) expect(c.stats[String(a)], `${slug} asc ${a}`).toBeTruthy();
      for (const [label, [asc, lv]] of Object.entries(LEVEL_ASC)) expect(c.stats[String(asc)][String(lv)], `${slug} ${label}`).toBeTruthy();
    }
  });
  it("stats never decrease with level inside an ascension", () => {
    for (const [slug, c] of Object.entries(chars)) {
      for (const lvls of Object.values(c.stats)) {
        const keys = Object.keys(lvls).map(Number).sort((a, b) => a - b);
        for (let i = 1; i < keys.length; i++) expect(lvls[String(keys[i])][1], slug).toBeGreaterThanOrEqual(lvls[String(keys[i - 1])][1]);
      }
    }
  });
  // Known datamine anomaly (documented in docs/DATA.md): one Solar Flame param row has 4 entries instead of 5.
  const KNOWN_SHORT_RANKS = new Set(["solar-flame"]);
  it("weapons have R1-R5 params of equal length (except documented anomalies)", () => {
    for (const [slug, w] of Object.entries(weapons)) {
      if (KNOWN_SHORT_RANKS.has(slug)) continue;
      for (const row of w.ranks) expect(row.length, slug).toBe(5);
    }
  });
  it("the documented anomaly list stays accurate", () => {
    for (const slug of KNOWN_SHORT_RANKS) expect(weapons[slug].ranks.some((r) => r.length !== 5), slug).toBe(true);
  });
  it("engine label tables and LEVEL_ASC agree", () => {
    for (const l of [...CHAR_LEVELS, ...WEAPON_LEVELS]) expect(LEVEL_ASC[l.label], l.label).toBeTruthy();
  });
});

describe("engine uses exact datamined stats when available", () => {
  const exactChar: EngineChar = {
    slug: "jinhsi", name: "Jinhsi", element: "Spectro", weapon: "Broadblade", base: { hp: 1, atk: 1, def: 1 }, baseConfidence: "datamined", skills: [],
    levelStats: Object.fromEntries(Object.entries(LEVEL_ASC).map(([label, [a, l]]) => [label, chars.jinhsi.stats[String(a)][String(l)]])),
  };
  const wc = weapons["ages-of-harvest"];
  const exactWeapon: EngineWeapon = {
    slug: "ages-of-harvest", name: "Ages of Harvest", type: "Broadblade", rarity: 5, atk: 47, stat: "Crit. Rate", statValue: 5.4, effects: [],
    levelCurve: Object.fromEntries(Object.entries(LEVEL_ASC).map(([label, [a, l]]) => [label, wc.curve[String(a)][String(l)]])),
  };
  const input = (over: Partial<CalcInput> = {}): CalcInput => ({
    char: exactChar, charLv: CHAR_LEVELS.length - 1, weaponLv: WEAPON_LEVELS.length - 1, echoes: [], forte: ["none", "none"], effects: [], effectStacks: {},
    manual: { ...EMPTY_MANUAL }, enemy: { level: 90, res: 10, resShred: 0 }, skillLevel: 1, rotation: [], ...over,
  });
  it("Lv90 base HP/DEF equal the curve, ATK adds the weapon's curve ATK", () => {
    const s = computeStats(input({ weapon: exactWeapon }));
    expect(s.baseHp).toBeCloseTo(10825, 0);
    expect(s.baseDef).toBeCloseTo(1258.89, 1);
    expect(s.baseAtk).toBeCloseTo(412.5 + 587.5, 1);
  });
  it("weapon secondary stat comes from the curve (Crit. Rate 5% + 24.3%)", () => {
    expect(computeStats(input({ weapon: exactWeapon })).critRate).toBeCloseTo(5 + 24.3, 1);
  });
});
