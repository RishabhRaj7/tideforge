import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/ui";
import { characters, ELEMENT_COLOR } from "@/lib/data";

export const metadata: Metadata = { title: "Tier List" };

type Tier = "S" | "A" | "B";
// Editorial ratings. Resonators that are not listed are shown as unrated until they have been tested.
const RATINGS: Record<string, [string, Tier]> = {
  camellya: ["Main DPS", "S"],
  jinhsi: ["Main DPS", "S"],
  changli: ["Main DPS", "S"],
  "xiangli-yao": ["Main DPS", "S"],
  carlotta: ["Main DPS", "S"],
  phrolova: ["Main DPS", "S"],
  zani: ["Main DPS", "S"],
  galbrena: ["Main DPS", "S"],
  phoebe: ["Main DPS", "S"],
  jiyan: ["Main DPS", "A"],
  calcharo: ["Main DPS", "A"],
  encore: ["Main DPS", "A"],
  brant: ["Main DPS", "A"],
  roccia: ["Main DPS", "A"],
  lupa: ["Main DPS", "A"],
  yinlin: ["Sub DPS", "S"],
  cantarella: ["Sub DPS", "S"],
  mortefi: ["Sub DPS", "A"],
  chixia: ["Main DPS", "B"],
  yangyang: ["Sub DPS", "B"],
  danjin: ["Main DPS", "B"],
  yuanwu: ["Sub DPS", "B"],
  taoqi: ["Support", "A"],
  aalto: ["Sub DPS", "B"],
  lumi: ["Support", "B"],
  shorekeeper: ["Support", "S"],
  verina: ["Support", "A"],
  cartethyia: ["Support", "S"],
  baizhi: ["Support", "B"],
  youhu: ["Support", "B"],
  sanhua: ["Sub DPS", "B"],
  lingyang: ["Main DPS", "B"],
  zhezhi: ["Sub DPS", "A"],
};

export default function TierListPage() {
  const roles = ["Main DPS", "Sub DPS", "Support"];
  const tiers: Tier[] = ["S", "A", "B"];
  const unrated = characters.filter((c) => !RATINGS[c.slug]);
  return (
    <div>
      <PageHead kicker="Editorial" title="Tier List">
        Our rankings by role. They weigh damage ceiling, consistency and how much a Resonator adds to a team. Newer Resonators stay unrated until we have tested them; use the Build Simulator to measure any of them.
      </PageHead>
      {roles.map((role) => (
        <section key={role} className="mb-10">
          <h2 className="mb-3 text-lg font-semibold">{role}</h2>
          <div className="card divide-y divide-line">
            {tiers.map((t) => {
              const list = characters.filter((c) => RATINGS[c.slug]?.[0] === role && RATINGS[c.slug][1] === t);
              return (
                <div key={t} className="grid grid-cols-[56px_1fr]">
                  <div className="flex items-center justify-center border-r border-line text-xl font-semibold" style={{ color: t === "S" ? "#d7b46a" : t === "A" ? "#c3c8cc" : "#8e969d" }}>
                    {t}
                  </div>
                  <div className="flex min-h-[72px] flex-wrap gap-2 p-3">
                    {list.length === 0 && <span className="self-center text-[12px] text-dim">—</span>}
                    {list.map((c) => (
                      <Link key={c.slug} href={`/characters/${c.slug}`} className="w-[72px] no-underline" title={c.name}>
                        <div className="h-[72px] w-[72px] overflow-hidden bg-panel2" style={{ borderBottom: `2px solid ${ELEMENT_COLOR[c.element]}` }}>
                          {c.images.icon && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={c.images.icon} alt={c.name} className="h-full w-full object-cover" />
                          )}
                        </div>
                        <div className="mt-1 truncate text-center text-[11px] text-mute">{c.name}</div>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Unrated</h2>
        <div className="flex flex-wrap gap-2">
          {unrated.map((c) => (
            <Link key={c.slug} href={`/characters/${c.slug}`} className="chip no-underline hover:text-fg">
              {c.name}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
