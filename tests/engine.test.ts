import { describe, expect, it } from "vitest";
import {
  calculate, computeStats, copiesDistribution, critMultiplier, defMultiplier, EMPTY_MANUAL, firstFiveStar, inferScaling, inferTag, oneFeatured,
  resMultiplier, rowMultiplier, statWeights, summarize, type CalcInput, type EngineChar,
} from "../src/engine";

const char: EngineChar = {
  slug: "t", name: "Test", element: "Spectro", weapon: "Sword", base: { hp: 1000, atk: 100, def: 100 }, baseConfidence: "tested",
  skills: [],
};
const base = (over: Partial<CalcInput> = {}): CalcInput => ({
  char, charLv: 0, weaponLv: 0, echoes: [], forte: ["none", "none"], effects: [], effectStacks: {}, manual: { ...EMPTY_MANUAL },
  enemy: { level: 90, res: 10, resShred: 0 }, skillLevel: 1, attackerLevel: 90,
  rotation: [{ id: "a", label: "hit", tag: "skill", scalesWith: "atk", basePct: 100, count: 1 }], ...over,
});

describe("DEF zone", () => {
  it("matches the published formula", () => {
    // attacker 90 vs enemy 90 : 1520 / (1520 + 1512)
    expect(defMultiplier(90, 90)).toBeCloseTo(1520 / 3032, 10);
  });
  it("DEF ignore raises the multiplier", () => {
    expect(defMultiplier(90, 100, 20)).toBeGreaterThan(defMultiplier(90, 100, 0));
  });
  it("stays within (0, 2]", () => {
    for (const ig of [0, 50, 100, 200]) expect(defMultiplier(1, 200, ig)).toBeLessThanOrEqual(2);
    expect(defMultiplier(90, 150, 0)).toBeGreaterThan(0);
  });
});

describe("RES zone (all three branches)", () => {
  it("negative RES: 1 - r/2", () => expect(resMultiplier(-20)).toBeCloseTo(1.1, 10));
  it("normal RES: 1 - r", () => {
    expect(resMultiplier(10)).toBeCloseTo(0.9, 10);
    expect(resMultiplier(40)).toBeCloseTo(0.6, 10);
    expect(resMultiplier(0)).toBe(1);
  });
  it("RES >= 80%: 1/(1+5r)", () => {
    expect(resMultiplier(80)).toBeCloseTo(1 / 5, 10);
    expect(resMultiplier(100)).toBeCloseTo(1 / 6, 10);
  });
  it("is monotonic non-increasing", () => {
    let prev = Infinity;
    for (let r = -50; r <= 200; r += 5) {
      const m = resMultiplier(r);
      expect(m).toBeLessThanOrEqual(prev + 1e-12);
      prev = m;
    }
  });
});

describe("crit zone", () => {
  it("average uses CR capped at 100%", () => {
    expect(critMultiplier(50, 200, "average")).toBeCloseTo(1.5, 10);
    expect(critMultiplier(150, 200, "average")).toBeCloseTo(2, 10);
  });
  it("none/crit modes", () => {
    expect(critMultiplier(50, 200, "none")).toBe(1);
    expect(critMultiplier(50, 200, "crit")).toBe(2);
  });
});

describe("stats pipeline", () => {
  it("base crit stats are 5% / 150% / 100%", () => {
    const s = computeStats(base());
    expect([s.critRate, s.critDmg, s.er]).toEqual([5, 150, 100]);
  });
  it("final ATK = base × (1 + Σ%) + flat", () => {
    const s = computeStats(base({ manual: { ...EMPTY_MANUAL, atkPct: 50, atkFlat: 20 } }));
    expect(s.atk).toBeCloseTo(100 * 1.5 + 20, 10);
  });
});

