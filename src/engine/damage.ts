// Damage zones. All functions are pure and deterministic.
import { SKILL_CURVE } from "./constants";

/** DEF zone: (800 + 8·atkLv) / (800 + 8·atkLv + (8·enemyLv + 792)·(1 − ignore)), clamped to (0, 2]. */
export function defMultiplier(attackerLevel: number, enemyLevel: number, defIgnorePct = 0) {
  const ignore = Math.min(1, Math.max(0, defIgnorePct / 100));
  const a = 800 + 8 * attackerLevel;
  const enemyDef = (8 * enemyLevel + 792) * (1 - ignore);
  return Math.min(2, a / (a + enemyDef));
}

/** RES zone, all three branches. `resPct` is the final enemy RES in percent (base − shred). */
export function resMultiplier(resPct: number) {
  const r = resPct / 100;
  if (r < 0) return 1 - r / 2;
  if (r < 0.8) return 1 - r;
  return 1 / (1 + 5 * r);
}

/** Crit zone. `average` uses CR capped at 100 %; CR/CD are percent points. */
export function critMultiplier(critRatePct: number, critDmgPct: number, mode: "none" | "crit" | "average") {
  if (mode === "none") return 1;
  if (mode === "crit") return critDmgPct / 100;
  const cr = Math.min(1, Math.max(0, critRatePct / 100));
  return 1 + cr * (critDmgPct / 100 - 1);
}

/** Total multiplier of a row (sum of hit values) at a skill level, as a fraction (1.0 = 100 %). */
export function rowMultiplier(hits: [number, number][], skillLevel: number) {
  const base = hits.reduce((s, [v, n]) => s + v * n, 0);
  return (base * skillCurve(skillLevel)) / 100;
}

export function skillCurve(skillLevel: number) {
  return SKILL_CURVE[Math.max(0, Math.min(9, Math.round(skillLevel) - 1))];
}
