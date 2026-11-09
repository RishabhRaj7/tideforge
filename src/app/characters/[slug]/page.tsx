import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChainView } from "@/components/ChainView";
import { GameImage } from "@/components/GameImage";
import { OwnedButton } from "@/components/OwnedButton";
import { ReportIssue } from "@/components/ReportIssue";
import { SkillKit } from "@/components/SkillKit";
import { Tabs } from "@/components/Tabs";
import { ConfidenceBadge, ElementBadge, Notice, RarityStars, WeaponBadge } from "@/components/ui";
import { TIER_ENTRIES, TIER_META } from "@/content/tier-list";
import { formatDate } from "@/lib/game";
import { getCharacter, listCharacters, listSonatas, signatureWeapon, weaponsFor } from "@/server/repos";

export function generateStaticParams() {
  return listCharacters().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = getCharacter(slug);
  if (!c) return {};
  return { title: `${c.name} build, kit and chain`, description: `${c.name} (${c.rarity}★ ${c.element} ${c.weapon}): kit multipliers, Resonance Chain, weapons, Sonata sets and materials.` };
}

export default async function CharacterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getCharacter(slug);
  if (!c) notFound();
  const tier = TIER_ENTRIES[c.slug];
  const sig = signatureWeapon(c);
  const weapons = weaponsFor(c).filter((w) => w.slug !== sig?.slug).slice(0, 6);
  const sonatas = listSonatas().filter((s) => s.buffs.some((b) => b.el === c.element)).slice(0, 4);
  const placeholder = c.issues.includes("placeholder-base-stats");
  const noRows = c.issues.includes("no-skill-rows");

  const fact = (label: string, v: string) => v ? (<div key={label} className="flex justify-between gap-4 border-b border-line py-1.5"><dt className="text-dim">{label}</dt><dd className="text-right">{v}</dd></div>) : null;

  const overview = (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="grid content-start gap-4">
        {tier ? (
          <div className="card p-5">
            <div className="label mb-1">Editorial verdict · {tier.role}</div>
            <div className="flex items-center gap-3"><span className="font-display text-3xl text-accent">{tier.tier}</span>{tier.expert && <span className="rounded-sm border border-warn/50 px-1.5 text-[10px] uppercase text-warn">Expert</span>}</div>
            <p className="mt-2 text-mute">{tier.note}</p>
            <p className="mt-2 text-[12px] text-dim">Version {TIER_META.version} · verified {TIER_META.verifiedAt} · <Link href="/tier-list" className="text-accent">full tier list</Link></p>
          </div>
        ) : (
          <Notice tone="info">{c.name} has no editorial rating yet. We rate Resonators once their kit data is complete and measurable.</Notice>
        )}
        {c.intro && <div className="card p-5"><div className="label mb-1">Profile</div><p className="text-mute">{c.intro}</p></div>}
        {c.roles.length > 0 && <div className="flex flex-wrap gap-1.5">{c.roles.map((r) => <span key={r} className="chip">{r}</span>)}</div>}
      </div>
      <aside className="card h-fit p-4 text-[13px]">
        <div className="label mb-2">Quick facts</div>
        <dl>
          {fact("Element", c.element)}{fact("Weapon", c.weapon)}{fact("Class", c.class)}{fact("Released", c.releaseVersion ? `v${c.releaseVersion} · ${formatDate(c.release)}` : formatDate(c.release))}
          {fact("Obtain", c.obtain)}{fact("Favourite dish", c.dish)}
        </dl>
        <div className="label mb-1 mt-4 flex items-center gap-2">Base stats (Lv 1) <ConfidenceBadge level={c.baseStatsConfidence} /></div>
        <dl className="num">
          {fact("HP", String(c.base.hp))}{fact("ATK", String(c.base.atk))}{fact("DEF", String(c.base.def))}
        </dl>
      </aside>
    </div>
  );

  const kit = noRows && c.skills.length === 0 ? <Notice tone="bad">Kit data for {c.name} is not available yet, so skill multipliers and the calculator cannot cover this Resonator.</Notice> : <SkillKit skills={c.skills} />;

  const builds = (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="grid content-start gap-4">
        <div className="card p-5">
          <div className="label mb-2">Weapons ({c.weapon})</div>
          {sig && (
            <Link href={`/weapons/${sig.slug}`} className="card-raised mb-2 flex items-center justify-between p-3 no-underline hover:border-accent">
              <span><span className="block">{sig.name}</span><span className="text-[11.5px] text-dim">Signature · {sig.passive?.name}</span></span><RarityStars n={sig.rarity} />
            </Link>
          )}
          <div className="grid gap-1.5">
            {weapons.map((w) => (
              <Link key={w.slug} href={`/weapons/${w.slug}`} className="flex items-center justify-between rounded px-2 py-1.5 text-[13.5px] no-underline hover:bg-panel2"><span>{w.name}</span><span className="flex items-center gap-2 text-[12px] text-dim">{w.atk} ATK · {w.stat}<RarityStars n={w.rarity} /></span></Link>
            ))}
          </div>
          <p className="mt-3 text-[12px] text-dim">Sorted by rarity and base ATK. Weapon-vs-weapon DPR deltas arrive with the rotation simulator.</p>
        </div>
        <Link href={`/calculator?char=${c.slug}${sig ? `&weapon=${sig.slug}` : ""}`} className="btn btn-primary">Open {c.name} in the Calculator</Link>
      </div>
      <div className="grid content-start gap-4">
        <div className="card p-5">
          <div className="label mb-2">Echo layout (general guidance)</div>
          <p className="text-[13.5px] text-mute">Total cost 12: <b>4-3-3-1-1</b>. Typical carry mains: 4-cost Crit. Rate / Crit. DMG, 3-cost {c.element} DMG or Energy Regen, 1-cost ATK%. Check Energy Regen against your rotation in the calculator.</p>
          <p className="mt-2 text-[12px] text-dim">Not Resonator-specific. Per-character Echo recommendations are on the roadmap.</p>
        </div>
        <div className="card p-5">
          <div className="label mb-2">{c.element} Sonata sets</div>
          {sonatas.length ? sonatas.map((s) => <Link key={s.slug} href={`/sonatas/${s.slug}`} className="block rounded px-2 py-1.5 text-[13.5px] no-underline hover:bg-panel2">{s.name} <span className="text-dim">{s.pieces.join("/")}pc</span></Link>) : <p className="text-[13px] text-dim">No element-specific set in the data.</p>}
        </div>
      </div>
    </div>
  );

  const mats = (
    <div className="grid max-w-2xl gap-3">
      {([["Boss material", c.materials.boss], ["Local specialty", c.materials.local], ["Common drop", c.materials.common], ["Weekly boss", c.materials.weekly]] as const).map(([k, v]) => (
        <div key={k} className="card flex items-center justify-between p-4"><span className="label">{k}</span>{v ? <span>{v}</span> : <span className="text-[13px] text-bad">Not in our data yet</span>}</div>
      ))}
      <p className="text-[12px] text-dim">Quantities per level are not in the dataset yet. See <Link href="/materials" className="text-accent">Materials</Link> to farm for several Resonators at once.</p>
    </div>
  );

  const lore = (
    <div className="grid max-w-2xl gap-4">
      <dl className="card p-4 text-[13.5px]">
        {fact("Title", c.title)}{fact("Real name", c.realname)}{fact("Gender", c.gender)}{fact("Birthday", c.birthday)}{fact("Birthplace", c.birthplace)}{fact("Nation", c.nation)}{fact("Affiliation", c.affiliation)}
        {Object.entries(c.voice).map(([k, v]) => fact(`Voice (${k})`, v))}
      </dl>
    </div>
  );

  return (
    <div data-element={c.element}>
      <section className="relative -mx-4 mb-6 overflow-hidden rounded-xl border border-line md:mx-0">
        <div className="aurora" aria-hidden />
        <div className="relative z-10 grid items-end gap-6 p-5 md:grid-cols-[240px_1fr] md:p-8">
          <GameImage src={c.images.card ?? c.images.icon} alt={`${c.name} portrait`} element={c.element} className="hidden aspect-[3/4] w-[240px] shadow-[0_20px_60px_-20px_var(--accent-glow)] md:block" />
          <div>
            <div className="label mb-2 text-accent">{c.title || "Resonator"}</div>
            <h1 className="text-4xl font-semibold md:text-5xl">{c.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2"><ElementBadge element={c.element} size="md" /><WeaponBadge type={c.weapon} /><RarityStars n={c.rarity} />{tier && <span className="chip" data-on>{tier.tier} · {tier.role}</span>}{c.limited && <span className="chip">Limited</span>}</div>
            <div className="mt-4 flex flex-wrap gap-2"><OwnedButton slug={c.slug} /><Link href={`/calculator?char=${c.slug}`} className="btn">Open in Calculator</Link><ReportIssue /></div>
          </div>
        </div>
      </section>
      {placeholder && <div className="mb-4"><Notice tone="bad"><b>Placeholder base stats.</b> {c.name}&apos;s HP/ATK/DEF in our data are not real game values, so calculator results are not meaningful for this Resonator.</Notice></div>}
      <Tabs
        tabs={[
          { id: "overview", label: "Overview", content: overview },
          { id: "kit", label: "Kit", content: kit },
          { id: "chain", label: "Resonance Chain", content: <ChainView chain={c.chain} /> },
          { id: "builds", label: "Builds", content: builds },
          { id: "materials", label: "Materials", content: mats },
          { id: "lore", label: "Lore", content: lore },
        ]}
      />
      <p className="mt-8 text-[12px] text-dim">Source: {c.provenance.sourceRef} · confidence <ConfidenceBadge level={c.provenance.confidence} /> · checked {c.provenance.verifiedAt}</p>
    </div>
  );
}
