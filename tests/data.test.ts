import { describe, expect, it } from "vitest";
import chars from "../src/data/generated/characters.json";
import weapons from "../src/data/generated/weapons.json";
import banners from "../src/data/generated/banners.json";
import { BannerSchema, CharacterSchema, WeaponSchema } from "../src/data/schema";

describe("generated dataset invariants", () => {
  it("validates against the zod contracts", () => {
    for (const c of chars) expect(CharacterSchema.safeParse(c).success, c.slug).toBe(true);
    for (const w of weapons) expect(WeaponSchema.safeParse(w).success, w.name).toBe(true);
    for (const b of banners) expect(BannerSchema.safeParse(b).success, b.name).toBe(true);
  });
  it("has no wiki markup leakage in visible text", () => {
    const bad = /\n\s*\||\|\s*\w+\s*=|\bRarity\b/;
    for (const c of chars) for (const v of [c.name, c.title, c.intro, c.dish, c.release, c.affiliation]) expect(bad.test(v), `${c.slug}: ${v}`).toBe(false);
    for (const w of weapons) for (const r of w.ranks) expect(bad.test(r), w.name).toBe(false);
  });
  it("weapon passives have names and per-rank parameters", () => {
    const ok = weapons.filter((w) => w.passive && w.passive.params.length > 0 && w.passive.params.every((p) => p.length === 5));
    expect(ok.length).toBeGreaterThanOrEqual(110);
    expect(weapons.every((w) => w.passive?.name !== "Rarity")).toBe(true);
  });
  it("placeholder stats are always flagged, never silent", () => {
    for (const c of chars) if (c.base.hp === 900 && c.base.atk === 33 && c.base.def === 96) expect(c.baseStatsConfidence).toBe("estimated");
  });
  it("release strings are ISO dates", () => {
    for (const c of chars) expect(/^\d{4}-\d{2}(-\d{2})?$/.test(c.release), c.slug).toBe(true);
  });
});
