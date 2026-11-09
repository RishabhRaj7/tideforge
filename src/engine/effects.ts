// Effects: normalised buffs coming from weapons and Sonata sets. See docs/METHODOLOGY (Effects DSL, simplified v1).
import type { Confidence, DmgTag, Effect, EffectZone, EngineChar, EngineSonata, EngineWeapon, StatKey } from "./types";

const STAT_KEYS = new Set<string>([
  "atkPct", "atkFlat", "hpPct", "hpFlat", "defPct", "defFlat", "critRate", "critDmg", "er", "ele",
  "basic", "heavy", "skill", "lib", "intro", "outro", "echoSkill", "heal",
]);

export function zoneOf(stat: string): EffectZone {
  return ["ele", "basic", "heavy", "skill", "lib", "intro", "outro", "echoSkill"].includes(stat) ? "bonus" : "stat";
}

const clean = (t: string) => t.replace(/^\|\s*/, "").trim();

export function collectEffects(
  char: Pick<EngineChar, "element">,
  weapon: EngineWeapon | undefined,
  rank: number,
  sonataCounts: Record<string, number>,
  sonatas: EngineSonata[],
): Effect[] {
  const out: Effect[] = [];
  const conf: Confidence = "community";
  if (weapon) {
    weapon.effects.forEach((b, i) => {
      if (!STAT_KEYS.has(b.stat)) return;
      if (b.el && b.el !== char.element) return;
      const v = b.v[Math.min(b.v.length - 1, Math.max(0, rank - 1))];
      out.push({
        id: `weapon:${weapon.name}:${i}`,
        label: weapon.name,
        source: { kind: "weapon", ref: weapon.name },
        scope: "self",
        stat: b.stat as StatKey,
        zone: zoneOf(b.stat),
        value: v,
        maxStacks: Math.max(1, b.stacks),
        always: b.always,
        text: clean(b.text),
        confidence: conf,
      });
    });
  }
  for (const s of sonatas) {
    const cnt = sonataCounts[s.name] || 0;
    s.effects.forEach((b, i) => {
      if (!b.piece || cnt < b.piece) return;
      if (!STAT_KEYS.has(b.stat)) return;
      if (b.el && b.el !== char.element) return;
      out.push({
        id: `sonata:${s.name}:${i}`,
        label: s.name,
        source: { kind: "sonata", ref: s.name },
        scope: "self",
        stat: b.stat as StatKey,
        zone: zoneOf(b.stat),
        value: b.v[0],
        maxStacks: Math.max(1, b.stacks),
        always: b.always,
        text: clean(b.text),
        confidence: conf,
      });
    });
  }
  return out;
}

export function tagOfStat(stat: string): DmgTag | null {
  return (["basic", "heavy", "skill", "lib", "intro", "outro", "echoSkill"] as const).find((t) => t === stat) ?? null;
}
