// Editorial tier list. This is OPINION, versioned in git and reviewed by PR (see docs/CONTRIBUTING.md).
// Objective (engine DPR) scores are intentionally not published yet: the timeline simulator and team engine are on the roadmap.
export const TIERS = ["T0", "T0.5", "T1", "T1.5", "T2"] as const;
export type Tier = (typeof TIERS)[number];
export const ROLES = ["Main DPS", "Sub DPS", "Support", "Healer"] as const;
export type Role = (typeof ROLES)[number];

export const TIER_META = { version: "3.7", verifiedAt: "2026-11-09", author: "Tideforge editorial" };

type Entry = { role: Role; tier: Tier; note: string; expert?: boolean };

export const TIER_ENTRIES: Record<string, Entry> = {
  camellya: { role: "Main DPS", tier: "T0", note: "Highest single-target ceiling among standard-banner-era carries; demanding execution.", expert: true },
  jinhsi: { role: "Main DPS", tier: "T0.5", note: "Reliable burst-window DPS with a strong signature weapon." },
  changli: { role: "Main DPS", tier: "T0.5", note: "Fusion carry that thrives on swap-in damage and quick rotations." },
  "xiangli-yao": { role: "Main DPS", tier: "T0.5", note: "Strong Electro carry with excellent off-field flexibility." },
  carlotta: { role: "Main DPS", tier: "T0.5", note: "Glacio carry with high burst and clear team requirements." },
  phrolova: { role: "Main DPS", tier: "T0.5", note: "Havoc carry that rewards long fights and disciplined sub-DPS pairing.", expert: true },
  zani: { role: "Main DPS", tier: "T0.5", note: "Spectro carry with high ceiling when her buff windows are respected." },
  galbrena: { role: "Main DPS", tier: "T0.5", note: "Fusion pistol carry with strong sustained output." },
  phoebe: { role: "Main DPS", tier: "T0.5", note: "Spectro carry with simple rotation and good consistency." },
  jiyan: { role: "Main DPS", tier: "T1", note: "Timeless Aero broadblade carry; still strong with the right support." },
  brant: { role: "Main DPS", tier: "T1", note: "Fusion carry with good consistency and self-sufficient buffs." },
  lupa: { role: "Main DPS", tier: "T1", note: "Fusion carry with team-buff synergy and moderate difficulty." },
  calcharo: { role: "Main DPS", tier: "T1.5", note: "Simple Electro carry; falls behind newer options in ceiling." },
  encore: { role: "Main DPS", tier: "T1.5", note: "Fusion rectifier carry; accessible but with lower ceiling." },
  roccia: { role: "Main DPS", tier: "T1.5", note: "Havoc gauntlet carry; niche and team-dependent." },
  chixia: { role: "Main DPS", tier: "T2", note: "Early-game Fusion pistol DPS; outclassed at endgame." },
  danjin: { role: "Main DPS", tier: "T2", note: "Havoc sword DPS; outclassed at endgame." },
  lingyang: { role: "Main DPS", tier: "T2", note: "Glacio gauntlet DPS; outclassed at endgame." },
  yinlin: { role: "Sub DPS", tier: "T0.5", note: "Premier Electro sub-DPS: reliable off-field damage and strong outro." },
  cantarella: { role: "Sub DPS", tier: "T0.5", note: "Havoc sub-DPS/healer hybrid with broad team compatibility." },
  mortefi: { role: "Sub DPS", tier: "T1", note: "Fusion pistol sub-DPS; steady off-field damage and Fusion support." },
  zhezhi: { role: "Sub DPS", tier: "T1", note: "Glacio sub-DPS; supports Glacio/Spectro teams." },
  yangyang: { role: "Sub DPS", tier: "T2", note: "Aero sub-DPS; still useful as a budget enabler." },
  yuanwu: { role: "Sub DPS", tier: "T2", note: "Electro DEF-scaling sub; niche." },
  aalto: { role: "Sub DPS", tier: "T2", note: "Aero pistol sub; niche utility." },
  sanhua: { role: "Sub DPS", tier: "T2", note: "Glacio sub-DPS; budget option." },
  shorekeeper: { role: "Support", tier: "T0", note: "Defining Spectro healer/buffer; fits nearly every team." },
  cartethyia: { role: "Support", tier: "T0.5", note: "Aero support-healer with strong Aero team value." },
  verina: { role: "Healer", tier: "T1", note: "Dependable Spectro healer with team-wide ATK buff." },
  taoqi: { role: "Support", tier: "T1.5", note: "DEF-based Havoc support with shielding." },
  lumi: { role: "Support", tier: "T2", note: "Electro support; niche." },
  baizhi: { role: "Healer", tier: "T2", note: "Glacio healer; budget option." },
  youhu: { role: "Healer", tier: "T2", note: "Glacio healer; budget option." },
};

export const TIER_CHANGELOG: { date: string; patch: string; title: string; changes: string[] }[] = [
  {
    date: "2026-11-09",
    patch: "3.7",
    title: "Tideforge tier list v1.0",
    changes: [
      "First published version. Migrated from the previous S/A/B list to the finer T0 to T2 scale.",
      "Resonators without a rating (newest releases and anyone with incomplete kit data) are listed as Unrated instead of guessed.",
      "Objective DPR scores will be added once the timeline simulator and team engine ship.",
    ],
  },
];
