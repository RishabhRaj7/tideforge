/**
 * Tideforge data pipeline: raw -> normalize -> validate -> generate.
 *   npm run data:build
 * Input : data/raw/*.json              (legacy wiki scrape; see docs/DATA.md)
 * Output: src/data/generated/*.json    (typed, validated, provenance-tagged) + report.json
 * Any zod failure aborts with a non-zero exit code.
 */
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { inferScaling, inferTag } from "../../src/engine/tags";
import {
  BannerSchema, CharacterSchema, EchoSchema, EventSchema, SonataSchema, WeaponSchema,
  type Banner, type Character, type PipelineIssue, type PipelineReport,
} from "../../src/data/schema";

const ROOT = path.resolve(__dirname, "../..");
const RAW = path.join(ROOT, "data/raw");
const OUT = path.join(ROOT, "src/data/generated");
const GAME_VERSION = "3.7";
const TODAY = new Date().toISOString().slice(0, 10);
const read = (f: string) => JSON.parse(fs.readFileSync(path.join(RAW, f), "utf8"));

const issues: PipelineIssue[] = [];
const fixes = new Map<string, number>();
const fixed = (label: string, n = 1) => fixes.set(label, (fixes.get(label) ?? 0) + n);
const issue = (severity: PipelineIssue["severity"], entity: string, code: string, message: string) => issues.push({ severity, entity, code, message });

// ---------- text cleaning ----------
const TYPOS: [RegExp, string][] = [[/\boull\b/g, "pull"], [/\bpoull\b/g, "pull"]];
/** Single-line field: drop wiki template leakage ("\n\n|key = value"), collapse whitespace. */
function line(s: unknown): string {
  const raw = String(s ?? "");
  const out = raw.split(/\n\s*\||\s\|\s*\w+\s*=/)[0].replace(/\s+/g, " ").trim();
  if (out !== raw.trim()) fixed("wiki template leakage removed from short text fields");
  return out;
}
/** Multi-line text: strip trailing template keys, wiki table pipes and typos. */
function text(s: unknown): string {
  let t = String(s ?? "").replace(/\n+\s*\|\s*\w+\s*=[\s\S]*$/, "").replace(/^\|\s*/gm, "").replace(/[ \t]{2,}/g, " ").trim();
  for (const [re, rep] of TYPOS) {
    if (re.test(t)) fixed("typos corrected (wiki text)");
    t = t.replace(re, rep);
  }
  return t;
}
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function isoDate(s: string): string {
  const m = s.match(/^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/);
  if (!m) return "";
  const mi = MONTHS.indexOf(m[1]);
  return mi < 0 ? "" : `${m[3]}-${String(mi + 1).padStart(2, "0")}-${m[2].padStart(2, "0")}`;
}
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// ---------- banners / events (also give us version start dates) ----------
const rawBanners = read("banners.json") as { name: string; type: string; version: string; start: string; end: string; featured: string[] }[];
const rawEvents = read("events.json") as { name: string; version: string; start: string; end: string }[];
const versionStart = new Map<string, string>();
for (const b of rawBanners) {
  const d = isoDate(b.start);
  if (d && (!versionStart.has(b.version) || d < versionStart.get(b.version)!)) versionStart.set(b.version, d);
}
const versionsByDate = [...versionStart.entries()].sort((a, b) => a[1].localeCompare(b[1]));
const versionAt = (iso: string): string | null => {
  const d = iso.length === 7 ? `${iso}-28` : iso;
  let v: string | null = null;
  for (const [ver, start] of versionsByDate) if (start <= d) v = ver;
  return v;
};

