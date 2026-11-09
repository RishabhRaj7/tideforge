"use client";
import { motion } from "motion/react";
import { useState } from "react";

export function ChainView({ chain }: { chain: { level: number; name: string; desc: string }[] }) {
  const [sel, setSel] = useState(0);
  if (!chain.length) return <p className="text-dim">Resonance Chain data is not available yet.</p>;
  return (
    <div>
      <div className="mb-4 flex items-center gap-1.5" role="group" aria-label="Sequence nodes">
        {chain.map((n, i) => (
          <button key={n.level} onClick={() => setSel(i)} aria-pressed={i <= sel} aria-label={`Sequence ${n.level}: ${n.name}`} className="relative grid h-11 w-11 place-items-center rounded-full border border-line2 font-display text-sm">
            <motion.span className="absolute inset-0 rounded-full bg-accent" initial={false} animate={{ opacity: i <= sel ? 1 : 0, scale: i <= sel ? 1 : 0.6 }} transition={{ duration: 0.25 }} />
            <span className={`relative ${i <= sel ? "text-black" : "text-mute"}`}>S{n.level}</span>
          </button>
        ))}
      </div>
      <div className="grid gap-3">
        {chain.map((n, i) => (
          <div key={n.level} className={`card p-4 transition-opacity ${i <= sel ? "" : "opacity-45"}`}>
            <div className="flex items-baseline gap-3"><span className="font-display text-accent">S{n.level}</span><span className="font-medium">{n.name}</span></div>
            <p className="mt-1.5 whitespace-pre-line text-[13.5px] text-mute">{n.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
