/**
 * Mirror game art once into public/img (never hot-linked at runtime).
 *
 *   npm run data:images
 *
 * Paths match what the generated dataset already references:
 *   /img/characters/<slug>-icon.webp   (IconRoleHead256)
 *   /img/characters/<slug>-card.webp   (IconRolePile portrait)
 *   /img/weapons/<slug>.webp           /img/echoes/<slug>.webp
 *   /img/sonatas/<slug>.webp           /img/elements/<element>.webp
 * Writes src/data/generated/images.json (coverage manifest, small, committed).
 * public/img itself is git-ignored; run this script after cloning (docs/ARCHITECTURE.md).
 */
import fs from "node:fs";
import path from "node:path";
import { request, pool } from "../lib/http";
import { fetchIndex, iconUrl, resolveVersion, type Channel } from "./nanoka";

const ROOT = process.cwd();
const gen = <T>(n: string): T[] => JSON.parse(fs.readFileSync(path.join(ROOT, "src/data/generated", n + ".json"), "utf8"));
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

interface Named { name: string; slug: string }
interface CharIdx { en: string; icon: string; background: string; element: number }
interface WpnIdx { en: string; icon: string }
interface SonIdx { name: { en: string }; icon: string }

const ELEMENT_ICON: Record<string, string> = {
  Glacio: "Ice", Fusion: "Fire", Electro: "Thunder", Aero: "Wind", Spectro: "Light", Havoc: "Dark",
};

interface Job { file: string; url: string; kind: string; key: string }

async function main() {
  const channel = (process.argv.find((a) => a.startsWith("--channel="))?.split("=")[1] ?? "live") as Channel;
  const ver = await resolveVersion(channel);
  console.log(`images from nanoka ${channel} ${ver}`);
  const [chars, weapons, echoes, sonatas] = await Promise.all([
    fetchIndex<Record<string, CharIdx>>(ver, "character"),
    fetchIndex<Record<string, WpnIdx>>(ver, "weapon"),
    fetchIndex<Record<string, WpnIdx & { code: string }>>(ver, "echo"),
    fetchIndex<Record<string, SonIdx>>(ver, "sonata"),
  ]);

  const byName = <T>(idx: Record<string, T>, nameOf: (v: T) => string) => {
    const m = new Map<string, T>();
    for (const v of Object.values(idx)) if (!m.has(norm(nameOf(v)))) m.set(norm(nameOf(v)), v);
    return m;
  };
  const jobs: Job[] = [];
  const missing: Record<string, string[]> = { characters: [], weapons: [], echoes: [], sonatas: [] };
  const out = (...p: string[]) => path.join(ROOT, "public/img", ...p);

  const cm = byName(chars, (v) => v.en);
  for (const c of gen<Named>("characters")) {
    const hit = cm.get(norm(c.name));
    if (!hit) { missing.characters.push(c.slug); continue; }
    jobs.push({ kind: "characters", key: `${c.slug}-icon`, file: out("characters", `${c.slug}-icon.webp`), url: iconUrl(hit.icon) });
    jobs.push({ kind: "characters", key: `${c.slug}-card`, file: out("characters", `${c.slug}-card.webp`), url: iconUrl(hit.background) });
  }
  const wm = byName(weapons, (v) => v.en);
  for (const w of gen<Named>("weapons")) {
    const hit = wm.get(norm(w.name));
    if (!hit) { missing.weapons.push(w.slug); continue; }
    jobs.push({ kind: "weapons", key: w.slug, file: out("weapons", `${w.slug}.webp`), url: iconUrl(hit.icon) });
  }
  const em = byName(echoes, (v) => v.en);
  for (const e of gen<Named>("echoes")) {
    const hit = em.get(norm(e.name));
    if (!hit) { missing.echoes.push(e.slug); continue; }
    jobs.push({ kind: "echoes", key: e.slug, file: out("echoes", `${e.slug}.webp`), url: iconUrl(hit.icon) });
  }
  const sm = byName(sonatas, (v) => v.name.en);
  for (const s of gen<Named>("sonatas")) {
    const hit = sm.get(norm(s.name));
    if (!hit) { missing.sonatas.push(s.slug); continue; }
    jobs.push({ kind: "sonatas", key: s.slug, file: out("sonatas", `${s.slug}.webp`), url: iconUrl(hit.icon) });
  }
  // Element icons: the base-element Sonata sets carry the plain element icon.
  for (const [el, token] of Object.entries(ELEMENT_ICON)) {
    const hit = Object.values(sonatas).find((s) => s.icon.endsWith(`T_IconElementAttri${token}.T_IconElementAttri${token}`));
    if (hit) jobs.push({ kind: "elements", key: el.toLowerCase(), file: out("elements", `${el.toLowerCase()}.webp`), url: iconUrl(hit.icon) });
  }

  let ok = 0, skipped = 0;
  const failed: string[] = [];
  await pool(jobs, 6, 40, async (j) => {
    if (fs.existsSync(j.file) && fs.statSync(j.file).size > 0) { skipped++; return; }
    try {
      const buf = Buffer.from(await (await request(j.url)).arrayBuffer());
      fs.mkdirSync(path.dirname(j.file), { recursive: true });
      fs.writeFileSync(j.file, buf);
      ok++;
    } catch {
      failed.push(`${j.kind}/${j.key}`);
    }
  });

  const count = (kind: string) => jobs.filter((j) => j.kind === kind && fs.existsSync(j.file)).length;
  const manifest = {
    generatedAt: new Date().toISOString().slice(0, 10),
    source: "nanoka.cc",
    version: ver,
    files: Object.fromEntries(["characters", "weapons", "echoes", "sonatas", "elements"].map((k) => [k, count(k)])),
    unmatched: missing,
    failed,
  };
  fs.writeFileSync(path.join(ROOT, "src/data/generated/images.json"), JSON.stringify(manifest, null, 2) + "\n");
  console.log(`downloaded ${ok}, already present ${skipped}, failed ${failed.length}`);
  console.log(manifest.files, "unmatched:", missing);
  if (failed.length) process.exitCode = 1;
}

main().catch((e) => { console.error(e); process.exit(1); });
