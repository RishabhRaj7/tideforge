// Convene (gacha) probability model. Pure math.
import { CONVENE } from "./constants";

export type PityModel = "community" | "conservative";

/** P(5★ on the n-th pull of a pity cycle). Linear ramp from soft-pity start to hard pity (community fit is approximate). */
export function rate5(n: number, model: PityModel = "community") {
  const { baseRate5: base, hardPity: hard } = CONVENE;
  const soft = model === "community" ? CONVENE.softPityStart : 74; // conservative = later, steeper ramp
  if (n >= hard) return 1;
  if (n < soft) return base;
  return base + (1 - base) * ((n - (soft - 1)) / (hard - (soft - 1)));
}

/** Distribution of the number of pulls until the next 5★, starting at pity `p0` (0..79). index = pulls. */
export function firstFiveStar(p0: number, model: PityModel = "community") {
  const f: number[] = [0];
  let surv = 1;
  for (let k = 1; k <= CONVENE.hardPity - p0; k++) {
    const r = rate5(p0 + k, model);
    f[k] = surv * r;
    surv *= 1 - r;
  }
  return f;
}

export function convolve(a: number[], b: number[]) {
  const out = new Array(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j++) out[i + j] += a[i] * b[j];
  return out;
}

export type BannerKind = "resonator" | "weapon";

/** Pulls until ONE featured 5★ on the given banner type. Resonator banner: 50/50 then guarantee. Weapon banner: featured guaranteed. */
export function oneFeatured(p0: number, guaranteed: boolean, kind: BannerKind, model: PityModel) {
  const first = firstFiveStar(p0, model);
  if (kind === "weapon" || guaranteed) return first;
  const fresh = firstFiveStar(0, model);
  const second = convolve(first, fresh);
  const win = CONVENE.featuredResonatorWinRate;
  const len = Math.max(first.length, second.length);
  return Array.from({ length: len }, (_, i) => win * (first[i] || 0) + (1 - win) * (second[i] || 0));
}

/** Distribution for N featured copies (copies after the first start fresh at pity 0, unguaranteed). */
export function copiesDistribution(p0: number, guaranteed: boolean, copies: number, kind: BannerKind, model: PityModel) {
  let dist = oneFeatured(p0, guaranteed, kind, model);
  if (copies <= 1) return dist;
  const next = oneFeatured(0, false, kind, model);
  for (let c = 1; c < copies; c++) dist = convolve(dist, next);
  return dist;
}

export function summarize(dist: number[], pulls: number) {
  const total = dist.reduce((s, v) => s + v, 0) || 1;
  let cum = 0, exp = 0, chance = 0, median = 0, p90 = 0;
  dist.forEach((v, i) => {
    cum += v;
    exp += i * v;
    if (i <= pulls) chance += v;
    if (!median && cum / total >= 0.5) median = i;
    if (!p90 && cum / total >= 0.9) p90 = i;
  });
  return { chance: Math.min(1, chance / total), expected: exp / total, median, p90 };
}
