// Data contracts shared by the pipeline (scripts/pipeline) and the app (src/server/repos).
import { z } from "zod";

export const Confidence = z.enum(["datamined", "official", "tested", "community", "estimated"]);

export const Provenance = z.object({
  source: z.enum(["datamine", "official", "encore", "wiki", "tested", "community", "editorial"]),
  sourceRef: z.string(),
  version: z.string(),
  confidence: Confidence,
  verifiedAt: z.string(),
});

const Row = z.object({
  label: z.string(),
  kind: z.enum(["dmg", "heal"]).or(z.string()),
  hits: z.array(z.tuple([z.number(), z.number()])),
  scalesWith: z.enum(["atk", "hp", "def"]),
  tag: z.enum(["basic", "heavy", "skill", "lib", "intro", "outro", "echoSkill"]),
});

export const CharacterSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  rarity: z.number().int().min(4).max(5),
  element: z.enum(["Glacio", "Fusion", "Electro", "Aero", "Spectro", "Havoc"]),
  weapon: z.enum(["Broadblade", "Sword", "Pistols", "Gauntlets", "Rectifier"]),
  class: z.string(),
  roles: z.array(z.string()),
  title: z.string(),
  realname: z.string(),
  gender: z.string(),
  birthday: z.string(),
  birthplace: z.string(),
  nation: z.string(),
  affiliation: z.string(),
  release: z.string(), // ISO date (yyyy-mm-dd) or yyyy-mm
  releaseVersion: z.string().nullable(),
  dish: z.string(),
  obtain: z.string(),
  voice: z.record(z.string(), z.string()),
  intro: z.string(),
  base: z.object({ hp: z.number(), atk: z.number(), def: z.number() }),
  materials: z.object({ boss: z.string(), local: z.string(), common: z.string(), weekly: z.string() }),
  skills: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
      desc: z.string(),
      rows: z.array(Row),
      info: z.array(z.object({ label: z.string(), value: z.string() })),
    }),
  ),
  chain: z.array(z.object({ level: z.number(), name: z.string(), desc: z.string() })),
  images: z.object({ card: z.string().optional(), sprite: z.string().optional(), splash: z.string().optional(), icon: z.string().optional() }),
  limited: z.boolean().optional(),
  baseStatsConfidence: Confidence,
  issues: z.array(z.string()),
  provenance: Provenance,
});
export type Character = z.infer<typeof CharacterSchema>;

const Effect = z.object({
  stat: z.string(),
  v: z.array(z.number()),
  always: z.boolean(),
  stacks: z.number(),
  text: z.string(),
  el: z.string().optional(),
  piece: z.number().optional(),
});

export const WeaponSchema = z.object({
  name: z.string(),
  slug: z.string(),
  type: z.string(),
  rarity: z.number(),
  atk: z.number(),
  stat: z.string(),
  statValue: z.number(),
  passive: z
    .object({
      name: z.string(),
      template: z.string(),
      /** params[i][r] = value of the i-th varying number at rank r+1 */
      params: z.array(z.array(z.number())),
    })
    .nullable(),
  ranks: z.array(z.string()),
  source: z.string(),
  resonator: z.string(),
  resonatorSlug: z.string().nullable(),
  desc: z.string(),
  icon: z.string().nullable(),
  effects: z.array(Effect),
  effectStatus: z.enum(["modelled", "unmodelled"]),
  issues: z.array(z.string()),
  provenance: Provenance,
});
export type Weapon = z.infer<typeof WeaponSchema>;

export const EchoSchema = z.object({
  no: z.string(),
  name: z.string(),
  slug: z.string(),
  cost: z.number(),
  class: z.string(),
  sonatas: z.array(z.string()),
  skill: z.string(),
  skillMax: z.string(),
  icon: z.string().nullable(),
  provenance: Provenance,
});
export type Echo = z.infer<typeof EchoSchema>;

export const SonataSchema = z.object({
  name: z.string(),
  slug: z.string(),
  pieces: z.array(z.number()),
  effects: z.array(z.string()),
  icon: z.string().nullable(),
  buffs: z.array(Effect),
  effectStatus: z.enum(["modelled", "unmodelled"]),
  provenance: Provenance,
});
export type Sonata = z.infer<typeof SonataSchema>;

export const BannerSchema = z.object({
  name: z.string(),
  type: z.string(),
  kind: z.enum(["resonator", "weapon", "standard"]),
  version: z.string(),
  start: z.string(), // ISO yyyy-mm-dd
  end: z.string(),
  featured: z.array(z.object({ name: z.string(), kind: z.enum(["character", "weapon", "unknown"]), slug: z.string().nullable() })),
  status: z.enum(["official", "leak", "projected"]),
});
export type Banner = z.infer<typeof BannerSchema>;

export const EventSchema = z.object({ name: z.string(), version: z.string(), start: z.string(), end: z.string(), status: z.enum(["official", "leak", "projected"]) });
export type GameEvent = z.infer<typeof EventSchema>;

export type PipelineIssue = { severity: "error" | "warn" | "info"; entity: string; code: string; message: string };
export type PipelineReport = {
  generatedAt: string;
  gameVersion: string;
  counts: Record<string, number>;
  coverage: { label: string; ok: number; total: number }[];
  fixes: { label: string; count: number }[];
  issues: PipelineIssue[];
};
