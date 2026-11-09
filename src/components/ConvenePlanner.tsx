"use client";
import { useMemo, useState } from "react";

const BASE = 0.008;
const SOFT = 66;
const HARD = 80;
const rate = (n: number) => (n < SOFT ? BASE : n >= HARD ? 1 : BASE + (1 - BASE) * ((n - (SOFT - 1)) / (HARD - (SOFT - 1))));

// distribution of pulls until next 5-star starting from current pity p0
function firstDist(p0: number) {
  const f: number[] = [0];
  let surv = 1;
  for (let k = 1; k <= HARD - p0; k++) {
    const r = rate(p0 + k);
    f[k] = surv * r;
    surv *= 1 - r;
  }
  return f;
}
function convolve(a: number[], b: number[]) {
  const out = new Array(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j++) out[i + j] += a[i] * b[j];
  return out;
}

export default function ConvenePlanner() {
  const [pity, setPity] = useState(0);
  const [guaranteed, setGuaranteed] = useState(false);
  const [pulls, setPulls] = useState(120);
  const [copies, setCopies] = useState(1);

  const res = useMemo(() => {
    const first = firstDist(Math.min(HARD - 1, Math.max(0, pity)));
    const fresh = firstDist(0);
    let one = first;
    if (!guaranteed) {
      const second = convolve(first, fresh);
      const len = Math.max(first.length, second.length);
      one = Array.from({ length: len }, (_, i) => 0.5 * (first[i] || 0) + 0.5 * (second[i] || 0));
    }
    let dist = one;
    const fresh2 = convolve(fresh, fresh);
    const extra = Array.from({ length: fresh2.length }, (_, i) => 0.5 * (fresh[i] || 0) + 0.5 * fresh2[i]);
    for (let c = 1; c < copies; c++) dist = convolve(dist, extra);
    // for extra copies after the first, the next 5★ starts at pity 0 and is 50/50 again
    const total = dist.reduce((s, v) => s + v, 0);
    let cum = 0;
    let exp = 0;
    let p = 0;
    let med = 0;
    let p90 = 0;
    dist.forEach((v, i) => {
      cum += v;
      exp += i * v;
      if (i <= pulls) p += v;
      if (!med && cum >= 0.5) med = i;
      if (!p90 && cum >= 0.9) p90 = i;
    });
    return { chance: Math.min(1, p / (total || 1)), expected: exp / (total || 1), med, p90 };
  }, [pity, guaranteed, pulls, copies]);

  return (
    <div className="card grid gap-6 p-5 md:grid-cols-[320px_1fr]">
      <div className="space-y-4">
        <label className="block">
          <span className="label mb-1 block">Current pity (pulls since last 5★)</span>
          <input type="number" min={0} max={79} value={pity} onChange={(e) => setPity(parseInt(e.target.value) || 0)} className="w-full" />
        </label>
        <label className="flex items-center gap-2 text-[13px]">
          <input type="checkbox" checked={guaranteed} onChange={(e) => setGuaranteed(e.target.checked)} /> Next 5★ is guaranteed featured
        </label>
        <label className="block">
          <span className="label mb-1 block">Convenes available</span>
          <input type="number" min={0} value={pulls} onChange={(e) => setPulls(parseInt(e.target.value) || 0)} className="w-full" />
          <span className="mt-1 block text-[11px] text-dim">1 Convene = 160 Astrite</span>
        </label>
        <label className="block">
          <span className="label mb-1 block">Featured 5★ copies wanted</span>
          <select value={copies} onChange={(e) => setCopies(+e.target.value)} className="w-full">
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <option key={n} value={n}>
                {n} (S{n - 1})
              </option>
            ))}
          </select>
        </label>
      </div>
      <div>
        <div className="label">Chance to get it with {pulls} Convenes</div>
        <div className="mt-1 font-mono text-5xl font-semibold text-accent">{(res.chance * 100).toFixed(1)}%</div>
        <div className="mt-4 h-2 bg-panel2">
          <div className="h-2 bg-accent" style={{ width: `${res.chance * 100}%` }} />
        </div>
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            ["Average cost", Math.round(res.expected)],
            ["Median", res.med],
            ["90% confidence", res.p90],
          ].map(([l, v]) => (
            <div key={l as string} className="card p-3">
              <div className="label">{l}</div>
              <div className="font-mono text-xl">{v} pulls</div>
              <div className="text-[11px] text-dim">{(((v as number) * 160) / 1000).toFixed(1)}k Astrite</div>
            </div>
          ))}
        </div>
        <p className="mt-5 text-[12px] text-dim">
          Model: 0.8% base 5★ rate, rate ramps from pull 66 to a guaranteed 5★ at pull 80, 50% chance the 5★ is the featured Resonator and a guarantee after a loss. Pity carries over between featured Resonator banners. Real in-game rates may differ slightly.
        </p>
      </div>
    </div>
  );
}