// ---------- characters ----------
const rawChars = read("characters.json") as Record<string, any>[];
const characters: Character[] = rawChars.map((c) => {
  const slug = String(c.slug);
  const release = (String(c.release ?? "").match(/^\d{4}-\d{2}(-\d{2})?/) ?? [""])[0];
  if (String(c.release ?? "").trim() !== release) fixed("wiki template leakage removed from short text fields");
  const skills = (c.skills as any[]).map((s) => ({
    name: line(s.name),
    type: String(s.type),
    desc: text(s.desc),
    rows: (s.rows as any[]).map((r) => ({
      label: line(r.label),
      kind: String(r.kind),
      hits: r.hits as [number, number][],
      scalesWith: inferScaling(String(r.label)),
      tag: inferTag(String(s.type), String(r.label)),
    })),
    info: (s.info ?? []).map((i: any) => ({ label: line(i.label), value: line(i.value) })),
  }));
  const rowCount = skills.reduce((a, s) => a + s.rows.length, 0);
  const est = Boolean(c.statsEstimated);
  const mats = c.materials ?? {};
  const out: Character = {
    slug,
    name: line(c.name),
    rarity: c.rarity,
    element: c.element,
    weapon: c.weapon,
    class: line(c.class),
    roles: (c.roles ?? []).map(line).filter(Boolean),
    title: line(c.title),
    realname: line(c.realname),
    gender: line(c.gender),
    birthday: line(c.birthday),
    birthplace: line(c.birthplace),
    nation: line(c.nation),
    affiliation: line(c.affiliation),
    release,
    releaseVersion: release ? versionAt(release) : null,
    dish: line(c.dish),
    obtain: line(c.obtain),
    voice: Object.fromEntries(Object.entries(c.voice ?? {}).map(([k, v]) => [k, line(v)])),
    intro: text(c.intro),
    base: c.base,
    materials: { boss: line(mats.boss), local: line(mats.local), common: line(mats.common), weekly: line(mats.weekly) },
    skills,
    chain: (c.chain ?? []).map((x: any) => ({ level: x.level, name: line(x.name), desc: text(x.desc) })),
    images: c.images ?? {},
    limited: c.limited,
    baseStatsConfidence: est ? "estimated" : "community",
    issues: [],
    provenance: { source: "wiki", sourceRef: "legacy scrape (data/raw/characters.json)", version: GAME_VERSION, confidence: est ? "estimated" : "community", verifiedAt: TODAY },
  };
  if (est) {
    out.issues.push("placeholder-base-stats");
    issue("error", slug, "placeholder-stats", `Base stats (${c.base.hp}/${c.base.atk}/${c.base.def}) are placeholders, not game data.`);
  }
  if (rowCount === 0) {
    out.issues.push("no-skill-rows");
    issue("error", slug, "no-skill-rows", "No damage multiplier rows; the calculator cannot compute this Resonator.");
  }
  if (!out.materials.boss || !out.materials.local || !out.materials.common) {
    out.issues.push("missing-materials");
    issue("warn", slug, "missing-materials", "Ascension material list is incomplete.");
  }
  if (!out.materials.weekly) out.issues.push("missing-weekly-material");
  if (!release) issue("warn", slug, "no-release-date", "Release date could not be parsed.");
  if (out.chain.length !== 6) issue("warn", slug, "chain", `Resonance Chain has ${out.chain.length} nodes (expected 6).`);
  if (out.rarity === 5 && rowCount > 0 && out.skills.filter((s) => ["Basic Attack", "Resonance Skill", "Resonance Liberation", "Intro Skill"].includes(s.type)).length < 4)
    issue("warn", slug, "skills", "Fewer than the four core skill types are present.");
  return out;
});
const charByName = (n: string) => characters.find((c) => c.name === n) ?? characters.find((c) => c.name.startsWith(n));

// ---------- weapons ----------
const NUM = /\d+(?:\.\d+)?/g;
function parsePassive(ranksRaw: string[]) {
  const first = ranksRaw[0] ?? "";
  let name = "";
  const ranks = [...ranksRaw];
  // Everything before the "Rank 1 2 3 4 5" header is wiki infobox text; the passive follows it.
  const hdr = first.match(/Rank\s+1\s+2\s+3\s+4\s+5\s*([\s\S]*)$/);
  if (hdr) {
    const m = hdr[1].match(/^\|\s*\n\s*\|\s*([^\n|]+)\n\s*\|\s*([\s\S]+)$/);
    if (m) {
      name = m[1].trim();
      ranks[0] = m[2];
      fixed("weapon passive name/rank text re-parsed from wiki table garbage");
    } else if (hdr[1].trim()) {
      ranks[0] = hdr[1].replace(/^\|\s*/, "");
      fixed("weapon passive text recovered without a name (incomplete wiki page)");
    }
  } else if (/\n\s*General\b/.test(first)) {
    ranks.length = 0;
    fixed("weapon entries with only wiki table header text (no passive) emptied");
  }
  const cleaned = ranks.map((r) => text(r));
  const tokens = cleaned.map((r) => r.match(NUM) ?? []);
  if (cleaned.length !== 5 || !tokens.every((t) => t.length === tokens[0].length)) return { name, ranks: cleaned, passive: null as null | { template: string; params: number[][] } };
  const varying: number[][] = [];
  const isVar = tokens[0].map((_, i) => tokens.some((t) => t[i] !== tokens[0][i]));
  isVar.forEach((v, i) => v && varying.push(tokens.map((t) => parseFloat(t[i]))));
  let idx = -1;
  let k = 0;
  const template = cleaned[0].replace(NUM, (tok) => {
    idx++;
    return isVar[idx] ? `{${k++}}` : tok;
  });
  return { name, ranks: cleaned, passive: { template, params: varying } };
}
const rawWeapons = read("weapons.json") as Record<string, any>[];
const weapons = rawWeapons.map((w) => {
  const p = parsePassive(w.ranks ?? []);
  const wIssues: string[] = [];
  if (!p.name) {
    wIssues.push("no-passive-name");
    issue("warn", w.name, "weapon-passive-name", "Passive name could not be parsed.");
  }
  if (!p.passive) {
    wIssues.push("no-rank-params");
    issue("warn", w.name, "weapon-rank-params", "Rank values could not be turned into structured parameters.");
  }
  const effects = (w.buffs ?? []).map((b: any) => ({ ...b, text: text(b.text) }));
  if (!effects.length) {
    wIssues.push("unmodelled-effects");
    issue("info", w.name, "weapon-no-effects", "Passive has no machine-readable effect; it contributes nothing to the calculator.");
  }
  const res = line(w.resonator);
  return {
    name: line(w.name),
    slug: String(w.slug),
    type: w.type,
    rarity: w.rarity,
    atk: w.atk,
    stat: w.stat,
    statValue: w.statValue,
    passive: p.passive ? { name: p.name || "Passive", ...p.passive } : null,
    ranks: p.ranks,
    source: line(w.source),
    resonator: res,
    resonatorSlug: res ? charByName(res)?.slug ?? null : null,
    desc: text(w.desc),
    icon: w.icon ?? null,
    effects,
    effectStatus: effects.length ? "modelled" : "unmodelled",
    issues: wIssues,
    provenance: { source: "wiki", sourceRef: "legacy scrape (data/raw/weapons.json)", version: GAME_VERSION, confidence: "community", verifiedAt: TODAY },
  };
});

