/**
 * Datamined curves -> committed, compact JSON (replaces the estimated CHAR_LEVELS / WEAPON_LEVELS / skill curve).
 *
 *   npm run data:curves      (needs `npm run data:fetch` first)
 *
 * Output:
 *   src/data/generated/curves/characters.json   { [slug]: { id, stats: { asc: { level: [hp, atk, def] } } } }
 *   src/data/generated/curves/weapons.json      { [slug]: { id, sub, curve: { asc: { level: [atk, sub] } }, ranks: string[][] } }
 *   src/data/generated/skill-levels/<slug>.json per-level skill multiplier rows (parsed by parse/multipliers.ts)
 *   src/data/generated/nanoka-report.json       coverage summary shown on /data-status
 */
import fs from "node:fs";
import path from "node:path";
import { parseMultiplier, type Multiplier } from "../parse/multipliers";
import { stripMarkup } from "../parse/markup";
import { rawDir } from "../fetch/nanoka";

const ROOT = process.cwd();
const GEN = path.join(ROOT, "src/data/generated");
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const readJson = <T>(p: string): T => JSON.parse(fs.readFileSync(p, "utf8"));
const r4 = (n: number) => Math.round(n * 1e4) / 1e4;

interface Named { name: string; slug: string }
type StatRow = { life: number; atk: number; def: number };
type WeaponStat = { name: string; value: number; is_ratio: boolean; is_percent: boolean };
type SkillLevel = { name: string; param: string[][]; format: string | null };
type SkillNode = { node_type: number; skill?: { name: string; desc?: string; type: string; icon?: string; level?: Record<string, SkillLevel> } };

export interface SkillRow { name: string; mult: Multiplier[]; extra: string[][] }
export interface SkillLevels { slug: string; id: string; skills: { node: string; type: string; name: string; desc: string; rows: SkillRow[] }[] }

function version(): string {
  const f = path.join(ROOT, "data/raw/nanoka/CURRENT");
  if (!fs.existsSync(f)) throw new Error("No nanoka data. Run `npm run data:fetch` first.");
  return fs.readFileSync(f, "utf8").trim();
}

export function buildCharacterCurves(ver: string, ours: Named[]) {
  const dir = rawDir(ver);
  const idx = readJson<Record<string, { en: string }>>(path.join(dir, "character.json"));
  const byName = new Map<string, string>();
  for (const [id, v] of Object.entries(idx)) if (!byName.has(norm(v.en))) byName.set(norm(v.en), id);
  const curves: Record<string, unknown> = {};
  const unmatched: string[] = [];
  let rowsTotal = 0;
  fs.mkdirSync(path.join(GEN, "skill-levels"), { recursive: true });
  for (const c of ours) {
    const id = byName.get(norm(c.name));
    if (!id) { unmatched.push(c.slug); continue; }
    const d = readJson<{ stats: Record<string, Record<string, StatRow>>; skill_trees: Record<string, SkillNode> }>(path.join(dir, "en/character", `${id}.json`));
    const stats: Record<string, Record<string, [number, number, number]>> = {};
    for (const [asc, lvls] of Object.entries(d.stats)) {
      stats[asc] = {};
      for (const [lv, s] of Object.entries(lvls)) stats[asc][lv] = [r4(s.life), r4(s.atk), r4(s.def)];
    }
    curves[c.slug] = { id: Number(id), stats };

    const skills: SkillLevels["skills"] = [];
    for (const [node, tree] of Object.entries(d.skill_trees)) {
      const s = tree.skill;
      if (!s?.level || !Object.keys(s.level).length) continue;
      const rows: SkillRow[] = Object.values(s.level).map((l) => ({
        name: stripMarkup(l.name),
        mult: (l.param[0] ?? []).map(parseMultiplier),
        extra: l.param.slice(1),
      }));
      rowsTotal += rows.length;
      skills.push({ node, type: s.type, name: stripMarkup(s.name), desc: stripMarkup(s.desc ?? ""), rows });
    }
    const out: SkillLevels = { slug: c.slug, id, skills };
    fs.writeFileSync(path.join(GEN, "skill-levels", `${c.slug}.json`), JSON.stringify(out));
  }
  return { curves, unmatched, rowsTotal };
}

export function buildWeaponCurves(ver: string, ours: Named[]) {
  const dir = rawDir(ver);
  const idx = readJson<Record<string, { en: string }>>(path.join(dir, "weapon.json"));
  const byName = new Map<string, string>();
  for (const [id, v] of Object.entries(idx)) if (!byName.has(norm(v.en))) byName.set(norm(v.en), id);
  const curves: Record<string, unknown> = {};
  const unmatched: string[] = [];
  for (const w of ours) {
    const id = byName.get(norm(w.name));
    if (!id) { unmatched.push(w.slug); continue; }
    const d = readJson<{ stats: Record<string, Record<string, WeaponStat[]>>; param: string[][] }>(path.join(dir, "en/weapon", `${id}.json`));
    let sub = "";
    const curve: Record<string, Record<string, [number, number]>> = {};
    for (const [asc, lvls] of Object.entries(d.stats)) {
      curve[asc] = {};
      for (const [lv, rows] of Object.entries(lvls)) {
        const flat = rows.find((r) => r.name === "ATK" && !r.is_ratio);
        const other = rows.find((r) => r !== flat);
        if (other) sub = other.name;
        // Units: is_ratio -> fraction (0.0855 = 8.55%), is_percent -> hundredths (4860 = 48.6%).
        const subValue = !other ? 0 : other.is_ratio ? other.value * 100 : other.is_percent ? other.value / 100 : other.value;
        curve[asc][lv] = [r4(flat?.value ?? 0), r4(subValue)];
      }
    }
    curves[w.slug] = { id: Number(id), sub, curve, ranks: d.param ?? [] };
  }
  return { curves, unmatched };
}

function main() {
  const ver = version();
  const chars = readJson<Named[]>(path.join(GEN, "characters.json"));
  const weapons = readJson<Named[]>(path.join(GEN, "weapons.json"));
  fs.mkdirSync(path.join(GEN, "curves"), { recursive: true });
  const c = buildCharacterCurves(ver, chars);
  const w = buildWeaponCurves(ver, weapons);
  fs.writeFileSync(path.join(GEN, "curves/characters.json"), JSON.stringify(c.curves));
  fs.writeFileSync(path.join(GEN, "curves/weapons.json"), JSON.stringify(w.curves));
  const report = {
    generatedAt: new Date().toISOString().slice(0, 10),
    source: "nanoka.cc",
    version: ver,
    characters: { ours: chars.length, withRealCurves: Object.keys(c.curves).length, unmatched: c.unmatched, skillRows: c.rowsTotal },
    weapons: { ours: weapons.length, withRealCurves: Object.keys(w.curves).length, unmatched: w.unmatched },
  };
  fs.writeFileSync(path.join(GEN, "nanoka-report.json"), JSON.stringify(report, null, 2) + "\n");
  console.log(report);
}

if (process.argv[1]?.endsWith("curves.ts")) main();
