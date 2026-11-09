"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const GROUPS: { label: string; items: { href: string; label: string; sub: string }[] }[] = [
  { label: "Meta", items: [
    { href: "/tier-list", label: "Tier List", sub: "Who is strong right now" },
    { href: "/banners", label: "Banners", sub: "Live, upcoming and past" },
    { href: "/events", label: "Events", sub: "Calendar and timers" },
    { href: "/patches", label: "Patches", sub: "Version by version" },
  ] },
  { label: "Database", items: [
    { href: "/characters", label: "Resonators", sub: "Kits, chains, builds" },
    { href: "/weapons", label: "Weapons", sub: "Passives by rank" },
    { href: "/echoes", label: "Echoes", sub: "Skills and Sonatas" },
    { href: "/sonatas", label: "Sonata Sets", sub: "Set bonuses" },
  ] },
  { label: "Tools", items: [
    { href: "/calculator", label: "Damage Calculator", sub: "Build, enemy, rotation" },
    { href: "/convene", label: "Convene Planner", sub: "Pity and probability" },
    { href: "/materials", label: "Materials", sub: "Who needs what" },
  ] },
  { label: "Learn", items: [
    { href: "/glossary", label: "Glossary", sub: "Game terms explained" },
    { href: "/methodology", label: "Methodology", sub: "Formulas and assumptions" },
    { href: "/data-status", label: "Data Status", sub: "Coverage and confidence" },
  ] },
];

function Logo() {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden>
      <path d="M3 22c4 0 5-8 9-8s5 8 9 8 4-6 8-6" fill="none" stroke="var(--color-brand)" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M9 27h14l-2-5H11z" fill="var(--color-tide)" opacity=".85" />
      <path d="M13 8c0-3 3-4 3-6 3 2 5 5 3 9" fill="none" stroke="var(--color-brand)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Header() {
  const path = usePathname();
  const [open, setOpen] = useState<string | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const nav = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(null);
    setDrawer(false);
  }, [path]);
  useEffect(() => {
    const s = () => setScrolled(window.scrollY > 8);
    s();
    window.addEventListener("scroll", s, { passive: true });
    const c = (e: MouseEvent) => nav.current && !nav.current.contains(e.target as Node) && setOpen(null);
    const k = (e: KeyboardEvent) => e.key === "Escape" && (setOpen(null), setDrawer(false));
    document.addEventListener("mousedown", c);
    document.addEventListener("keydown", k);
    return () => {
      window.removeEventListener("scroll", s);
      document.removeEventListener("mousedown", c);
      document.removeEventListener("keydown", k);
    };
  }, []);

  const openSearch = () => window.dispatchEvent(new Event("open-palette"));

  return (
    <>
      <header className={`sticky top-0 z-50 border-b transition-colors ${scrolled ? "border-line2 bg-ink/85 backdrop-blur-md" : "border-line bg-ink/60"}`}>
        <div className="mx-auto flex h-14 max-w-[1240px] items-center gap-4 px-4 md:px-5">
          <Link href="/" className="flex items-center gap-2 no-underline" aria-label="Tideforge home">
            <Logo />
            <span className="font-display text-[17px] font-semibold tracking-tight">Tideforge</span>
          </Link>
          <nav aria-label="Main" className="ml-4 hidden items-center gap-1 md:flex" ref={nav}>
            {GROUPS.map((g) => (
              <div key={g.label} className="relative" onMouseEnter={() => setOpen(g.label)} onMouseLeave={() => setOpen(null)}>
                <button
                  className="rounded px-3 py-1.5 text-[13.5px] text-mute hover:text-fg aria-expanded:text-fg"
                  aria-expanded={open === g.label}
                  aria-haspopup="true"
                  onClick={() => setOpen(open === g.label ? null : g.label)}
                >
                  {g.label} <span aria-hidden className="text-[9px] text-dim">▾</span>
                </button>
                {open === g.label && (
                  <div className="glass rise absolute left-0 top-full z-50 w-64 rounded-lg p-1.5" style={{ animationDuration: "160ms" }}>
                    {g.items.map((i) => (
                      <Link key={i.href} href={i.href} className="block rounded px-3 py-2 no-underline hover:bg-accent/12">
                        <span className="block text-[13.5px]">{i.label}</span>
                        <span className="block text-[11.5px] text-dim">{i.sub}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={openSearch} className="btn !min-h-9 gap-2 text-dim" aria-label="Search (Ctrl K)">
              <span aria-hidden>⌕</span>
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden rounded border border-line2 px-1.5 text-[10px] sm:inline">Ctrl K</kbd>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile bottom bar */}
      <nav aria-label="Primary mobile" className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-line2 bg-ink/92 backdrop-blur-md md:hidden">
        {[
          { href: "/", label: "Home", icon: "⌂" },
          { href: "/tier-list", label: "Meta", icon: "▤" },
          { href: "/calculator", label: "Build", icon: "⚒" },
          { href: "/convene", label: "Plan", icon: "✧" },
        ].map((t) => {
          const active = t.href === "/" ? path === "/" : path.startsWith(t.href);
          return (
            <Link key={t.href} href={t.href} aria-current={active ? "page" : undefined} className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] no-underline ${active ? "text-accent" : "text-dim"}`}>
              <span aria-hidden className="text-lg leading-none">{t.icon}</span>
              {t.label}
            </Link>
          );
        })}
        <button onClick={() => setDrawer(true)} className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] text-dim" aria-haspopup="dialog">
          <span aria-hidden className="text-lg leading-none">☰</span>
          More
        </button>
      </nav>
      {drawer && (
        <div className="fixed inset-0 z-[70] bg-black/60 md:hidden" onClick={() => setDrawer(false)} role="presentation">
          <div role="dialog" aria-modal="true" aria-label="Menu" className="glass rise absolute inset-x-0 bottom-0 max-h-[80dvh] overflow-auto rounded-t-xl p-4 pb-20" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <span className="font-display text-lg">Menu</span>
              <button className="btn" onClick={() => setDrawer(false)}>Close</button>
            </div>
            {GROUPS.map((g) => (
              <div key={g.label} className="mb-4">
                <div className="label mb-1">{g.label}</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {g.items.map((i) => (
                    <Link key={i.href} href={i.href} className="card-raised px-3 py-2.5 text-[13.5px] no-underline">
                      {i.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
