import type { Metadata } from "next";
import { PageHead, Section } from "@/components/ui";
import { Countdown } from "@/components/Countdown";
import { formatDate } from "@/lib/game";
import { endMs, listEvents, startMs } from "@/server/repos";

export const metadata: Metadata = { title: "Events & Calendar" };
export const revalidate = 300;

export default function EventsPage() {
  const now = Date.now();
  const all = listEvents();
  const active = all.filter((e) => now >= startMs(e.start) && now <= endMs(e.end) && e.end !== "indefinite").sort((a, b) => a.end.localeCompare(b.end));
  const ongoing = all.filter((e) => e.end === "indefinite");
  const upcoming = all.filter((e) => now < startMs(e.start)).sort((a, b) => a.start.localeCompare(b.start));
  const past = all.filter((e) => e.end !== "indefinite" && now > endMs(e.end)).sort((a, b) => b.end.localeCompare(a.end)).slice(0, 80);
  const Row = ({ e, live }: { e: (typeof all)[number]; live?: boolean }) => (
    <tr><td>{e.name}</td><td className="num text-dim">{e.version}</td><td className="text-dim">{formatDate(e.start)} → {formatDate(e.end)}</td><td className="text-right">{live && <Countdown to={e.end} />}</td></tr>
  );
  const T = ({ rows, live }: { rows: typeof all; live?: boolean }) => (
    <div className="card overflow-x-auto scroll-thin"><table className="tbl"><thead><tr><th>Event</th><th>Ver.</th><th>Dates</th><th /></tr></thead><tbody>{rows.map((e) => <Row key={e.name + e.start} e={e} live={live} />)}</tbody></table></div>
  );
  return (
    <div>
      <PageHead kicker="Meta" title="Events & Calendar">Timed events with live countdowns. Dates are Asia server time (UTC+8); other servers reset at different real-world times.</PageHead>
      <Section title={`Active (${active.length})`}>{active.length ? <T rows={active} live /> : <p className="card p-4 text-[13px] text-dim">No timed events are active right now.</p>}</Section>
      {upcoming.length > 0 && <Section title="Upcoming"><T rows={upcoming} /></Section>}
      <Section title={`Always available (${ongoing.length})`}><T rows={ongoing} /></Section>
      <Section title="Recently ended" sub="Latest 80"><T rows={past} /></Section>
    </div>
  );
}
