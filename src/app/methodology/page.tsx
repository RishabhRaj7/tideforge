import type { Metadata } from "next";
import { ConfidenceBadge, PageHead } from "@/components/ui";
import { CONVENE, ENEMY_PRESETS, CHAR_LEVEL_CONFIDENCE } from "@/engine";

export const metadata: Metadata = { title: "Methodology", description: "The formulas, assumptions and confidence levels behind every Tideforge number." };

export default function MethodologyPage() {
  return (
    <div>
      <PageHead kicker="Trust" title="Methodology">Every number on Tideforge comes from a formula or a dataset described here. If something looks wrong, use the report button and we will check it.</PageHead>
      <div className="prose-wuwa max-w-3xl">
        <h2>Damage formula</h2>
        <p>The calculator multiplies independent zones:</p>
        <p><code>DMG = Multiplier × Base stat × (1 + Σ DMG Bonus) × (1 + Deepen) × (1 + Amplify) × Crit × DEF zone × RES zone</code></p>
        <ul>
          <li><b>Base stat</b> is ATK, HP or DEF per hit (auto-detected from the hit label, overridable). Final stat = (Resonator base + weapon base ATK) × (1 + Σ%) + Σ flat.</li>
          <li><b>DMG Bonus</b> adds element, skill-type (Basic, Heavy, Skill, Liberation, Intro, Outro, Echo) and generic bonuses together. Deepen and Amplify are separate multiplicative zones.</li>
          <li><b>Crit</b> uses the average: 1 + CR × (CD − 1), with CR capped at 100%. Base 5% CR and 150% CD.</li>
        </ul>
        <h2>DEF zone</h2>
        <p><code>(800 + 8·AtkLv) / (800 + 8·AtkLv + (8·EnemyLv + 792) × (1 − DEFIgnore))</code></p>
        <h2>RES zone</h2>
        <p>With effective RES = enemy RES − shred:</p>
        <ul><li>RES &lt; 0: <code>1 − RES / 2</code></li><li>0 ≤ RES &lt; 80%: <code>1 − RES</code></li><li>RES ≥ 80%: <code>1 / (1 + 5 × RES)</code></li></ul>
        <h2>Convene</h2>
        <p>5★ base rate <b>{CONVENE.baseRate5 * 100}%</b> and hard pity <b>{CONVENE.hardPity}</b> are official. The soft-pity ramp starting near pull <b>{CONVENE.softPityStart}</b> is a community fit (<ConfidenceBadge level="community" />), applied as a linear ramp to hard pity. Featured Resonator banners: 50/50, then a guarantee. Featured Weapon banners: the featured weapon is guaranteed. 1 Convene = {CONVENE.astritePerPull} Astrite.</p>
        <h2>Stat weights</h2>
        <p>Computed by finite difference: add one average substat roll of a stat to the current build and report the percentage change in total rotation damage. Average roll is the mean of the roll table because tier probabilities are not in our data yet.</p>
        <h2>Enemy presets</h2>
        <ul>{ENEMY_PRESETS.filter((p) => p.id !== "custom").map((p) => <li key={p.id}>{p.label}: level {p.level}, {p.res}% RES. <ConfidenceBadge level={p.confidence} /></li>)}</ul>
        <h2>Confidence levels</h2>
        <ul>
          <li><ConfidenceBadge level="datamined" /> read from game files.</li>
          <li><ConfidenceBadge level="official" /> confirmed by an official Kuro post.</li>
          <li><ConfidenceBadge level="tested" /> verified in-game by contributors.</li>
          <li><ConfidenceBadge level="community" /> community wiki data, not yet verified against game files. This is currently the level of most of our dataset.</li>
          <li><ConfidenceBadge level="estimated" /> placeholder or interpolated. Never rely on it.</li>
        </ul>
        <h2>Known limitations</h2>
        <ul>
          <li>Character level multipliers are estimated at Lv 20 and Lv 90 ({CHAR_LEVEL_CONFIDENCE}); other levels use community tables.</li>
          <li>A single shared skill-level curve is applied to every skill.</li>
          <li>No timeline: hits are summed with no cooldown, Energy or Concerto validation.</li>
          <li>No negative-status damage (Frazzle, Erosion, Bane, Burst, Chafe, Flare) and no Tune Break yet.</li>
          <li>Resonance Chain, inherent skills and teammate outro buffs are not modelled; enter them under Manual adjustments.</li>
          <li>Weapons and Sonata sets whose passive could not be parsed are marked and contribute nothing.</li>
        </ul>
        <p>See the <a href="/data-status" className="text-accent">Data Status</a> page for live coverage numbers.</p>
      </div>
    </div>
  );
}