// ---------- echoes / sonatas ----------
const echoes = (read("echoes.json") as Record<string, any>[]).map((e) => ({
  no: line(e.no),
  name: line(e.name),
  slug: String(e.slug),
  cost: e.cost,
  class: line(e.class),
  sonatas: (e.sonatas ?? []).map(line),
  skill: text(e.skill),
  skillMax: text(e.skillMax),
  icon: e.icon ?? null,
  provenance: { source: "wiki" as const, sourceRef: "legacy scrape (data/raw/echoes.json)", version: GAME_VERSION, confidence: "community" as const, verifiedAt: TODAY },
}));
const sonatas = (read("sonatas.json") as Record<string, any>[]).map((s) => {
  const buffs = (s.buffs ?? []).map((b: any) => ({ ...b, text: text(b.text) }));
  if (!buffs.length) issue("warn", s.name, "sonata-no-effects", "Set bonus has no machine-readable effect.");
  if (!s.icon) issue("info", s.name, "sonata-no-icon", "No icon.");
  return {
    name: line(s.name),
    slug: String(s.slug),
    pieces: s.pieces,
    effects: (s.effects ?? []).map(text),
    icon: s.icon ?? null,
    buffs,
    effectStatus: buffs.length ? ("modelled" as const) : ("unmodelled" as const),
    provenance: { source: "wiki" as const, sourceRef: "legacy scrape (data/raw/sonatas.json)", version: GAME_VERSION, confidence: "community" as const, verifiedAt: TODAY },
  };
});
for (const e of echoes) {
  if (![1, 3, 4].includes(e.cost)) issue("warn", e.name, "echo-cost", `Unexpected cost ${e.cost}.`);
  if (!e.sonatas.length) issue("info", e.name, "echo-no-sonata", "No Sonata set listed.");
}

// ---------- banners / events ----------
const banners: Banner[] = rawBanners.map((b) => {
  const kind = /Weapon/.test(b.type) ? "weapon" : /Resonator/.test(b.type) ? "resonator" : "standard";
  const featured = b.featured.map((n) => {
    const name = line(n);
    if (kind === "weapon") {
      const w = weapons.find((x) => x.name === name);
      if (!w) issue("info", b.name, "banner-featured", `Weapon "${name}" not in dataset yet.`);
      return { name, kind: w ? ("weapon" as const) : ("unknown" as const), slug: w?.slug ?? null };
    }
    const c = charByName(name);
    if (!c) issue("info", b.name, "banner-featured", `Resonator "${name}" not in dataset.`);
    return { name, kind: c ? ("character" as const) : ("unknown" as const), slug: c?.slug ?? null };
  });
  const start = isoDate(b.start), end = isoDate(b.end);
  if (!start || !end || start > end) issue("error", b.name, "banner-dates", `Invalid dates ${b.start} - ${b.end}.`);
  return { name: line(b.name), type: b.type, kind, version: b.version, start, end, featured, status: "official" as const };
});
const events = rawEvents.map((e) => {
  const name = line(e.name).replace(/\s\d{4}-\d{2}-\d{2}$/, "");
  if (name !== line(e.name)) fixed("date suffix removed from event names");
  const start = isoDate(e.start), end = /indefinite/i.test(e.end) ? "indefinite" : isoDate(e.end);
  if (!start || !end || (end !== "indefinite" && start > end)) issue("error", e.name, "event-dates", `Invalid dates ${e.start} - ${e.end}.`);
  return { name, version: e.version, start, end, status: "official" as const };
});

