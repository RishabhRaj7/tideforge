import type { Metadata } from "next";
import { PageHead } from "@/components/ui";

export const metadata: Metadata = { title: "Glossary" };

const TERMS: [string, string][] = [
  ["Resonator", "A playable character. Resonators are classed by element (Glacio, Fusion, Electro, Aero, Spectro, Havoc) and weapon type."],
  ["Rover", "The protagonist. Rover can change element and has Spectro, Havoc, Aero and Electro variants with their own kits."],
  ["Echo", "A captured Tacet Discord creature equipped in one of five slots. Echoes provide main stats, substats, a Sonata and an active Echo Skill."],
  ["Echo cost", "Echoes cost 1, 3 or 4. A Resonator can equip up to 12 total cost across five slots, usually 4-3-3-1-1."],
  ["Sonata", "The set an Echo belongs to. Two and five matching Echoes unlock set bonuses (one and three for the special sets)."],
  ["Phantom Echo", "A cosmetic-and-stat variant of an Echo with an alternate appearance; counts as the same Echo for set purposes."],
  ["Nightmare Echo", "A stronger variant of an Echo found in Nightmare encounters with an alternate Sonata pool."],
  ["Forte Circuit", "A character's unique mechanic and gauge, filled by playing the kit and spent on enhanced attacks."],
  ["Intro Skill", "A skill triggered when the Resonator is switched in while Concerto Energy is full."],
  ["Outro Skill", "The skill triggered when the Resonator is switched out with full Concerto Energy; usually a team buff or a damage boost for the next character."],
  ["Concerto Energy", "A shared bar filled by skills and attacks. At full, switching characters triggers the Outro and Intro skills."],
  ["Resonance Skill", "The character's main cooldown skill. Cooldowns vary between kits."],
  ["Resonance Liberation", "The ultimate. Costs Resonance Energy and is the biggest damage cooldown in most kits."],
  ["Resonance Energy", "The ultimate resource. Energy Regen scales how fast it fills."],
  ["Energy Regen", "A stat that multiplies Resonance Energy gain. Most rotations need a minimum threshold for Liberation uptime."],
  ["Resonance Chain", "The sequence nodes (S1–S6), unlocked by duplicate copies or Waveband items."],
  ["Waveband", "Character-specific item used to unlock Resonance Chain nodes."],
  ["Convene", "The gacha system. Featured Resonator and Featured Weapon banners have separate pity."],
  ["Pity", "The counter since your last 5★. Hard pity is 80 for Resonator banners; the featured guarantee applies after losing a 50/50."],
  ["Astrite", "Premium currency used to buy Radiant Tide, Forging Tide and Lustrous Tide items for Convenes."],
  ["Radiant Tide", "The Convene item used on Featured Resonator banners."],
  ["Forging Tide", "The Convene item used on Featured Weapon banners."],
  ["Lustrous Tide", "The paid Convene item purchased with Lunite."],
  ["Lunite", "Premium paid currency."],
  ["Shell Credit", "The main soft currency used for levelling and crafting."],
  ["Waveplate", "Stamina. Spent on Tacet Fields, bosses and simulation challenges; capped at 240 and refills over time."],
  ["Tacet Field", "Open-world and domain activities where Echoes and Echo materials can be farmed."],
  ["Simulation Challenge", "Domain-style challenges that drop levelling and ascension materials."],
  ["Tower of Adversity", "Endgame tower with Hazard, Stable and Experimental zones, resetting on a fixed cycle."],
  ["Whimpering Wastes", "A rotating endgame challenge with team-based clears and cumulative scoring."],
  ["Hologram Challenge", "A skill-based challenge mode with periodic rewards."],
  ["Weekly boss", "A boss that drops high-tier ascension and skill materials once per week with Waveplate discount."],
  ["Skill levels", "Each skill levels from 1 to 10; the damage multiplier follows the same curve for every skill."],
  ["DMG Bonus", "An additive group: elemental bonus plus skill-type bonus plus other bonuses are summed before multiplying."],
  ["DMG Deepen", "A separate multiplicative layer, applied independently from DMG Bonus."],
  ["DMG Amplify", "Another independent multiplicative layer, often from team buffs."],
  ["RES shred", "Reduces the target's elemental resistance, increasing damage dealt."],
  ["DEF ignore", "Ignores a share of the enemy's defence, raising damage."],
  ["Coordinated Attack", "Damage dealt by a Resonator in response to another action, such as Intro-triggered strikes."],
  ["Spectro Frazzle", "A Spectro damage-over-time effect applied by certain characters."],
  ["Aero Erosion", "An Aero damage-over-time effect that stacks on the target."],
  ["Havoc Bane", "A Havoc damage-over-time effect that stacks on the target."],
  ["Glacio Chafe", "A Glacio damage-over-time effect that stacks on the target."],
  ["Fusion Burst", "A Fusion damage-over-time effect that stacks on the target."],
  ["Electro Flare", "An Electro damage-over-time effect that stacks on the target."],
  ["Tune Rupture / Tune Break", "Mechanics of the Tune system: building and breaking a target's Tune gauge to deal bonus damage or trigger effects."],
];

export default function GlossaryPage() {
  return (
    <div>
      <PageHead kicker="Reference" title="Glossary">
        The terminology you will meet in guides, builds and the simulator.
      </PageHead>
      <dl className="card divide-y divide-line">
        {TERMS.map(([t, d]) => (
          <div key={t} className="grid gap-1 p-4 md:grid-cols-[240px_1fr] md:gap-6">
            <dt className="font-medium">{t}</dt>
            <dd className="text-[14px] text-[#c3c8cc]">{d}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
