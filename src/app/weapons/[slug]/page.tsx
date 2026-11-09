import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Stars } from "@/components/ui";
import { characters, getWeapon, weapons } from "@/lib/data";
import { fmt } from "@/lib/calc";

export function generateStaticParams() {
  return weapons.map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const w = getWeapon(slug);
  return { title: w ? `${w.name} — ${w.type}` : "Weapon" };
}

export default async function WeaponPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const w = getWeapon(slug);
  if (!w) notFound();
  const users = characters.filter((c) => c.weapon === w.type && c.rarity <= 5);
  const pct = ["ATK", "HP", "DEF", "Crit. Rate", "Crit. DMG", "Energy Regen"].includes(w.stat) ? "%" : "";
  return (
    <div>
      <Link href="/weapons" className="text-[13px] text-mute no-underline hover:text-fg">
        ← All weapons
      </Link>
      <div className="mt-4 flex flex-col gap-6 sm:flex-row">
        <div className="card flex h-44 w-44 shrink-0 items-center justify-center bg-panel2">
          {w.icon && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={w.icon} alt={w.name} className="h-36 w-36 object-contain" />
          )}
        </div>
        <div>
          <div className="label">{w.type}</div>
          <h1 className="text-4xl font-semibold tracking-tight">{w.name}</h1>
          <div className="mt-2">
            <Stars n={w.rarity} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="card p-3">
              <div className="label">Base ATK Lv1</div>
              <div className="font-mono text-lg">{fmt(w.atk)}</div>
            </div>
            <div className="card p-3">
              <div className="label">Base ATK Lv90</div>
              <div className="font-mono text-lg">{fmt(w.atk * 12.4894)}</div>
            </div>
            <div className="card p-3">
              <div className="label">{w.stat} Lv90</div>
              <div className="font-mono text-lg">
                {fmt(w.statValue * 4.5, 1)}
                {pct}
              </div>
            </div>
            <div className="card p-3">
              <div className="label">Source</div>
              <div className="text-[13px]">{w.source || "—"}</div>
            </div>
          </div>
          {w.resonator && <p className="mt-3 text-[13px] text-mute">Associated Resonator: {w.resonator}</p>}
        </div>
      </div>
      {w.passive && (
        <section className="mt-10">
          <h2 className="mb-1 text-xl font-semibold">{w.passive}</h2>
          <div className="card mt-3 divide-y divide-line">
            {w.ranks.map((r, i) => (
              <div key={i} className="grid gap-3 p-3 sm:grid-cols-[60px_1fr]">
                <div className="font-mono text-accent">R{i + 1}</div>
                <p className="whitespace-pre-line text-[14px] text-[#c3c8cc]">{r}</p>
              </div>
            ))}
          </div>
        </section>
      )}
      {w.desc && <p className="mt-8 max-w-3xl text-[14px] italic text-mute">{w.desc}</p>}
      <div className="mt-8 flex flex-wrap gap-2">
        <span className="label mr-2 self-center">Simulate on</span>
        {users.slice(0, 40).map((c) => (
          <Link key={c.slug} href={`/calculator?c=${c.slug}&w=${w.slug}`} className="chip no-underline hover:text-fg">
            {c.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
