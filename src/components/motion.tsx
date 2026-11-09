"use client";
import { animate, MotionConfig, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePrefs } from "@/store/prefs";

/** Applies the in-app motion setting (Full / Reduced) on top of the OS preference. */
export function MotionProvider({ children }: { children: ReactNode }) {
  const m = usePrefs((s) => s.motion);
  useEffect(() => {
    document.documentElement.dataset.motion = m;
  }, [m]);
  return <MotionConfig reducedMotion={m === "reduced" ? "always" : "user"}>{children}</MotionConfig>;
}

/** Fade + rise once when scrolled into view. */
export function Reveal({ children, delay = 0, className = "", y = 12 }: { children: ReactNode; delay?: number; className?: string; y?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -8% 0px" });
  return (
    <motion.div ref={ref} className={className} initial={{ opacity: 0, y }} animate={inView ? { opacity: 1, y: 0 } : undefined} transition={{ duration: 0.42, delay, ease: [0.16, 1, 0.3, 1] }}>
      {children}
    </motion.div>
  );
}

/** Tween between numeric values (<= 300 ms). */
export function CountUp({ value, decimals = 0, suffix = "", prefix = "", className = "" }: { value: number; decimals?: number; suffix?: string; prefix?: string; className?: string }) {
  const reduce = useReducedMotion();
  const setting = usePrefs((s) => s.motion);
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    if (reduce || setting === "reduced") {
      from.current = value;
      return;
    }
    const c = animate(from.current, value, { duration: 0.3, ease: "easeOut", onUpdate: (v) => setShown(v) });
    from.current = value;
    return () => c.stop();
  }, [value, reduce, setting]);
  const v = reduce || setting === "reduced" ? value : shown;
  return (
    <span className={`num ${className}`}>
      {prefix}
      {v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}

/** Bar whose width animates from 0 when in view. */
export function GrowBar({ pct, color = "var(--accent)", delay = 0 }: { pct: number; color?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} className="h-2 w-full overflow-hidden rounded-sm bg-panel3" role="presentation">
      <motion.div className="h-full rounded-sm" style={{ background: color }} initial={{ width: 0 }} animate={{ width: inView ? `${Math.max(0, Math.min(100, pct))}%` : 0 }} transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }} />
    </div>
  );
}

export { motion };
