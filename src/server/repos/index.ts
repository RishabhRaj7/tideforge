import "server-only";
// Read models over the generated dataset. Client code must never import the JSON directly (keeps ~1.5 MB out of bundles).
import charactersJson from "@/data/generated/characters.json";
import weaponsJson from "@/data/generated/weapons.json";
import echoesJson from "@/data/generated/echoes.json";
import sonatasJson from "@/data/generated/sonatas.json";
import bannersJson from "@/data/generated/banners.json";
import eventsJson from "@/data/generated/events.json";
import reportJson from "@/data/generated/report.json";
import charCurvesJson from "@/data/generated/curves/characters.json";
import weaponCurvesJson from "@/data/generated/curves/weapons.json";
import nanokaReportJson from "@/data/generated/nanoka-report.json";
import imagesReportJson from "@/data/generated/images.json";
import { LEVEL_ASC } from "@/engine/constants";
import type { Banner, Character, Echo, GameEvent, PipelineReport, Sonata, Weapon } from "@/data/schema";
import type { EngineChar, EngineSonata, EngineWeapon, Element } from "@/engine/types";

const characters = charactersJson as unknown as Character[];
const weapons = weaponsJson as unknown as Weapon[];
const echoes = echoesJson as unknown as Echo[];
const sonatas = sonatasJson as unknown as Sonata[];
const banners = bannersJson as unknown as Banner[];
const events = eventsJson as unknown as GameEvent[];

import versionJson from "@/data/version.json";
export const GAME_VERSION: string = versionJson.live;

export type CharacterCard = Pick<Character, "slug" | "name" | "rarity" | "element" | "weapon" | "roles" | "release" | "releaseVersion" | "images" | "title" | "limited" | "baseStatsConfidence"> & { hasRows: boolean };

const toCard = (c: Character): CharacterCard => ({
  slug: c.slug, name: c.name, rarity: c.rarity, element: c.element, weapon: c.weapon, roles: c.roles, release: c.release,
  releaseVersion: c.releaseVersion, images: c.images, title: c.title, limited: c.limited, baseStatsConfidence: c.baseStatsConfidence,
  hasRows: !c.issues.includes("no-skill-rows"),
});

export const listCharacters = () => characters;
export const listCharacterCards = () => [...characters].sort((a, b) => b.rarity - a.rarity || a.name.localeCompare(b.name)).map(toCard);
export const getCharacter = (slug: string) => characters.find((c) => c.slug === slug);
export const charByName = (n: string) => characters.find((c) => c.name === n) ?? characters.find((c) => c.name.startsWith(n));

export const listWeapons = () => weapons;
export const getWeapon = (slug: string) => weapons.find((w) => w.slug === slug);
export const weaponsFor = (c: Character) => weapons.filter((w) => w.type === c.weapon).sort((a, b) => b.rarity - a.rarity || b.atk - a.atk);
export const signatureWeapon = (c: Character) => weapons.find((w) => w.resonatorSlug === c.slug);

export const listEchoes = () => echoes;
export const getEcho = (slug: string) => echoes.find((e) => e.slug === slug);
export const listSonatas = () => sonatas;
export const getSonata = (slug: string) => sonatas.find((s) => s.slug === slug);
export const listBanners = () => banners;
export const listEvents = () => events;
export const getReport = () => reportJson as unknown as PipelineReport;

// ---- time helpers (server time: Asia UTC+8, approximate; see /methodology) ----
export const startMs = (iso: string) => Date.parse(`${iso}T00:00:00+08:00`);
export const endMs = (iso: string) => (iso === "indefinite" ? Infinity : Date.parse(`${iso}T23:59:59+08:00`));

export function bannerStatus(b: { start: string; end: string }, now = Date.now()): "live" | "upcoming" | "ended" {
  if (now < startMs(b.start)) return "upcoming";
  if (now > endMs(b.end)) return "ended";
  return "live";
}

/** Live banners; if nothing is live (between versions) fall back to the most recent window and flag it. */
export function currentBanners(now = Date.now()) {
  const live = banners.filter((b) => bannerStatus(b, now) === "live");
  if (live.length) return { banners: live, live: true };
  const past = banners.filter((b) => bannerStatus(b, now) === "ended").sort((a, b) => b.end.localeCompare(a.end));
  const last = past[0]?.end;
  return { banners: past.filter((b) => b.end === last), live: false };
}
export const upcomingBanners = (now = Date.now()) => banners.filter((b) => bannerStatus(b, now) === "upcoming");

