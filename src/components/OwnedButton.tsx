"use client";
import { useEffect, useState } from "react";
import { usePrefs } from "@/store/prefs";

export function OwnedButton({ slug, compact = false }: { slug: string; compact?: boolean }) {
  const owned = usePrefs((s) => s.roster.includes(slug));
  const toggle = usePrefs((s) => s.toggleOwned);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const on = mounted && owned;
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(slug);
      }}
      className={compact ? "chip" : "btn"}
      data-on={on}
      title="Saved on this device only"
    >
      {on ? "✓ In roster" : "+ Roster"}
    </button>
  );
}
