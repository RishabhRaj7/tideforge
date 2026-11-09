"use client";
import { motion } from "motion/react";
import { useEffect, useId, useState, type ReactNode } from "react";

export type TabDef = { id: string; label: string; content: ReactNode };

export function Tabs({ tabs, initial }: { tabs: TabDef[]; initial?: string }) {
  const uid = useId();
  const [active, setActive] = useState(initial ?? tabs[0].id);
  useEffect(() => {
    const h = window.location.hash.slice(1);
    if (h && tabs.some((t) => t.id === h)) setActive(h);
  }, [tabs]);
  const select = (id: string) => {
    setActive(id);
    history.replaceState(null, "", `#${id}`);
  };
  const onKey = (e: React.KeyboardEvent, i: number) => {
    let n = i;
    if (e.key === "ArrowRight") n = (i + 1) % tabs.length;
    else if (e.key === "ArrowLeft") n = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = tabs.length - 1;
    else return;
    e.preventDefault();
    select(tabs[n].id);
    document.getElementById(`${uid}-tab-${tabs[n].id}`)?.focus();
  };
  return (
    <div>
      <div role="tablist" aria-label="Sections" className="scroll-thin sticky top-14 z-30 -mx-4 flex gap-1 overflow-x-auto border-b border-line bg-ink/90 px-4 backdrop-blur md:mx-0 md:px-0">
        {tabs.map((t, i) => (
          <button
            key={t.id}
            id={`${uid}-tab-${t.id}`}
            role="tab"
            aria-selected={active === t.id}
            aria-controls={`${uid}-panel-${t.id}`}
            tabIndex={active === t.id ? 0 : -1}
            onClick={() => select(t.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={`relative shrink-0 px-4 py-3 text-[13.5px] ${active === t.id ? "text-fg" : "text-dim hover:text-mute"}`}
          >
            {t.label}
            {active === t.id && <motion.span layoutId={`${uid}-underline`} className="absolute inset-x-2 -bottom-px h-0.5 rounded bg-accent" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.id} role="tabpanel" id={`${uid}-panel-${t.id}`} aria-labelledby={`${uid}-tab-${t.id}`} hidden={active !== t.id} className="pt-6">
          {active === t.id && <div className="rise">{t.content}</div>}
        </div>
      ))}
    </div>
  );
}