export function liveEvents(now = Date.now()) {
  return events
    .filter((e) => now >= startMs(e.start) && now <= endMs(e.end) && e.end !== "indefinite")
    .sort((a, b) => a.end.localeCompare(b.end));
}

export function versions() {
  const m = new Map<string, { version: string; start: string; end: string }>();
  for (const b of banners) {
    const v = m.get(b.version);
    if (!v) m.set(b.version, { version: b.version, start: b.start, end: b.end });
    else {
      if (b.start < v.start) v.start = b.start;
      if (b.end > v.end) v.end = b.end;
    }
  }
  return [...m.values()].sort((a, b) => b.start.localeCompare(a.start));
}

// ---- engine DTOs ----
type CharCurve = { stats: Record<string, Record<string, [number, number, number]>> };
type WeaponCurve = { curve: Record<string, Record<string, [number, number]>> };
const charCurves = charCurvesJson as unknown as Record<string, CharCurve>;
const weaponCurves = weaponCurvesJson as unknown as Record<string, WeaponCurve>;

/** Datamined stats re-keyed by the engine's level labels ("20 (asc.)", "90", ...). */
function pickLevels<T>(curve: Record<string, Record<string, T>> | undefined): Record<string, T> | undefined {
  if (!curve) return undefined;
  const out: Record<string, T> = {};
  for (const [label, [asc, lv]] of Object.entries(LEVEL_ASC)) {
    const v = curve[String(asc)]?.[String(lv)];
    if (v) out[label] = v;
  }
  return Object.keys(out).length === Object.keys(LEVEL_ASC).length ? out : undefined;
}

export function toEngineChar(c: Character): EngineChar {
  const levelStats = pickLevels(charCurves[c.slug]?.stats);
  return {
    slug: c.slug, name: c.name, element: c.element as Element, weapon: c.weapon, base: c.base,
    baseConfidence: levelStats ? "datamined" : c.baseStatsConfidence,
    levelStats,
    skills: c.skills.map((s) => ({ name: s.name, type: s.type, rows: s.rows.filter((r) => r.kind === "dmg").map((r) => ({ ...r, kind: r.kind })) })),
  };
}
export const toEngineWeapon = (w: Weapon): EngineWeapon => ({
  slug: w.slug, name: w.name, type: w.type, rarity: w.rarity, atk: w.atk, stat: w.stat, statValue: w.statValue, effects: w.effects,
  levelCurve: pickLevels(weaponCurves[w.slug]?.curve),
});
export const nanokaReport = () => nanokaReportJson;
export const imagesReport = () => imagesReportJson;
export const toEngineSonata = (s: Sonata): EngineSonata => ({ name: s.name, pieces: s.pieces, effects: s.buffs });

export function engineGear() {
  return { weapons: weapons.map(toEngineWeapon), sonatas: sonatas.map(toEngineSonata) };
}

export function searchIndex() {
  const docs: { id: string; title: string; kind: string; href: string; hint: string }[] = [];
  for (const c of characters) docs.push({ id: `c:${c.slug}`, title: c.name, kind: "Resonator", href: `/characters/${c.slug}`, hint: `${c.element} · ${c.weapon} · ${c.rarity}★ ${c.title}` });
  for (const w of weapons) docs.push({ id: `w:${w.slug}`, title: w.name, kind: "Weapon", href: `/weapons/${w.slug}`, hint: `${w.type} · ${w.rarity}★ · ${w.passive?.name ?? ""}` });
  for (const e of echoes) docs.push({ id: `e:${e.slug}`, title: e.name, kind: "Echo", href: `/echoes/${e.slug}`, hint: `${e.cost}-cost · ${e.class}` });
  for (const s of sonatas) docs.push({ id: `s:${s.slug}`, title: s.name, kind: "Sonata", href: `/sonatas/${s.slug}`, hint: `${s.pieces.join("/")}pc` });
  const tools = [
    ["Damage Calculator", "/calculator", "damage dps build stats"],
    ["Convene Planner", "/convene", "pity gacha pull probability astrite"],
    ["Tier List", "/tier-list", "meta ranking best"],
    ["Banners", "/banners", "current upcoming banner rerun"],
    ["Events & Calendar", "/events", "event calendar"],
    ["Patches", "/patches", "version changes"],
    ["Materials", "/materials", "ascension farming boss"],
    ["Glossary", "/glossary", "terms concerto forte"],
    ["Methodology", "/methodology", "formula damage accuracy"],
    ["Data Status", "/data-status", "quality coverage confidence"],
  ];
  for (const [title, href, hint] of tools) docs.push({ id: `t:${href}`, title, kind: "Page", href, hint });
  return docs;
}
