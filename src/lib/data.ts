import charactersJson from "@/data/characters.json";
import weaponsJson from "@/data/weapons.json";
import echoesJson from "@/data/echoes.json";
import sonatasJson from "@/data/sonatas.json";
import eventsJson from "@/data/events.json";
import bannersJson from "@/data/banners.json";

export type Row = { label: string; kind: string; hits: [number, number][] };
export type Skill = {
  name: string;
  type: string;
  desc: string;
  rows: Row[];
  info: { label: string; value: string }[];
};
export type Character = {
  slug: string;
  name: string;
  rarity: number;
  element: string;
  weapon: string;
  class: string;
  roles: string[];
  title: string;
  realname: string;
  gender: string;
  birthday: string;
  birthplace: string;
  nation: string;
  affiliation: string;
  release: string;
  dish: string;
  obtain: string;
  voice: Record<string, string>;
  intro: string;
  base: { hp: number; atk: number; def: number };
  materials: { boss: string; local: string; common: string; weekly: string };
  skills: Skill[];
  chain: { level: number; name: string; desc: string }[];
  images: { card?: string; sprite?: string; splash?: string; icon?: string };
  limited?: boolean;
  statsEstimated?: boolean;
};
export type Buff = {
  stat: string;
  v: number[];
  always: boolean;
  stacks: number;
  text: string;
  el?: string;
  piece?: number;
};
export type Weapon = {
  name: string;
  slug: string;
  type: string;
  rarity: number;
  atk: number;
  stat: string;
  statValue: number;
  passive: string | null;
  ranks: string[];
  source: string;
  resonator: string;
  desc: string;
  icon: string | null;
  buffs: Buff[];
};
export type Echo = {
  no: string;
  name: string;
  slug: string;
  cost: number;
  class: string;
  sonatas: string[];
  skill: string;
  skillMax: string;
  icon: string | null;
};
export type Sonata = {
  name: string;
  slug: string;
  pieces: number[];
  effects: string[];
  icon: string | null;
  buffs: Buff[];
};
export type GameEvent = { name: string; version: string; start: string; end: string };
export type Banner = {
  name: string;
  type: string;
  version: string;
  start: string;
  end: string;
  featured: string[];
};

export const characters = charactersJson as unknown as Character[];
export const weapons = weaponsJson as unknown as Weapon[];
export const echoes = echoesJson as unknown as Echo[];
export const sonatas = sonatasJson as unknown as Sonata[];
export const events = eventsJson as unknown as GameEvent[];
export const banners = bannersJson as unknown as Banner[];

export const ELEMENTS = ["Glacio", "Fusion", "Electro", "Aero", "Spectro", "Havoc"] as const;
export const WEAPON_TYPES = ["Broadblade", "Sword", "Pistols", "Gauntlets", "Rectifier"] as const;

export const ELEMENT_COLOR: Record<string, string> = {
  Glacio: "#78bdd9",
  Fusion: "#e2704a",
  Electro: "#a583e0",
  Aero: "#55c9a0",
  Spectro: "#dcc660",
  Havoc: "#c9487f",
};

export function getCharacter(slug: string) {
  return characters.find((c) => c.slug === slug);
}
export function getWeapon(slug: string) {
  return weapons.find((w) => w.slug === slug);
}
export function charByName(name: string) {
  return characters.find((c) => c.name === name || c.name.startsWith(name));
}
export function weaponByName(name: string) {
  return weapons.find((w) => w.name === name);
}
export function sonataByName(name: string) {
  return sonatas.find((s) => s.name === name);
}
export function sortedCharacters() {
  return [...characters].sort((a, b) => b.rarity - a.rarity || a.name.localeCompare(b.name));
}
