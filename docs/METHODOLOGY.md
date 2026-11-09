# Methodology

How Tideforge computes numbers, what is exact and what is still an estimate. The public version of this page is `/methodology`.
Rule of thumb: **if we are not sure, we say so** (confidence badges, "Unmodelled" chips, and, once rotations land, "Incomplete" results).

## 1. Confidence levels
| Level | Meaning |
|---|---|
| `datamined` | Read from game data (nanoka.cc, cross-checkable against Arikatsu/WutheringWaves_Data) |
| `official` | Confirmed by an official Kuro post |
| `tested` | Verified in game by a contributor (golden test) |
| `community` | Wiki data not yet verified against game files |
| `estimated` | Placeholder or interpolated. Do not rely on it |
| `computed` *(planned)* | Output of our engine (DPR, weapon %, priorities) |

## 2. Stats
- **Resonator base stats:** exact datamined `[HP, ATK, DEF]` per ascension (0-6) and level, looked up by the engine's level labels (`LEVEL_ASC` in `src/engine/constants.ts`). Resonators without a datamine entry (currently Lily) fall back to the estimated multiplier table `CHAR_LEVELS`.
- **Weapon stats:** exact datamined base ATK and secondary stat per ascension and level (`levelCurve`); fallback `WEAPON_LEVELS` ratios.
- **Final stat:** `base * (1 + sum(% bonuses)) + flat`. Base ATK includes the weapon's ATK.
- **Not yet exact:** echo main/substat values (`ECHO_MAIN`, `SUB_VALUES`, `ECHO_FIXED`), minor fortes (`FORTE_OPTIONS`), enemy presets. See ROADMAP P4-1/P4-3.

## 3. Damage formula (implemented in `src/engine/damage.ts` and `calc.ts`)
```
damage = base stat x row multiplier x (1 + bonus) x (1 + deepen) x (1 + amplify) x DEF zone x RES zone x crit zone
```
- **Row multiplier:** sum of `value x hits` of the row, as a fraction, scaled by the skill level. Currently scaled by one community-estimated skill curve (`SKILL_CURVE`). The per-skill, per-level multipliers are already generated (`src/data/generated/skill-levels/`) and will replace this curve (P4-1).
- **Bonus zone:** additive sum of element, skill-type (basic/heavy/skill/liberation/intro/outro/echo skill) and all-DMG bonuses.
- **Deepen / amplify:** separate multiplicative zones.
- **DEF zone:** `(800 + 8*Lattacker) / (800 + 8*Lattacker + (8*Lenemy + 792) * (1 - ignore))`, clamped to (0, 2]. *Constants still to be verified against golden tests.*
- **RES zone (three branches), r = enemy RES after shred:** `r < 0`: `1 - r/2`; `0 <= r < 0.8`: `1 - r`; `r >= 0.8`: `1 / (1 + 5r)`.
- **Crit zone:** none = 1; crit = `CD`; average = `1 + CR*(CD - 1)` with CR capped to 100%. Base CR 5%, base CD 150%, base ER 100%.
- Every calculation returns an **explain trace** (each zone and each stat source) shown in the calculator.

## 4. Not modelled yet (shown as such)
Negative Statuses (Glacio Chafe, Fusion Burst, Electro Flare, Aero Erosion, Spectro Frazzle, Havoc Bane), Tune Break/Rupture/Strain, Concerto and resonance-energy simulation, healing and shield rows, Unison, chain/inherent/forte effects, weapon passives flagged unmodelled. A weapon or Sonata effect that is not machine-readable adds nothing to damage and is labelled with an "Unmodelled" chip.

## 5. Rankings (planned, see PLAN section 10.9)
- Our DPR will come from the same engine under published assumptions (Lv90, talents 10, weapon Lv90, signature R1, fixed echo layout, published substat distribution).
- 5-star Resonators are judged at S0R1 and 4-star at S6R1 (same convention as Slyraf, adopted deliberately).
- Unfinished teams show **Pending**, never a placeholder number.
- Prydwen and Slyraf ratings appear only as attributed, dated opinions with links. The Consensus score uses the map in `data/manual/tier-map.yaml` (score 100 = Prydwen T0 / Slyraf S+, down to 25 = Prydwen T4).

## 6. Convene
Pity models and guarantee rules live in `src/engine/convene.ts` with a conservative and a community model and a probability histogram. To be audited against the official Convene rules page (P7-5).

## 7. Verification
- Unit tests for every zone (`tests/engine.test.ts`).
- Data goldens: Jinhsi Lv90 = 10825 / 412.5 / 1258.89; Ages of Harvest ATK 47 (Lv1) and 587.5 (Lv90), Crit. Rate 24.3% at Lv90 (`tests/curves.test.ts`).
- Parser tests for multiplier strings and game markup (`tests/parsers.test.ts`).
- Planned: at least 30 in-game damage values within +/-0.5%, and 10 reference builds compared with TheWuWaCalculator within +/-1%. Differences larger than that must be explained in this file.
- Report a mismatch with the "Report an issue" button on any page (stored in the `feedback` table).