describe("hit calculation", () => {
  it("equals the product of all zones", () => {
    const inp = base({ manual: { ...EMPTY_MANUAL, dmgBonus: 50, deepen: 20 } });
    const r = calculate(inp);
    const expected = 1 * 100 * 1.5 * 1.2 * defMultiplier(90, 90) * resMultiplier(10) * critMultiplier(5, 150, "average");
    expect(r.total).toBeCloseTo(expected, 8);
  });
  it("scales with HP when requested", () => {
    const hp = calculate(base({ rotation: [{ id: "a", label: "h", tag: "skill", scalesWith: "hp", basePct: 100, count: 1 }] }));
    const atk = calculate(base());
    expect(hp.total / atk.total).toBeCloseTo(10, 6);
  });
  it("more ATK never reduces damage (monotonic)", () => {
    let prev = 0;
    for (let a = 0; a <= 100; a += 10) {
      const t = calculate(base({ manual: { ...EMPTY_MANUAL, atkPct: a } })).total;
      expect(t).toBeGreaterThanOrEqual(prev);
      prev = t;
    }
  });
  it("skill level 10 multiplies by the curve", () => {
    expect(rowMultiplier([[50, 2]], 1)).toBeCloseTo(1, 10);
    expect(rowMultiplier([[50, 2]], 10)).toBeCloseTo(1.9881, 6);
  });
});

describe("stat weights", () => {
  it("crit stats are positive and ATK-only stats are skipped for HP scalers", () => {
    const w = statWeights(base({ manual: { ...EMPTY_MANUAL, critRate: 30 } }));
    expect(w.find((x) => x.stat === "critDmg")!.gain).toBeGreaterThan(0);
    const hp = statWeights(base({ rotation: [{ id: "a", label: "h", tag: "skill", scalesWith: "hp", basePct: 100, count: 1 }] }));
    expect(hp.find((x) => x.stat === "atkPct")).toBeUndefined();
    expect(hp.find((x) => x.stat === "hpPct")).toBeDefined();
  });
});

describe("tag + scaling inference", () => {
  it("maps skill types", () => {
    expect(inferTag("Basic Attack", "Heavy Attack Damage")).toBe("heavy");
    expect(inferTag("Resonance Liberation", "x")).toBe("lib");
    expect(inferTag("Forte Circuit", "Basic stuff")).toBe("basic");
  });
  it("detects HP / DEF scaling in labels", () => {
    expect(inferScaling("Skill DMG (%DEF)")).toBe("def");
    expect(inferScaling("Damage (%HP)")).toBe("hp");
    expect(inferScaling("Part 1 Damage")).toBe("atk");
  });
});

describe("convene model", () => {
  it("is a proper distribution ending at hard pity", () => {
    const d = firstFiveStar(0);
    expect(d.length - 1).toBe(80);
    expect(d.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9);
  });
  it("featured Resonator takes longer than a guaranteed one", () => {
    const g = summarize(oneFeatured(0, true, "resonator", "community"), 0).expected;
    const u = summarize(oneFeatured(0, false, "resonator", "community"), 0).expected;
    expect(u).toBeGreaterThan(g);
  });
  it("weapon banner ignores the 50/50", () => {
    expect(summarize(oneFeatured(0, false, "weapon", "community"), 0).expected).toBeCloseTo(summarize(oneFeatured(0, true, "weapon", "community"), 0).expected, 9);
  });
  it("probability within 160 pulls for 1 copy is ~100% and never exceeds 1", () => {
    const s = summarize(copiesDistribution(0, true, 1, "resonator", "community"), 160);
    expect(s.chance).toBeGreaterThan(0.999);
    expect(s.chance).toBeLessThanOrEqual(1);
  });
  it("conservative model is no faster than the community fit", () => {
    const a = summarize(oneFeatured(0, true, "resonator", "community"), 0).expected;
    const b = summarize(oneFeatured(0, true, "resonator", "conservative"), 0).expected;
    expect(b).toBeGreaterThanOrEqual(a);
  });
});
