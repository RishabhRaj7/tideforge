import Link from "next/link";
import type { ReactNode } from "react";
import { ELEMENT_COLOR, ELEMENT_GLYPH, WEAPON_GLYPH } from "@/lib/game";

export function PageHead({ kicker, title, children, element, actions }: { kicker?: string; title: string; children?: ReactNode; element?: string; actions?: ReactNode }) {
  return (
    <header className="relative mb-8 pb-6" data-element={element}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          {kicker && <div className="label mb-2 text-accent">{kicker}</div>}
          <h1 className="text-3xl font-semibold md:text-4xl">{title}</h1>
          {children && <p className="mt-3 max-w-3xl text-mute">{children}</p>}
        </div>
        {actions}
      </div>
      <div className="wave-divider mt-6" aria-hidden />
    </header>
  );
}

export function ElementBadge({ element, size = "sm" }: { element: string; size?: "sm" | "md" }) {
  const c = ELEMENT_COLOR[element] ?? "#888";
  return (
    <span className={`inline-flex items-center gap-1.5 ${size === "md" ? "text-sm" : "text-[12px]"}`} style={{ color: c }}>
      <span aria-hidden className="font-mono">{ELEMENT_GLYPH[element]}</span>
      <span>{element}</span>
    </span>
  );
}

export function WeaponBadge({ type }: { type: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-mute">
      <span aria-hidden>{WEAPON_GLYPH[type]}</span>
      {type}
    </span>
  );
}

export function RarityStars({ n }: { n: number }) {
  return (
    <span className="text-[12px] tracking-tight" style={{ color: n >= 5 ? "#f0c36a" : n === 4 ? "#b78cf0" : "#8795a0" }} aria-label={`${n} star`}>
      {"★".repeat(n)}
    </span>
  );
}

const CONF: Record<string, { label: string; cls: string; tip: string }> = {
  datamined: { label: "datamined", cls: "border-ok/50 text-ok", tip: "Read directly from game files." },
  official: { label: "official", cls: "border-info/50 text-info", tip: "Confirmed by an official Kuro post." },
  tested: { label: "tested", cls: "border-tide/50 text-tide", tip: "Verified in-game by our contributors." },
  community: { label: "community", cls: "border-warn/50 text-warn", tip: "Community wiki data. Not yet verified against game files." },
  estimated: { label: "estimated", cls: "border-bad/70 text-bad border-dashed", tip: "Estimated or placeholder value. Do not rely on it." },
};
export function ConfidenceBadge({ level }: { level: string }) {
  const c = CONF[level] ?? CONF.estimated;
  return (
    <span title={c.tip} className={`inline-flex items-center rounded-sm border px-1.5 py-px text-[10px] font-medium uppercase tracking-wider ${c.cls}`}>
      {c.label}
    </span>
  );
}

export function Section({ title, sub, children, action }: { title: string; sub?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="mb-10">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {sub && <p className="text-[13px] text-dim">{sub}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({ title, children, href, cta }: { title: string; children?: ReactNode; href?: string; cta?: string }) {
  return (
    <div className="card grid place-items-center gap-2 p-10 text-center">
      <div className="font-display text-lg">{title}</div>
      {children && <p className="max-w-md text-[13px] text-mute">{children}</p>}
      {href && (
        <Link href={href} className="btn mt-2">
          {cta ?? "Continue"}
        </Link>
      )}
    </div>
  );
}

export function Notice({ tone = "warn", children }: { tone?: "warn" | "info" | "bad"; children: ReactNode }) {
  const cls = tone === "bad" ? "border-bad/50 bg-bad/10" : tone === "info" ? "border-info/40 bg-info/10" : "border-warn/40 bg-warn/10";
  return <div role="note" className={`rounded border p-3 text-[13px] text-mute ${cls}`}>{children}</div>;
}
