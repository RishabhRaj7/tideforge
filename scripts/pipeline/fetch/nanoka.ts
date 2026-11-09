/**
 * nanoka.cc client (primary datamine source, see docs/DATA.md and docs/PERMISSIONS.md).
 *
 *   npm run data:fetch                 # live channel (default)
 *   npm run data:fetch -- --channel=latest
 *   npm run data:fetch -- --details=character,weapon
 *
 * Output (git-ignored): data/raw/nanoka/<version>/{character,weapon,echo,sonata,monster}.json
 *                       data/raw/nanoka/<version>/en/<kind>/<id>.json  (+ en/item.json)
 * Existing files are skipped, so re-runs are cheap. Delete a folder to force a refresh.
 */
import fs from "node:fs";
import path from "node:path";
import { getJson, pool } from "../lib/http";

export const NANOKA = "https://static.nanoka.cc";
export type Channel = "live" | "latest";
export type Kind = "character" | "weapon" | "echo" | "sonata" | "monster";

export interface Manifest {
  ww: { latest: string; live: string; available: string[] };
}

export const getManifest = () => getJson<Manifest>(`${NANOKA}/manifest.json`);

/**
 * `/Game/Aki/UI/<path>.<Name>` -> `<NANOKA>/assets/ww/<path>.webp`
 * (verified recipe, see docs/PLAN.md section 7.2)
 */
export const iconUrl = (icon: string) => `${NANOKA}/assets/ww/${icon.replace("/Game/Aki/UI/", "").replace(/\.[^./]+$/, "")}.webp`;

export const rawDir = (ver: string) => path.join(process.cwd(), "data/raw/nanoka", ver);

export async function resolveVersion(channel: Channel): Promise<string> {
  const m = await getManifest();
  return m.ww[channel];
}

export async function fetchIndex<T = Record<string, unknown>>(ver: string, kind: Kind): Promise<T> {
  const file = path.join(rawDir(ver), `${kind}.json`);
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  const data = await getJson<T>(`${NANOKA}/ww/${ver}/${kind}.json`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data));
  return data;
}

export async function fetchDetails(ver: string, kind: Exclude<Kind, "sonata">, ids: string[]) {
  const dir = path.join(rawDir(ver), "en", kind);
  fs.mkdirSync(dir, { recursive: true });
  const todo = ids.filter((id) => !fs.existsSync(path.join(dir, `${id}.json`)));
  let done = 0;
  await pool(todo, 4, 250, async (id) => {
    const d = await getJson(`${NANOKA}/ww/${ver}/en/${kind}/${id}.json`);
    fs.writeFileSync(path.join(dir, `${id}.json`), JSON.stringify(d));
    if (++done % 25 === 0) console.log(`  ${kind}: ${done}/${todo.length}`);
  });
  return { fetched: todo.length, skipped: ids.length - todo.length };
}

async function main() {
  const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split("=")[1];
  const channel = (arg("channel") ?? "live") as Channel;
  const details = (arg("details") ?? "character,weapon,echo").split(",") as Exclude<Kind, "sonata">[];
  const ver = await resolveVersion(channel);
  console.log(`nanoka ${channel} = ${ver}`);
  for (const kind of ["character", "weapon", "echo", "sonata", "monster"] as Kind[]) {
    const idx = await fetchIndex(ver, kind);
    console.log(`index ${kind}: ${Object.keys(idx).length}`);
    if (kind !== "sonata" && details.includes(kind)) console.log("  ", await fetchDetails(ver, kind, Object.keys(idx)));
  }
  const itemFile = path.join(rawDir(ver), "en/item.json");
  if (!fs.existsSync(itemFile)) fs.writeFileSync(itemFile, JSON.stringify(await getJson(`${NANOKA}/ww/${ver}/en/item.json`)));
  fs.writeFileSync(path.join(process.cwd(), "data/raw/nanoka/CURRENT"), ver);
  console.log("done");
}

if (process.argv[1]?.endsWith("nanoka.ts")) main().catch((e) => { console.error(e); process.exit(1); });
