import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ElementTag, Stars } from "@/components/ui";
import { characters, getCharacter, weapons, ELEMENT_COLOR, type Skill } from "@/lib/data";
import { SKILL_CURVE, fmt } from "@/lib/calc";

export function generateStaticParams() {
  return characters.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = getCharacter(slug);
  return { title: c ? `${c.name} — Build, Skills & Chain` : "Character" };
}

function hitsText(hits: [number, number][], mult: number) {
  return hits.map(([v, n]) => `${fmt(v * mult, 2)}%${n > 1 ? `×${n}` : ""}`).join(" + ");
}

function SkillBlock({ s }: { s: Skill }) {
  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-baseline gap-3">
        <h3 className="text-[16px] font-semibold">{s.name}</h3>
        <span className="label">{s.type}</span>
      </div>
      <p className="mt-2 whitespace-pre-line text-[14px] text-[#c3c8cc]">{s.desc}</p>
      {s.rows.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-[12px] text-accent">Scaling table (levels 1–10)</summary>
          <div className="scroll-thin mt-2 overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Attribute</th>
                  {SKILL_CURVE.map((_, i) => (
                    <th key={i}>Lv{i + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {s.rows.map((r) => (
                  <tr key={r.label}>
                    <td className="whitespace-nowrap">{r.label}</td>
                    {SKILL_CURVE.map((m, i) => (
                      <td key={i} className="whitespace-nowrap font-mono text-[12px]">
                        {i === 0 || i === 9 ? hitsText(r.hits, m) : fmt(r.hits.reduce((a, [v, n]) => a + v * n, 0) * m, 1) + "%"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-1 text-[11px] text-dim">Levels 1 and 10 show each hit; other levels show the combined total.</p>
        </details>
      )}
      {s.info.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-mute">
          {s.info.map((i) => (
            <span key={i.label}>
              {i.label}: <span className="text-fg">{i.value}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default async function CharacterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getCharacter(slug);
  if (!c) notFound();
  const lv90 = { hp: c.base.hp * 12.5, atk: c.base.atk * 12.5, def: c.base.def * 12.5 };
  const sigs = weapons.filter((w) => w.type === c.weapon && w.resonator === c.name.split(" (")[0]);
  const bestWeapons = weapons.filter((w) => w.type === c.weapon && w.rarity === 5).slice(0, 8);
  const art = c.images.splash || c.images.card;
  const color = ELEMENT_COLOR[c.element];
  const facts: [string, string][] = [
    ["Class", c.class],
    ["Title", c.title],
    ["Nation", c.nation],
    ["Affiliation", c.affiliation],
    ["Birthday", c.birthday],
    ["Birthplace", c.birthplace],
    ["Gender", c.gender],
    ["Favourite dish", c.dish],
    ["Release", c.release],
    ["Obtained via", c.obtain],
  ].filter(([, v]) => v) as [string, string][];

  return (
    <div>
      <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
        <div>
          <div className="card overflow-hidden" style={{ borderTop: `3px solid ${color}` }}>
            {c.images.sprite || c.images.card ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={(c.images.sprite || c.images.card)!} alt={c.name} className="mx-auto max-h-[520px] w-full object-contain bg-panel2 p-2" />
            ) : (
              <div className="aspect-[3/4] bg-panel2" />
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <Link href={`/calculator?c=${c.slug}`} className="btn btn-primary flex-1 justify-center no-underline">
              Open in Build Simulator
            </Link>
          </div>
        </div>
        <div>
          <div className="label">{c.title || "Resonator"}</div>
          <h1 className="mt-1 text-4xl font-semibold tracking-tight">{c.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-[13px]">
            <Stars n={c.rarity} />
            <ElementTag element={c.element} />
            <span className="text-mute">{c.weapon}</span>
            {c.roles.map((r) => (
              <span key={r} className="chip">
                {r}
              </span>
            ))}
          </div>
          {c.intro && <p className="prose-wuwa mt-5 max-w-3xl text-[15px] text-[#c3c8cc]">{c.intro}</p>}
          {(c.limited || c.statsEstimated) && (
            <p className="mt-3 border-l-2 border-accent pl-3 text-[13px] text-mute">
              {c.limited && "The community wiki has incomplete kit data for this Resonator, so parts of the skill list are missing. "}
              {c.statsEstimated && "Base stats are not published yet; the simulator uses a typical value for this rarity."}
            </p>
          )}
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              ["HP (Lv 90)", lv90.hp],
              ["ATK (Lv 90)", lv90.atk],
              ["DEF (Lv 90)", lv90.def],
            ].map(([l, v]) => (
              <div key={l as string} className="card p-3">
                <div className="label">{l}</div>
                <div className="mt-1 font-mono text-xl">{fmt(v as number)}</div>
              </div>
            ))}
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2 text-[13px] sm:grid-cols-3">
            {facts.map(([k, v]) => (
              <div key={k} className="border-b border-line pb-2">
                <dt className="label">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
            {Object.entries(c.voice).map(([k, v]) => (
              <div key={k} className="border-b border-line pb-2">
                <dt className="label">Voice ({k})</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <nav className="sticky top-14 z-20 mt-10 flex gap-5 border-b border-line bg-ink py-3 text-[13px]">
        {["skills", "chain", "weapons", "materials"].map((s) => (
          <a key={s} href={`#${s}`} className="capitalize text-mute no-underline hover:text-fg">
            {s === "chain" ? "Resonance Chain" : s === "weapons" ? "Weapons" : s}
          </a>
        ))}
      </nav>

      <section id="skills" className="mt-8 scroll-mt-28">
        <h2 className="mb-4 text-xl font-semibold">Skills</h2>
        <div className="grid gap-3 lg:grid-cols-2">
          {c.skills.map((s, i) => (
            <SkillBlock key={i} s={s} />
          ))}
          {c.skills.length === 0 && <p className="text-mute">Kit details have not been published yet.</p>}
        </div>
      </section>

      <section id="chain" className="mt-12 scroll-mt-28">
        <h2 className="mb-4 text-xl font-semibold">Resonance Chain</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {c.chain.map((n) => (
            <div key={n.level} className="card p-4">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-accent">S{n.level}</span>
                <h3 className="font-semibold">{n.name}</h3>
              </div>
              <p className="mt-2 text-[14px] text-[#c3c8cc]">{n.desc}</p>
            </div>
          ))}
          {c.chain.length === 0 && <p className="text-mute">Not published yet.</p>}
        </div>
      </section>

      <section id="weapons" className="mt-12 scroll-mt-28">
        <h2 className="mb-1 text-xl font-semibold">Weapons ({c.weapon})</h2>
        <p className="mb-4 text-[13px] text-mute">Signature weapon first, then every 5★ {c.weapon.toLowerCase()}. Compare them with real numbers in the simulator.</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[...sigs, ...bestWeapons.filter((w) => !sigs.includes(w))].map((w) => (
            <Link key={w.slug} href={`/weapons/${w.slug}`} className="card flex items-center gap-3 p-3 no-underline hover:border-line2">
              {w.icon && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={w.icon} alt={w.name} className="h-12 w-12 object-contain" />
              )}
              <div className="min-w-0">
                <div className="truncate text-[14px]">{w.name}</div>
                <div className="text-[12px] text-mute">
                  {sigs.includes(w) ? "Signature · " : ""}ATK {fmt(w.atk * 12.5)} · {w.stat}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section id="materials" className="mt-12 scroll-mt-28">
        <h2 className="mb-4 text-xl font-semibold">Ascension materials</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Boss material", c.materials.boss],
            ["Local specialty", c.materials.local],
            ["Common drop", c.materials.common],
            ["Weekly", c.materials.weekly],
          ]
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k} className="card p-3">
                <div className="label">{k}</div>
                <div className="mt-1">{v}</div>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}
