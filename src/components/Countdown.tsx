"use client";
import { useEffect, useState } from "react";

export function Countdown({ to, label = "left", endedText = "Ended" }: { to: string; label?: string; endedText?: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const end = Date.parse(`${to}T23:59:59+08:00`);
  if (now === null) return <span className="num text-dim">--d --h --m</span>;
  const ms = end - now;
  if (ms <= 0) return <span className="text-dim">{endedText}</span>;
  const d = Math.floor(ms / 86400000), h = Math.floor((ms % 86400000) / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000);
  return (
    <span className="num" aria-label={`${d} days ${h} hours ${m} minutes ${label}`}>
      {d}d {String(h).padStart(2, "0")}h {String(m).padStart(2, "0")}m <span className="text-dim">{String(s).padStart(2, "0")}s</span> <span className="font-sans text-dim">{label}</span>
    </span>
  );
}
