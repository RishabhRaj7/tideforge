"use client";
import Link from "next/link";
import { usePrefs } from "@/store/prefs";

export function Footer() {
  const motion = usePrefs((s) => s.motion);
  const setMotion = usePrefs((s) => s.setMotion);
  return (
    <footer className="mx-auto mt-20 max-w-[1240px] border-t border-line px-5 pb-16 pt-8 text-[13px] text-dim">
      <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="font-display text-base text-fg">Tideforge</div>
          <p className="mt-2 max-w-sm">Every number, every build. A fan-made Wuthering Waves companion with transparent data and math.</p>
        </div>
        <div className="grid gap-1.5">
          <div className="label">Explore</div>
          <Link href="/characters">Resonators</Link>
          <Link href="/weapons">Weapons</Link>
          <Link href="/echoes">Echoes</Link>
          <Link href="/tier-list">Tier List</Link>
        </div>
        <div className="grid gap-1.5">
          <div className="label">Trust</div>
          <Link href="/methodology">Methodology</Link>
          <Link href="/data-status">Data Status</Link>
          <Link href="/about">About</Link>
          <Link href="/about/credits">Credits &amp; Sources</Link>
        </div>
        <div className="grid content-start gap-1.5">
          <div className="label">Motion</div>
          <div className="flex gap-1.5" role="group" aria-label="Motion level">
            {(["full", "reduced"] as const).map((m) => (
              <button key={m} className="chip" data-on={motion === m} aria-pressed={motion === m} onClick={() => setMotion(m)}>
                {m === "full" ? "Full" : "Reduced"}
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-8 max-w-3xl text-[12px]">
        Tideforge is an unofficial fan project and is not affiliated with Kuro Games. Wuthering Waves and all related names and assets are © Kuro Games. Data confidence is shown wherever a number appears.
      </p>
    </footer>
  );
}