// ---------- validate ----------
const parse = <T extends z.ZodTypeAny>(label: string, schema: T, data: unknown[]) => {
  const res = z.array(schema).safeParse(data);
  if (!res.success) {
    console.error(`Validation failed for ${label}:`, JSON.stringify(res.error.issues.slice(0, 5), null, 2));
    process.exit(1);
  }
  return res.data as z.infer<T>[];
};
const vChars = parse("characters", CharacterSchema, characters);
const vWeapons = parse("weapons", WeaponSchema, weapons);
const vEchoes = parse("echoes", EchoSchema, echoes);
const vSonatas = parse("sonatas", SonataSchema, sonatas);
const vBanners = parse("banners", BannerSchema, banners);
const vEvents = parse("events", EventSchema, events);

// invariant: no parse leakage anywhere in user-visible strings
const LEAK = /\n\s*\||\|\s*\w+\s*=|\bRarity\b/;
let leaks = 0;
const scan = (entity: string, v: unknown) => {
  if (typeof v === "string") {
    if (LEAK.test(v)) {
      leaks++;
      issue("error", entity, "parse-leakage", `String still contains wiki markup: "${v.slice(0, 60)}"`);
    }
  } else if (Array.isArray(v)) v.forEach((x) => scan(entity, x));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => scan(entity, x));
};
vChars.forEach((c) => scan(c.slug, { ...c, issues: undefined }));
vWeapons.forEach((w) => scan(w.name, { ...w, issues: undefined }));
vEchoes.forEach((e) => scan(e.name, e));
vSonatas.forEach((s) => scan(s.name, s));

// ---------- write ----------
fs.mkdirSync(OUT, { recursive: true });
const write = (f: string, d: unknown) => fs.writeFileSync(path.join(OUT, f), JSON.stringify(d));
write("characters.json", vChars);
write("weapons.json", vWeapons);
write("echoes.json", vEchoes);
write("sonatas.json", vSonatas);
write("banners.json", vBanners);
write("events.json", vEvents);

const cnt = (xs: unknown[], f: (x: any) => boolean) => xs.filter(f).length;
const report: PipelineReport = {
  generatedAt: new Date().toISOString(),
  gameVersion: GAME_VERSION,
  counts: { characters: vChars.length, weapons: vWeapons.length, echoes: vEchoes.length, sonatas: vSonatas.length, banners: vBanners.length, events: vEvents.length, parseLeakage: leaks },
  coverage: [
    { label: "Resonators with real (non-placeholder) base stats", ok: cnt(vChars, (c) => c.baseStatsConfidence !== "estimated"), total: vChars.length },
    { label: "Resonators with calculator skill rows", ok: cnt(vChars, (c) => !c.issues.includes("no-skill-rows")), total: vChars.length },
    { label: "Resonators with complete ascension materials", ok: cnt(vChars, (c) => !c.issues.includes("missing-materials")), total: vChars.length },
    { label: "Resonators with a 6-node Resonance Chain", ok: cnt(vChars, (c) => c.chain.length === 6), total: vChars.length },
    { label: "Resonators with a parsed release version", ok: cnt(vChars, (c) => c.releaseVersion !== null), total: vChars.length },
    { label: "Weapons with a parsed passive name", ok: cnt(vWeapons, (w) => !w.issues.includes("no-passive-name")), total: vWeapons.length },
    { label: "Weapons with structured per-rank parameters", ok: cnt(vWeapons, (w) => w.passive !== null), total: vWeapons.length },
    { label: "Weapons whose passive is modelled in the calculator", ok: cnt(vWeapons, (w) => w.effectStatus === "modelled"), total: vWeapons.length },
    { label: "Sonata sets with machine-readable bonuses", ok: cnt(vSonatas, (s) => s.effectStatus === "modelled"), total: vSonatas.length },
    { label: "Banner featured entries linked to the dataset", ok: vBanners.flatMap((b) => b.featured).filter((f) => f.slug).length, total: vBanners.flatMap((b) => b.featured).length },
  ],
  fixes: [...fixes.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count),
  issues,
};
write("report.json", report);

console.log(`Pipeline OK: ${vChars.length} characters, ${vWeapons.length} weapons, ${vEchoes.length} echoes, ${vSonatas.length} sonatas, ${vBanners.length} banners, ${vEvents.length} events.`);
for (const c of report.coverage) console.log(`  ${c.ok}/${c.total}  ${c.label}`);
for (const f of report.fixes) console.log(`  fixed x${f.count}: ${f.label}`);
const errs = issues.filter((i) => i.severity === "error");
console.log(`  issues: ${errs.length} errors, ${issues.filter((i) => i.severity === "warn").length} warnings, ${issues.filter((i) => i.severity === "info").length} info`);
