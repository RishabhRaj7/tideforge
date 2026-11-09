/**
 * Skill multiplier strings (datamine) -> structured values.
 *
 *   "19.61%+9.81%*3"  -> { kind: "pct",      hits: [[19.61, 1], [9.81, 3]] }
 *   "600+24.00%"      -> { kind: "flat+pct", flat: 600, pct: 24 }          (healing / shield rows)
 *   "12s"             -> { kind: "raw",      text: "12s" }                 (anything else is kept verbatim)
 */
export type Multiplier =
  | { kind: "pct"; hits: [number, number][] }
  | { kind: "flat+pct"; flat: number; pct: number }
  | { kind: "raw"; text: string };

const PCT_PART = /^([\d.]+)%(?:\s*\*\s*(\d+))?$/;

export function parseMultiplier(input: string): Multiplier {
  const text = input.trim();
  const parts = text.split("+").map((p) => p.trim());
  const hits: [number, number][] = [];
  for (const part of parts) {
    const m = part.match(PCT_PART);
    if (!m) { hits.length = 0; break; }
    hits.push([parseFloat(m[1]), m[2] ? parseInt(m[2], 10) : 1]);
  }
  if (hits.length) return { kind: "pct", hits };
  const fp = text.match(/^([\d.]+)\s*\+\s*([\d.]+)%$/);
  if (fp) return { kind: "flat+pct", flat: parseFloat(fp[1]), pct: parseFloat(fp[2]) };
  return { kind: "raw", text };
}

/** Total of a `pct` multiplier, in percent (e.g. 19.61 + 9.81*3 = 49.04). */
export const totalPct = (m: Multiplier): number | null =>
  m.kind === "pct" ? Math.round(m.hits.reduce((s, [v, n]) => s + v * n, 0) * 1e4) / 1e4 : null;
