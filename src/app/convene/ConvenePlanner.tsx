"use client";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { CountUp } from "@/components/motion";
import { CONVENE, copiesDistribution, summarize, type BannerKind, type PityModel } from "@/engine";
import { fmt } from "@/lib/game";

export function ConvenePlanner() {
  const sp = useSearchParams();
  const [kind, setKind] = useState<BannerKind>(sp.get("kind") === "weapon" ? "weapon" : "resonator");
  const [pity, setPity] = useState(0);
  const [guaranteed, setGuaranteed] = useState(false);
  const [pulls, setPulls] = useState(120);
  const [astrite, setAstrite] = useState(0);
  const [copies, setCopies] = useState(1);
  const [model, setModel] = useState<PityModel>("community");

  const total = pulls + Math.floor(astrite / CONVENE.astritePerPull);
  const dist = useMemo(() => copiesDistribution(Math.min(CONVENE.hardPity - 1, Math.max(0, pity)), kind === "weapon" ? true : guaranteed, copies, kind, model), [pity, guaranteed, copies, kind, model]);
  const s = useMemo(() => summarize(dist, total), [dist, total]);

  const max = dist.length;
  const peak = Math.max(...dist);
  const W = 640, H = 150;
  const bw = W / max;
  const softAt = Math.max(0, CONVENE.softPityStart - pity);

  return (
    <div className="card grid gap-6 p-5 lg:grid-cols-[320px_1fr]">
      <div className="grid content-start gap-4">
        <div className="flex gap-1.5" role="group" aria-label="Banner type">
          {(["resonator", "weapon"] as const).map((k) => <button key={k} className="chip" data-on={kind === k} aria-pressed={kind === k} onClick={() => setKind(k)}>{k === "resonator" ? "Featured Resonator" : "Featured Weapon"}</button>)}
        </div>
        <label className="grid gap-1"><span className="label">Current pity (pulls since last 5★, 0 to 79)</span><input type="number" min={0} max={79} value={pity} onChange={(e) => setPity(Math.min(79, Math.max(0, parseInt(e.target.value) || 0)))} /></label>
        <label className={`flex items-center gap-2 text-[13px] ${kind === "weapon" ? "opacity-50" : ""}`}><input type="checkbox" disabled={kind === "weapon"} checked={kind === "weapon" || guaranteed} onChange={(e) => setGuaranteed(e.target.checked)} /> Next 5★ is guaranteed featured</label>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1"><span className="label">Convenes</span><input type="number" min={0} value={pulls} onChange={(e) => setPulls(Math.max(0, parseInt(e.target.value) || 0))} /></label>
          <label className="grid gap-1"><span className="label">Astrite</span><input type="number" min={0} step={160} value={astrite} onChange={(e) => setAstrite(Math.max(0, parseInt(e.target.value) || 0))} /></label>
        </div>
        <p className="-mt-2 text-[12px] text-dim">1 Convene = {CONVENE.astritePerPull} Astrite. Total: <b className="num text-fg">{total}</b> pulls.</p>
        <label className="grid gap-1"><span className="label">Featured copies wanted</span><select value={copies} onChange={(e) => setCopies(+e.target.value)}>{[1, 2, 3, 4, 5, 6, 7].map((n) => <option key={n} value={n}>{n === 1 ? "1 (new)" : `${n} (C${n - 1})`}</option>)}</select></label>
        <div className="grid gap-1"><span className="label">Soft-pity model</span>
          <div className="flex gap-1.5">{(["community", "conservative"] as const).map((m) => <button key={m} className="chip" data-on={model === m} aria-pressed={model === m} onClick={() => setModel(m)}>{m === "community" ? "Community fit" : "Conservative"}</button>)}</div>
        </div>
      </div>

      <div className="grid content-start gap-5" aria-live="polite">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[["Chance with your pulls", <CountUp key="c" value={s.chance * 100} decimals={1} suffix="%" className="text-accent" />], ["Average pulls", <span key="a" className="num">{fmt(s.expected, 1)}</span>], ["Median", <span key="m" className="num">{s.median}</span>], ["90% safe at", <span key="p" className="num">{s.p90}</span>]].map(([l, v], i) => (
            <div key={i} className="card-raised p-3"><div className="label">{l}</div><div className="mt-1 font-display text-2xl">{v}</div></div>
          ))}
        </div>
        <div>
          <div className="label mb-2">When you get it (pulls from now)</div>
          <svg viewBox={`0 0 ${W} ${H + 24}`} className="w-full" role="img" aria-label={`Distribution of pulls needed. ${(s.chance * 100).toFixed(1)}% chance within ${total} pulls.`}>
            {softAt < max && <rect x={softAt * bw} y={0} width={(max - softAt) * bw} height={H} fill="var(--accent)" opacity="0.08" />}
            {dist.map((v, i) => (i === 0 ? null : <rect key={i} x={i * bw} y={H - (v / peak) * (H - 6)} width={Math.max(1, bw - 0.6)} height={(v / peak) * (H - 6)} fill={i <= total ? "var(--accent)" : "var(--color-line2)"} />))}
            {total < max && <line x1={total * bw} x2={total * bw} y1={0} y2={H} stroke="var(--color-tide)" strokeWidth="1.5" strokeDasharray="4 3" />}
            <line x1={0} x2={W} y1={H} y2={H} stroke="var(--color-line2)" />
            <text x={0} y={H + 16} fill="var(--color-dim)" fontSize="11">0</text>
            <text x={W} y={H + 16} fill="var(--color-dim)" fontSize="11" textAnchor="end">{max - 1} pulls</text>
            {total < max && <text x={Math.min(W - 4, total * bw + 4)} y={12} fill="var(--color-tide)" fontSize="11" textAnchor={total * bw > W - 90 ? "end" : "start"}>you: {total}</text>}
          </svg>
          <p className="text-[11.5px] text-dim">Shaded region: soft pity. Bars in gold are reachable with your pulls.</p>
        </div>
      </div>
    </div>
  );
}
