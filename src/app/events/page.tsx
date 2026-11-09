import type { Metadata } from "next";
import { PageHead } from "@/components/ui";
import { events } from "@/lib/data";

export const metadata: Metadata = { title: "Events" };

export default function EventsPage() {
  const byVersion = new Map<string, typeof events>();
  for (const e of events) byVersion.set(e.version, [...(byVersion.get(e.version) || []), e]);
  const versions = [...byVersion.keys()].sort((a, b) => {
    const [a1, a2] = a.split(".").map(Number);
    const [b1, b2] = b.split(".").map(Number);
    return b1 - a1 || b2 - a2;
  });
  return (
    <div>
      <PageHead kicker="Archive" title="Events">
        {events.length} events from version 1.0 onward, grouped by patch with their run dates.
      </PageHead>
      <div className="mb-8 flex flex-wrap gap-2">
        {versions.map((v) => (
          <a key={v} href={`#v${v}`} className="chip no-underline hover:text-fg">
            v{v}
          </a>
        ))}
      </div>
      <div className="space-y-8">
        {versions.map((v) => (
          <section key={v} id={`v${v}`} className="scroll-mt-24">
            <h2 className="mb-2 text-lg font-semibold">
              Version {v} <span className="text-[13px] font-normal text-dim">{byVersion.get(v)!.length} events</span>
            </h2>
            <div className="card">
              <table className="tbl">
                <tbody>
                  {byVersion.get(v)!.map((e, i) => (
                    <tr key={i}>
                      <td>{e.name}</td>
                      <td className="whitespace-nowrap text-right text-mute">
                        {e.start} – {e.end}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
