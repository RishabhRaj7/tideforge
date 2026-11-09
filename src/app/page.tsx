import Link from "next/link";
import { ElementTag, Stars } from "@/components/ui";
import { banners, characters, echoes, events, sonatas, weapons, charByName, weaponByName } from "@/lib/data";

const TOOLS = [
  ["/calculator", "Build Simulator", "Equip a weapon and five Echoes with real stats and rolls, set a rotation and compare weapons."],
  ["/characters", "Resonators", "Kits, scaling tables, Resonance Chain and materials for every character."],
  ["/weapons", "Weapons", "Every weapon with rank 1–5 passives and level 90 stats."],
  ["/echoes", "Echoes & Sonatas", "Every Echo with cost, class and Sonata options, plus all set bonuses."],
  ["/tierlist", "Tier List", "Editorial ratings by role."],
  ["/convene", "Convene Planner", "Pity odds and the full banner history."],
  ["/events", "Events", "Every event by version since 1.0."],
  ["/materials", "Materials", "Farming targets grouped by boss, specialty and common drop."],
];

export default function Home() {
  const latest = [...banners].filter((b) => b.type === "Featured Resonator Convene").slice(0, 3);
  const newest = [...characters].filter((c) => c.release).sort((a, b) => b.release.localeCompare(a.release)).slice(0, 6);
  const recentEvents = events.slice(-8).reverse();
  const hero = charByName(latest[0]?.featured[0] || "Jinhsi") || characters[0];
  return (
    <div>
      <section className="grid items-end gap-10 border-b border-line pb-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="label mb-3">Wuthering Waves · unofficial database</div>
          <h1 className="max-w-2xl text-5xl font-semibold leading-[1.05] tracking-tight">Everything about Wuthering Waves, in one index.</h1>
          <p className="mt-5 max-w-xl text-[16px] text-mute">
            {characters.length} Resonators, {weapons.length} weapons, {echoes.length} Echoes, {sonatas.length} Sonata sets and every event since launch, with a build simulator that
            actually does the math.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/calculator" className="btn btn-primary no-underline">
              Open Build Simulator
            </Link>
            <Link href="/characters" className="btn no-underline">
              Browse Resonators
            </Link>
          </div>
        </div>
        <div className="card relative h-[420px] overflow-hidden bg-panel2">
          {(hero.images.sprite || hero.images.card) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={(hero.images.sprite || hero.images.card)!} alt={hero.name} className="h-full w-full object-contain object-bottom" />
          )}
          <Link href={`/characters/${hero.slug}`} className="absolute bottom-0 left-0 right-0 flex items-center justify-between border-t border-line bg-ink/90 px-4 py-3 no-underline">
            <span className="font-medium">{hero.name}</span>
            <span className="flex items-center gap-3 text-[12px]">
              <Stars n={hero.rarity} />
              <ElementTag element={hero.element} />
            </span>
          </Link>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="mb-4 text-xl font-semibold">Tools &amp; databases</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TOOLS.map(([href, t, d]) => (
            <Link key={href} href={href} className="card p-4 no-underline hover:border-line2">
              <div className="font-medium">{t}</div>
              <p className="mt-1.5 text-[13px] text-mute">{d}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-14 grid gap-10 lg:grid-cols-2">
        <div>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-xl font-semibold">Latest banners</h2>
            <Link href="/convene" className="text-[13px] text-mute">
              All banners →
            </Link>
          </div>
          <div className="card divide-y divide-line">
            {banners.slice(0, 6).map((b, i) => {
              const c = b.type.includes("Resonator") ? charByName(b.featured[0] || "") : undefined;
              const w = b.type.includes("Weapon") ? weaponByName(b.featured[0] || "") : undefined;
              return (
                <div key={i} className="flex items-center gap-3 p-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden bg-panel2">
                    {c?.images.icon && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.images.icon} alt="" className="h-full w-full object-cover" />
                    )}
                    {w?.icon && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={w.icon} alt="" className="h-full w-full object-contain" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px]">{b.name}</div>
                    <div className="text-[12px] text-mute">
                      v{b.version} · {b.start} – {b.end}
                    </div>
                  </div>
                  <span className="chip">{b.type.includes("Weapon") ? "Weapon" : "Resonator"}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-xl font-semibold">Recent events</h2>
            <Link href="/events" className="text-[13px] text-mute">
              All events →
            </Link>
          </div>
          <div className="card divide-y divide-line">
            {recentEvents.map((e, i) => (
              <div key={i} className="flex items-center justify-between gap-3 p-3 text-[14px]">
                <span className="truncate">{e.name}</span>
                <span className="shrink-0 text-[12px] text-mute">v{e.version}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-14">
        <h2 className="mb-4 text-xl font-semibold">Newest Resonators</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {newest.map((c) => (
            <Link key={c.slug} href={`/characters/${c.slug}`} className="card overflow-hidden no-underline hover:border-line2">
              <div className="aspect-[3/4] bg-panel2">
                {c.images.card && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.images.card} alt={c.name} loading="lazy" className="h-full w-full object-cover object-top" />
                )}
              </div>
              <div className="p-2.5 text-[14px]">{c.name}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
