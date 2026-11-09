import type { Metadata } from "next";
import { PageHead } from "@/components/ui";

export const metadata: Metadata = { title: "Credits & Sources", description: "Where Tideforge data and art come from, and how each source is used." };

const SOURCES: { name: string; href: string; use: string; status: string }[] = [
  { name: "nanoka.cc", href: "https://nanoka.cc", use: "Datamined stats, per-level skill multipliers, weapon curves and mirrored art.", status: "Primary data source" },
  { name: "Arikatsu / WutheringWaves_Data", href: "https://github.com/Arikatsu/WutheringWaves_Data", use: "Raw game tables used to cross-check numbers and as a public fallback.", status: "Cross-check (planned)" },
  { name: "Prydwen", href: "https://www.prydwen.gg/wuthering-waves/", use: "Ratings, builds and team opinions, shown only as attributed, dated, linked opinions.", status: "Editorial layer (planned)" },
  { name: "Slyraf", href: "https://slyraf.com/en/wuthering-waves/", use: "Tier and DPR opinions for the Consensus view, and methodology ideas. Reference and display only.", status: "Editorial layer (planned)" },
  { name: "TheWuWaCalculator", href: "https://thewuwacalculator.com/", use: "Used interactively as a test oracle for our calculator. No code or data is copied.", status: "Test oracle" },
  { name: "Community wiki", href: "https://wutheringwaves.fandom.com/", use: "Descriptive fields not available in the datamine (for example obtain text), flagged community confidence.", status: "Fallback" },
];

export default function CreditsPage() {
  return (
    <div>
      <PageHead kicker="Project" title="Credits & Sources">Tideforge stands on other people&apos;s work. This is what we use from each source and how.</PageHead>
      <div className="card divide-y divide-line">
        {SOURCES.map((s) => (
          <div key={s.name} className="grid gap-1 p-4 md:grid-cols-[240px_1fr_180px] md:items-center">
            <a href={s.href} target="_blank" rel="noreferrer" className="font-medium text-accent">{s.name}</a>
            <p className="text-[13.5px] text-mute">{s.use}</p>
            <span className="chip w-fit">{s.status}</span>
          </div>
        ))}
      </div>
      <div className="prose-wuwa mt-8 max-w-3xl">
        <h2>Disclaimer</h2>
        <p>Tideforge is an unofficial, non-commercial fan project and is not affiliated with Kuro Games. Wuthering Waves and all related names, text and art are the property of Kuro Games. Art is mirrored from public sources for reference in this fan project only. If you are a rights holder and want something removed, open an issue and it will be taken down.</p>
        <h2>Licensing</h2>
        <p>The source code is MIT licensed. Game assets and third-party data are not covered by that license (see <code>DATA-LICENSE.md</code>). Our scraping rules and permissions are documented in <code>docs/PERMISSIONS.md</code>.</p>
      </div>
    </div>
  );
}
