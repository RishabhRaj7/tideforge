import Link from "next/link";
import { Reveal } from "@/components/motion";
import { BannerCard } from "@/components/BannerCard";
import { Countdown } from "@/components/Countdown";
import { ElementBadge, Section } from "@/components/ui";
import { GameImage } from "@/components/GameImage";
import { TIER_ENTRIES, TIER_META } from "@/content/tier-list";
import { formatDate } from "@/lib/game";
import { currentBanners, GAME_VERSION, getReport, liveEvents, listCharacterCards, upcomingBanners } from "@/server/repos";

export const revalidate = 300;

const TOOLS = [
  { href: "/calculator", title: "Damage Calculator", text: "Build, enemy and rotation with a full explain panel." },
  { href: "/convene", title: "Convene Planner", text: "Pity, 50/50 and the odds of getting your pull." },
  { href: "/tier-list", title: "Tier List", text: "Role and element filters, public changelog." },
  { href: "/materials", title: "Materials", text: "Farm one boss for several Resonators." },
];

export default function Home() {
  const now = Date.now();
  const cur = currentBanners(now);
  const events = liveEvents(now).slice(0, 6);
  const cards = listCharacterCards();
  const newest = [...cards].sort((a, b) => b.release.localeCompare(a.release)).slice(0, 6);
  const top = cards.filter((c) => TIER_ENTRIES[c.slug] && ["T0", "T0.5"].includes(TIER_ENTRIES[c.slug].tier));
  const topDps = top.filter((c) => TIER_ENTRIES[c.slug].role === "Main DPS").slice(0, 5);
  const topSup = cards.filter((c) => TIER_ENTRIES[c.slug] && ["Support", "Healer", "Sub DPS"].includes(TIER_ENTRIES[c.slug].role) && ["T0", "T0.5"].includes(TIER_ENTRIES[c.slug].tier)).slice(0, 5);
  const windowEnd = cur.banners.reduce((m, b) => (b.end > m ? b.end : m), "");
  const upcoming = upcomingBanners(now).slice(0, 3);
  const quality = getReport().coverage[0];

  return (
    <div>
      <section className="relative -mx-4 mb-10 overflow-hidden rounded-xl border border-line px-5 py-12 md:mx-0 md:px-10 md:py-16" data-element="Spectro">
        <div className="aurora" aria-hidden />
        <div className="relative z-10 max-w-2xl">
          <div className="label mb-3 text-accent">Version {GAME_VERSION} · {cur.live ? "Live now" : "Latest known window"}</div>
          <h1 className="text-4xl font-semibold leading-[1.1] md:text-6xl">Forge your <span className="text-accent">resonance</span>.</h1>
          <p className="mt-4 max-w-xl text-mute">The meta, your builds and your numbers in one tab. Every value shows where it came from, and every formula is public.</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link href="/calculator" className="btn btn-primary chamfer">Open the calculator</Link>
            <Link href="/tier-list" className="btn">See the tier list</Link>
          </div>
          {windowEnd && (
            <div className="mt-6 text-[13px] text-mute">
              Version window ends: <Countdown to={windowEnd} /> <span className="text-dim">(Asia server time)</span>
            </div>
          )}
        </div>
      </section>

      <Section title={cur.live ? "Live banners" : "Most recent banners"} sub={`Version ${GAME_VERSION}. Dates are Asia server time (UTC+8).`} action={<Link href="/banners" className="text-[13px] text-accent">All banners →</Link>}>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {cur.banners.map((b, i) => (
            <Reveal key={b.name + b.type} delay={i * 0.04}><BannerCard b={b} state={cur.live ? "live" : "ended"} /></Reveal>
          ))}
        </div>
        {upcoming.length > 0 && <p className="mt-3 text-[13px] text-dim">Next: {upcoming.map((b) => b.featured.map((f) => f.name).join(", ")).join(" · ")}</p>}
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Meta snapshot" sub={`Editorial · verified ${TIER_META.verifiedAt}`} action={<Link href="/tier-list" className="text-[13px] text-accent">Full list →</Link>}>
          <div className="card divide-y divide-line">
            {[["Top Main DPS", topDps], ["Top Support / Sub DPS", topSup]].map(([label, list]) => (
              <div key={label as string} className="p-3">
                <div className="label mb-2">{label as string}</div>
                <div className="flex flex-wrap gap-1.5">
                  {(list as typeof topDps).map((c) => (
                    <Link key={c.slug} href={`/characters/${c.slug}`} className="chip no-underline"><ElementBadge element={c.element} /> {c.name} <span className="text-dim">{TIER_ENTRIES[c.slug].tier}</span></Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Events ending soon" action={<Link href="/events" className="text-[13px] text-accent">Calendar →</Link>}>
          <div className="card divide-y divide-line">
            {events.length === 0 && <div className="p-4 text-[13px] text-dim">No timed events are running right now.</div>}
            {events.map((e) => (
              <div key={e.name + e.start} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13px]">
                <span>{e.name}</span>
                <span className="shrink-0 text-dim">ends {formatDate(e.end)}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <Section title="Quick tools">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TOOLS.map((t, i) => (
            <Reveal key={t.href} delay={i * 0.05}>
              <Link href={t.href} className="card-raised block h-full p-4 no-underline transition-colors hover:border-accent">
                <div className="font-display text-[15px]">{t.title}</div>
                <p className="mt-1 text-[13px] text-dim">{t.text}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section title="Newest Resonators">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {newest.map((c) => (
            <Link key={c.slug} href={`/characters/${c.slug}`} data-element={c.element} className="card-raised group block overflow-hidden no-underline transition-colors hover:border-accent">
              <GameImage src={c.images.card ?? c.images.icon} alt={c.name} element={c.element} className="aspect-[4/5] w-full" rounded="0" />
              <div className="p-2.5">
                <div className="text-[13.5px] font-medium">{c.name}</div>
                <div className="flex items-center justify-between"><ElementBadge element={c.element} /><span className="text-[11px] text-dim">v{c.releaseVersion}</span></div>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <section className="card-raised grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <div className="label mb-1 text-accent">Start here</div>
          <h2 className="font-display text-lg">New to Wuthering Waves?</h2>
          <p className="mt-1 max-w-2xl text-[13.5px] text-mute">Learn the terms in the glossary, then pick a Resonator and open their Builds tab. Add the ones you own to your roster (stored on this device only).</p>
        </div>
        <div className="flex gap-2"><Link href="/glossary" className="btn">Glossary</Link><Link href="/characters" className="btn btn-primary">Browse Resonators</Link></div>
      </section>
      <p className="mt-6 text-[12px] text-dim">
        Data transparency: {quality.ok}/{quality.total} Resonators have non-placeholder base stats. <Link href="/data-status" className="text-accent">See the full data status →</Link>
      </p>
    </div>
  );
}
