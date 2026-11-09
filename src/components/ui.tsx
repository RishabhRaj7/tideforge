import Link from "next/link";
import type { ReactNode } from "react";
import { ELEMENT_COLOR } from "@/lib/data";

export function ElementTag({ element, size = 12 }: { element: string; size?: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px]" style={{ color: ELEMENT_COLOR[element] || "#999" }}>
      <span style={{ width: size, height: size, background: ELEMENT_COLOR[element] || "#999", display: "inline-block", borderRadius: 1 }} />
      {element}
    </span>
  );
}

export function Stars({ n }: { n: number }) {
  return (
    <span className="text-[12px] tracking-widest" style={{ color: n >= 5 ? "#d7b46a" : n === 4 ? "#a68ad0" : "#7fa0c4" }}>
      {"★".repeat(n)}
    </span>
  );
}

export function PageHead({ kicker, title, children }: { kicker?: string; title: string; children?: ReactNode }) {
  return (
    <header className="border-b border-line pb-6 mb-8">
      {kicker && <div className="label mb-2">{kicker}</div>}
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      {children && <div className="mt-3 max-w-3xl text-mute">{children}</div>}
    </header>
  );
}

const NAV = [
  ["/characters", "Characters"],
  ["/weapons", "Weapons"],
  ["/echoes", "Echoes"],
  ["/sonatas", "Sonatas"],
  ["/calculator", "Build Simulator"],
  ["/tierlist", "Tier List"],
  ["/convene", "Convene"],
  ["/events", "Events"],
  ["/materials", "Materials"],
  ["/glossary", "Glossary"],
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-ink/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1240px] items-center gap-6 px-5 h-14">
        <Link href="/" className="flex items-center gap-2 no-underline shrink-0">
          <span className="inline-flex h-7 w-7 items-center justify-center border border-accent text-accent text-[13px] font-semibold">WW</span>
          <span className="font-semibold tracking-tight">Resonance Index</span>
        </Link>
        <nav className="scroll-thin flex gap-1 overflow-x-auto text-[13px]">
          {NAV.map(([href, label]) => (
            <Link key={href} href={href} className="whitespace-nowrap px-2.5 py-1.5 text-mute no-underline hover:text-fg">
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto max-w-[1240px] px-5 py-8 text-[12px] text-dim leading-relaxed">
        <p>
          Resonance Index is an unofficial fan project. Wuthering Waves and all related names, art and assets belong to Kuro Games. Game data is compiled from
          the community wiki (CC BY-SA) and may lag behind the live game; damage figures are simulations, not guarantees.
        </p>
      </div>
    </footer>
  );
}
