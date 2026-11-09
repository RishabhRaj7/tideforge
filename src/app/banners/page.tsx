import type { Metadata } from "next";
import { BannerCard } from "@/components/BannerCard";
import { PageHead, Section } from "@/components/ui";
import { bannerStatus, currentBanners, listBanners, upcomingBanners, versions } from "@/server/repos";

export const metadata: Metadata = { title: "Banners & Convene History", description: "Live, upcoming and past Wuthering Waves Convene banners with countdowns and rerun history." };
export const revalidate = 300;

export default function BannersPage() {
  const now = Date.now();
  const cur = currentBanners(now);
  const up = upcomingBanners(now);
  const history = listBanners().filter((b) => bannerStatus(b, now) === "ended" && !(cur.banners.includes(b))).sort((a, b) => b.start.localeCompare(a.start));
  const vers = versions().map((v) => v.version);
  // rerun tracker: how many times each featured Resonator has been on a banner
  const runs = new Map<string, { name: string; list: string[] }>();
  for (const b of listBanners().filter((x) => x.kind === "resonator"))
    for (const f of b.featured) {
      const e = runs.get(f.name) ?? { name: f.name, list: [] };
      if (!e.list.includes(b.version)) e.list.push(b.version);
      runs.set(f.name, e);
    }
  const rerun = [...runs.values()].sort((a, b) => b.list.length - a.list.length || a.name.localeCompare(b.name));
  return (
    <div>
      <PageHead kicker="Meta" title="Banners">{cur.live ? "What is live now, what is next, and everything before it." : "No banner is live at the moment. Showing the most recent window."} Dates use Asia server time (UTC+8).</PageHead>
      <Section title={cur.live ? "Live now" : "Most recent"}>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{cur.banners.map((b) => <BannerCard key={b.name + b.type} b={b} state={cur.live ? "live" : "ended"} />)}</div>
      </Section>
      <Section title="Upcoming" sub="Only banners present in the dataset (official status).">
        {up.length ? <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{up.map((b) => <BannerCard key={b.name + b.type} b={b} state="upcoming" />)}</div> : <p className="card p-4 text-[13px] text-dim">No upcoming banners have been announced in our data yet.</p>}
      </Section>
      <Section title="Rerun tracker" sub={`Versions in which each Resonator headlined a Featured Resonator Convene (${vers.length} versions tracked).`}>
        <div className="card overflow-x-auto scroll-thin">
          <table className="tbl"><thead><tr><th>Resonator</th><th>Runs</th><th>Versions</th></tr></thead><tbody>
            {rerun.map((r) => <tr key={r.name}><td className="font-medium">{r.name}</td><td className="num">{r.list.length}</td><td className="text-dim">{r.list.join(", ")}</td></tr>)}
          </tbody></table>
        </div>
      </Section>
      <Section title="History" sub={`${history.length} past banners`}>
        <div className="card max-h-[520px] overflow-auto scroll-thin">
          <table className="tbl"><thead><tr><th>Version</th><th>Banner</th><th>Type</th><th>Featured</th></tr></thead><tbody>
            {history.map((b) => <tr key={b.name + b.start + b.type}><td className="num">{b.version}</td><td>{b.name}</td><td className="text-dim">{b.type.replace("Featured ", "")}</td><td>{b.featured.map((f) => f.name).join(", ")}</td></tr>)}
          </tbody></table>
        </div>
      </Section>
    </div>
  );
}
