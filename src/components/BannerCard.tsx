import Link from "next/link";
import type { Banner } from "@/data/schema";
import { formatDate } from "@/lib/game";
import { Countdown } from "./Countdown";

export function BannerCard({ b, state }: { b: Banner; state: "live" | "upcoming" | "ended" }) {
  const kind = b.kind === "weapon" ? "weapon" : "resonator";
  return (
    <article className="card-raised chamfer relative flex flex-col gap-3 p-4 transition-transform duration-200 hover:-translate-y-0.5" style={{ borderTop: "2px solid var(--accent)" }}>
      <div className="flex items-center justify-between gap-2">
        <span className="label">{b.type.replace("Featured ", "")}</span>
        <span className="chip" data-on={state === "live"}>{state === "live" ? "Live" : state === "upcoming" ? "Upcoming" : "Ended"}</span>
      </div>
      <h3 className="font-display text-[17px] leading-snug">{b.name}</h3>
      <div className="flex flex-wrap gap-1.5">
        {b.featured.map((f) =>
          f.slug ? (
            <Link key={f.name} className="chip" href={f.kind === "weapon" ? `/weapons/${f.slug}` : `/characters/${f.slug}`}>{f.name}</Link>
          ) : (
            <span key={f.name} className="chip">{f.name}</span>
          ),
        )}
      </div>
      <div className="mt-auto flex items-center justify-between gap-2 text-[12px] text-dim">
        <span>{formatDate(b.start)} → {formatDate(b.end)}</span>
        {state === "live" && <Countdown to={b.end} />}
      </div>
      {state !== "ended" && (
        <Link href={`/convene?kind=${kind}`} className="btn btn-primary mt-1">Plan this banner</Link>
      )}
    </article>
  );
}
