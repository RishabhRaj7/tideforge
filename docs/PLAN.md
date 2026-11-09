# Tideforge: Audit and Master Plan

> Audited repo: https://github.com/RishabhRaj7/tideforge (2 commits at audit time).
> Reference sites audited: Prydwen (WuWa), Slyraf (WuWa), TheWuWaCalculator, plus **nanoka.cc** (discovered; a data source TheWuWaCalculator itself uses).
> Audit date: 2026-11-09. Live game version **3.7**. Version **3.8.5** exists as beta data.
>
> This is the strategic plan. The living status of every item is in [ROADMAP.md](ROADMAP.md). Facts about the
> data and pipeline are in [DATA.md](DATA.md); formulas are in [METHODOLOGY.md](METHODOLOGY.md); permissions and
> scraping rules are in [PERMISSIONS.md](PERMISSIONS.md).
>
> **Note on this copy:** the audit prose is condensed. Every decision, finding ID (F1-F18), source-priority rule,
> mapping table, acceptance gate and roadmap ID (P0-1 ... P8-5) from the original plan is preserved. The starter
> scripts from the original Appendix C now live in the repo (`scripts/pipeline/`).

---

## 0. TL;DR

The repo was never a skeleton in code terms (about 11.5k lines, a zod-validated pipeline, a pure TypeScript engine,
25+ routes, a versioned API, a design-token system). It felt like one for three reasons:

1. **No images existed.** The dataset pointed at about 1,000 files under `/img/...` that were never created. Every tile fell back to a glyph. *(Fixed in v0.2.0, see ROADMAP P2-1.)*
2. **The data was wiki-scraped and partly estimated.** Level-1 stats scaled by one Jinhsi-derived multiplier table; single-level skill multipliers; hard-coded echo tables. *(Stats and skill-level multipliers fixed in v0.2.0; echo tables still open.)*
3. **The calculator and tier list were not yet authoritative.** The tier list is a hand-written opinion table.

**The fix is a data-source swap, not a rewrite.** Verified 2026-11-09:

- **nanoka.cc publishes complete datamined JSON** at `static.nanoka.cc/ww/<version>/...`: per-level HP/ATK/DEF for every ascension, per-level skill multipliers (about 19-20 levels), weapon curves, R1-R5 params, echo skill params, sonatas, 311 monsters, 2,018 items, a `manifest.json` (live 3.7, latest 3.8.5), and images on the same CDN as `.webp`.
- **Prydwen's origin CDN** serves unprotected HTML and Gatsby `page-data` JSON (the public host is behind a Cloudflare challenge). This is the editorial layer: ratings, best weapons, echo sets, teams, rotations.
- **Slyraf** is server-rendered; guides, tier list, DPR tables and kit data are scrapeable with plain HTTP.
- **TheWuWaCalculator** is a Vite SPA; it is the best functional reference and a **test oracle** (not a data source).

| Pillar | Decision |
|---|---|
| Data | nanoka.cc primary datamine; Arikatsu/WutheringWaves_Data cross-check and fallback; Prydwen and Slyraf as an attributed editorial layer; hand-curated tier list on top |
| Images | Mirror about 1,000 assets once, serve from our own origin, never hot-link; build-time "no missing image" gate |
| Design | Art-first redesign: portrait art, real element/weapon/rarity icons, glass cards, element-tinted themes, motion |
| Calculator | Engine v3 on real curves, an effects DSL, Tune Break and Negative-Status modules, rotation timeline, optimizer, benchmark score, import/export, showcase card |
| Rankings | Our own DPR from the engine plus a "Consensus" view placing Prydwen and Slyraf beside ours |

Estimated effort: 8-10 weeks part-time (about 120-160 h). Phases 1-2 (data and images) deliver about 80% of the visible improvement.

---

## 1. Goals, non-goals, success metrics

### Goals
- G1. Every entity (Resonator, weapon, echo, sonata, monster, item) has real art and real datamined numbers.
- G2. The Resonator page is as rich as Prydwen's (kit, multipliers by level, chain, builds, teams, ratings) and as structured as Slyraf's (tabs, upgrade priority, rotation, buff list).
- G3. The calculator matches the depth of TheWuWaCalculator (workspace, rotation, optimizer, benchmark, showcase, import/export) and shows its work.
- G4. Rankings are reproducible: the method is public and the inputs are fixed.
- G5. A patch-day update takes under 1 hour from "new data published" to "site updated".
- G6. The site looks premium on mobile and desktop.

### Non-goals (for now)
Accounts and a social layer (stay local-first plus share links); redistributing Prydwen/Slyraf prose as ours; monetization (permission is for a personal project); extracting 3D models.

### Acceptance gates
| Metric | Target |
|---|---|
| Entities with a real image | 100% of Resonators, weapons, echoes, sonatas |
| Resonators with real per-level stats | 100% (was 55/61 estimated) |
| Skills with per-level multipliers | 100% of damage rows, levels 1-10+ |
| Calculator golden tests | at least 30 in-game verified values within +/-0.5% |
| Cross-check vs TheWuWaCalculator | at least 10 reference builds within +/-1% |
| Lighthouse (mobile) | Performance >= 90, Accessibility >= 95, SEO >= 95 |
| LCP on a character page | under 2.5 s on throttled 4G |
| Data update turnaround | under 1 hour, one command and one PR |
| Broken images in CI | 0 |

---

## 2. Audit of the repository (findings)

**Keep:** the provenance model (`source`, `confidence`, `verifiedAt`) with `/data-status` and `/methodology`; the pure engine with zones and an "explain" trace; the `server-only` repo layer; the versioned API and shareable builds; element-themed design tokens, command palette, motion primitives; the Convene engine.

| # | Severity | Finding | Fix |
|---|---|---|---|
| F1 | Critical | No images at all (`public/` absent; glyph fallbacks everywhere) | §7 |
| F2 | Critical | Stats level-1 only, scaled by one Jinhsi-derived multiplier (`CHAR_LEVELS`, confidence "estimated") | §5, §9 |
| F3 | Critical | Skill multipliers single-level; one global skill curve | §5, §9 |
| F4 | High | 6 Resonators with placeholder stats (Buling, Jingran, Lily, Lucilla, Lucy, Rebecca); 4 with no skill rows (Cartethyia, Encore, Hiyuki, Lily); 12 with incomplete materials | §5 |
| F5 | High | No weekly-boss material for any Resonator (61/61 empty) | §5 |
| F6 | High | Wiki text artifacts (merged sentences); 45/61 no real name, 28 no birthday, 53/187 echoes with no sonata list | §5 (nanoka text plus markup parser) |
| F7 | High | Echo main/substat values hard-coded; no per-echo level/tune data | §5, §9 |
| F8 | High | Missing mechanics: Tune Break/Rupture/Strain, Negative Statuses, Concerto/energy simulation, healing/shield rows, Unison | §9 |
| F9 | High | Tier list is an opinion table; no objective DPR; no per-mode split | §10.9 |
| F10 | High | CI could not pass (`npm ci` without a lockfile) | §8.1 |
| F11 | Medium | Dead/duplicate code (second `CalculatorClient`, `lib/calc.ts`, `lib/data.ts`, grids, `tierlist/`, `/api/builds`, `scripts/legacy-scrape`) | §8.1 |
| F12 | Medium | Same data committed three times (about 4.6 MB) | §8.2 |
| F13 | Medium | `tsx`/`vitest` in `dependencies`; mixed version pins; `GAME_VERSION` literal | §8.1 |
| F14 | Medium | Design reads as a wireframe (Unicode glyph icons, mono numerals everywhere, flat cards, no hero art) | §11 |
| F15 | Medium | Banner/event timers use `Date.now()` on static JSON; no UTC+8 handling | §10.13 |
| F16 | Low | Rover collapsed to 4 entries; the game has 8 IDs (gender x element, shared kit) | §5 |
| F17 | Low | Only 176 lines of tests; no golden tests | §9.9 |
| F18 | Low | No license, attribution or fan-content disclaimer pages | §6.4 |

---

## 3. Reference sites: what to adopt

- **Prydwen** (public host: Cloudflare 403; `robots.txt` Crawl-delay 10; origin `d2ankz0m1a0dsp.cloudfront.net` serves HTML, `page-data` JSON and images). Tabs: Profile / Review / Build / Gameplay and teams / Calculations. *Adopt:* weapon % comparison with an assumed-team caption, the "include minor fortes" toggle, multiplier-by-level table, dated tier changelog, Expert tag, per-row Concerto/STA/CD info. *Do not copy:* editorial prose. Their "value" philosophy differs from pure DPR, so show it as a separate lens.
- **Slyraf** (server-rendered; `robots.txt` content signal `search=yes, ai-train=no, use=reference`). Tabs: Profile / Review and Rotation / Weapon and Set / Team / Calculations. *Adopt:* methodology transparency (Lv90, talents 10, weapon Lv90, signature R1, S0R1 baseline for 5-star and S6R1 for 4-star), "pending" instead of a fake number, typed buff chips, damage-share upgrade priority, weapon % with a team variant, box-aware team finder, Echo Analyzer rubric (20 set + 10 main echo + 10 main stats + 60 substats - up to 6 ER shortfall), last-reviewed stamps. *Do not copy:* rotations, prose, rankings.
- **TheWuWaCalculator** (Vite SPA). Routes: calculator, rotation, optimizer, benchmark, showcase, progression, modulation. *Adopt:* benchmark-as-percentage (0/100/200% reference builds), optimizer plus inventory (CPU/WebGPU), undo history, `.wwcalc` snapshot export, docs that explain every formula, asset taxonomy. *Use as:* a **test oracle**, not a code or data source.
- **nanoka.cc** (static JSON). See §5 and the endpoint table in [DATA.md](DATA.md).

---

## 4. Gap analysis and differentiators

Tideforge v2 targets parity or better on: real art, per-level data, character page depth, weapon ranking in % with team caption, echo set and main-stat layouts, tier list with modes and changelog, team DPR ranking and builder, calculator workspace plus rotation plus optimizer plus benchmark, convene planner/tracker, banners/events calendar, materials planner, patch diffs, methodology and data status, import/export/share.

**Differentiators:**
1. Every number carries provenance and a link to the formula.
2. A **Consensus view**: Prydwen, Slyraf and Tideforge side by side, each attributed.
3. One reproducible engine behind DPR, weapon %, echo-set %, upgrade priority and the calculator.
4. Art-first design on a data-honest foundation.

---

## 5. Data strategy

### 5.1 Source priority (conflict rule: the datamine wins on numbers)
1. **Datamine** (nanoka, cross-checked against Arikatsu): all numbers, text, IDs, images. Confidence `datamined`.
2. **Official** (Kuro news / in-game): banners, events, patch dates. `official`.
3. **Prydwen / Slyraf** (attributed editorial): ratings, builds, teams, rotations, stored as **external opinions**, never merged into our numbers.
4. **Tideforge computed** (engine): DPR, weapon %, echo-set %, priorities. `computed` (new value).
5. **Tideforge editorial**: our tier list and notes. `editorial`.
6. **Community wiki**: last-resort fallback for fields no datamine has. `community`.

When editorial text disagrees with the datamine, surface a `data-conflict` warning in `/data-status`. Never silently overwrite.

### 5.2 Entity map (primary / fallback)
- Resonator identity, roles, profile: nanoka `character.json` + `chara_info`, `stories`, `goods` / Arikatsu `role` + TextMap. Add all 8 Rover IDs and group them under "Rover (element)".
- **Base stats by level and ascension:** nanoka `stats[asc][lv] = {life, atk, def}` (7 ascensions x up to 21 levels). Replaces `CHAR_LEVELS`.
- Minor fortes: nanoka `skill_trees` stat nodes (drives the minor-fortes toggle).
- **Skill multipliers per level:** nanoka `skill.level[k].param[0][i]` strings like `"19.61%+9.81%*3"`, plus `skill.damage[id].rate_lv` as the engine-grade value; equivalence tested.
- Concerto/energy/tough per hit: `skill.damage[id]` (`energy`, `element_power`, `hardness_lv`, `tough_lv`, `weakness_lvl`).
- Skill upgrade and ascension materials: `skill.consume`, `ascensions` joined to `item.json` (fixes F4, F5).
- Chain: `chains` (text with `{0}` params) parsed into the effects DSL.
- **Weapons:** nanoka `weapon/<id>.stats[asc][lv]`, `effect`, `param` (R1-R5). Signature owner and acquisition: small manual table.
- **Echoes:** identity/class/code from `echo.json`; skill per level from `echo/<id>.skill.param`; sonata membership from `echo.group`. Cost mapping Common=1, Elite=3, Overlord=4, Calamity=4 (verify against current counts 87/56/32/12).
- **Echo main/substat roll tables:** no nanoka field found. **Spike** on Arikatsu `phantom`/`property` tables with unit tests.
- Sonata sets, monsters (311), items (2,018): nanoka.
- Banners/events: official Kuro news plus manual `data/manual/banners.yaml` override (stays authoritative); states `official | leak | projected | beta`.
- Patch diffs: our own data diff between versions.
- Tier ratings, best weapons/sets/teams/rotations: Prydwen and Slyraf as external opinions; our engine as the truth.

### 5.3 Schema additions
`Character.statsCurve`, `minorFortes`, `levelExp`, `tags[]`; `Skill.levels[level].rows`, `Skill.damage[]`, structured `Skill.params`; `Chain[n].effects: Effect[]`; `Weapon.curve`, `Weapon.passive.ranks[5].params[]`, `Weapon.effects`; `Echo.skillLevels[5]`, `sonatas[]`, `mainStatOptions[cost]`, `substatTable`; `Monster`, `Item`, `ExternalOpinion { entityType, entityId, source, metric, mode, role, value, note?, url, capturedAt }`, `Image { entityType, entityId, kind, path, w, h, blurhash, sourceRef }`. `Provenance.confidence` gains `computed`; `source` gains `nanoka`, `prydwen`, `slyraf`.

### 5.4 Extraction per source
- **nanoka:** plain `fetch`, read `manifest.json` then indexes then details; concurrency 4, 250 ms delay, cached raw files. *(Implemented: `scripts/pipeline/fetch/nanoka.ts`.)*
- **Arikatsu:** `git clone --depth 1 --branch <ver>` or sparse checkout of `BinData/<table>` and `Textmaps/en`.
- **Prydwen:** origin `page-data` JSON for structured data, SSR HTML (cheerio) for Build/Calculations/Teams; discover slugs via the characters `page-data`; **honour Crawl-delay 10 s**; fallback Playwright with a cookie from your own browser session.
- **Slyraf:** sitemap for 62 character URLs, SSR pages parsed with cheerio, 1 request per 2 s.
- **TheWuWaCalculator:** do not scrape. Record input/output pairs as golden tests.
- **Official news:** HTML fetch plus manual overrides.

### 5.5 Pipeline v2 layout
```
scripts/pipeline/
  fetch/      nanoka.ts  arikatsu.ts  prydwen.ts  slyraf.ts  official.ts  images.ts
  parse/      markup.ts  multipliers.ts  effects.ts
  normalize/  per-entity assembly, slug rules, Rover grouping
  validate/   zod + invariants + cross-source diff
  diff/       version-to-version change log
  seed/       write to Postgres (Drizzle)
  report/     data-status JSON
```
npm scripts: `data:fetch`, `data:build`, `data:curves`, `data:images`, `data:validate`, `data:all` (later `data:seed`, `data:diff`).

**Hard-fail invariants:** every Resonator has stats for ascensions 0-6 and levels 1-90; every damage row has a multiplier for every skill level; every weapon has R1-R5 params of equal length; every referenced icon exists in the asset manifest; no markup tokens (`<color`, `<size`, `<te`, `{0}`) in rendered strings; every echo has at least one sonata or an explicit `none`; Jinhsi Lv90 = 10825 / 412.5 / 1258.89.

### 5.6 Versioning
`GAME_VERSION` lives in `src/data/version.json` (not a code literal). Hold `live` and `beta` side by side; show beta behind a visible badge and toggle. Content carries `since_version` / `until_version` so the patch diff is a query.

---

## 6. Scraping protocol, permissions, attribution

**Checklist:** save permission messages in `docs/PERMISSIONS.md`; confirm in writing that fetching from the Prydwen CloudFront origin is acceptable (it bypasses their public Cloudflare challenge; otherwise use Playwright); Slyraf `ai-train=no` means reference and display only, never ML training; nanoka and encore.moe are **not** covered by the permissions you hold, so message the maintainers (Arikatsu raw datamine is the public fallback); descriptive `User-Agent`; rate limits (Prydwen 10 s, Slyraf 2 s, nanoka 250 ms with concurrency 4); scrape only on patch day or manually, never on page load or from the browser; cache raw responses and use ETags; never scrape logged-in areas, `/api/` or `/auth/`.

**What we store from Prydwen/Slyraf:** facts and ratings (tier, role, mode, % values, team lists, capture date, URL), not prose. Display as "Prydwen: T0.5 (Tower of Adversity), captured 2026-11-09, view on Prydwen" with a link on every card.

**Non-commercial:** no ads, paywall or affiliate links. Ask first about tip jars.

**Attribution and legal:** `/about/credits` page; footer fan disclaimer; `LICENSE` for code and `DATA-LICENSE.md` explaining game assets are not covered.

---

## 7. Image and asset pipeline

- **Inventory (about 1,500-2,000 files, 60-120 MB raw):** Resonator head icons and "pile" portraits, half-body art, skill/chain/role/forte icons, weapon icons (134), echo icons (187 plus phantom variants), echo skill icons, sonata icons (37), element and weapon-type icons, stat icons, monster icons (311), item icons (about 400 used). Rarity frames are CSS/SVG overlays.
- **URL recipe (verified):** take the `icon` field `/Game/Aki/UI/<path>.<name>`, drop `/Game/Aki/UI/`, replace the trailing `.<name>` with `.webp`, prefix `https://static.nanoka.cc/assets/ww/`.
- **Processing:** manifest per version; download with concurrency 6 and retry, skip existing; `sharp` to multiple widths (AVIF + WebP); blurhash placeholders; `images.json` manifest; **gate:** validation fails if a referenced key is missing.
- **Hosting:** dev `public/img` (git-ignored, populated by `npm run data:images`); prod object storage plus CDN with `NEXT_PUBLIC_ASSET_BASE` and `images.remotePatterns`. Never hot-link nanoka at runtime. Commit only `images.json`.
- **In-app:** a typed `<Art/>` over `next/image` with blur placeholders and graceful fallback; real element icons instead of glyphs; rarity frames as overlays.
- **Models:** recommended is 2D portrait and half-body art with parallax and glow. Optional stretch: Spine/Live2D hero (check licensing and asset availability). Not recommended: true 3D extraction.

---

## 8. Architecture and repository plan

### 8.1 Phase-0 cleanup
Commit a lockfile; move `tsx`/`vitest` to dev dependencies; add `.nvmrc`, `engines`; delete dead code (F11); remove raw-data duplication (F12); green baseline (`tsc`, tests, build); baseline screenshots; `LICENSE`, `DATA-LICENSE.md`, `CONTRIBUTING.md`, `PERMISSIONS.md`, credits.

### 8.2 Data placement
`data/raw/<source>/<version>/` is git-ignored for fetched datamines; `data/manual/*.yaml` is committed (banner overrides, signature owners, voice actors, tier list, notes); `src/data/generated/` is committed while under about 10 MB (otherwise `public/data/<ver>/`). **Runtime store:** Postgres for site pages, filters, search and tier-list history, seeded by `data:seed`; the calculator fetches per-entity engine bundles over cached `/api/v1/engine-data/<slug>`. This revises ADR-1: JSON stays the diffable build artifact; Postgres becomes the query layer.

### 8.3 Folder structure
```
src/app/ (routes)   src/components/{art,ui,layout,database,calc}   src/engine/{formulas,effects,status,tune,rotation,optimizer,scoring}
src/data/ (zod + types)   src/db/ (schema, queries, seed)   src/server/ (repos, http)   src/lib/
scripts/pipeline/   data/manual/   docs/   tests/{unit,golden,data-invariants,e2e}
```

### 8.4 Database (sketch)
`game_versions`, `characters`, `character_skills`, `character_chains`, `weapons`, `echoes`, `sonata_sets`, `monsters`, `items`, `images`, `banners`, `events`, `external_opinions`, `tier_entries`, `tier_history`, `dpr_runs`, plus existing `builds`, `feedback`. i18n later via `*_i18n(entity_id, locale, fields jsonb)`.

### 8.5 API, caching, performance
Per-entity engine bundles with immutable caching keyed by `?v=<dataVersion>`; ISR plus `generateStaticParams` for entity pages; `next/og` Open Graph images; budgets: JS under 180 KB on database pages, route-level splitting for the calculator, Web Worker for the optimizer, virtualised long lists.

### 8.6 Testing and CI
vitest unit tests (formulas, parsers, schema invariants); golden tests in `tests/golden/*.json`; Playwright smoke and axe tests; CI runs lockfile install, `data:validate`, `tsc`, vitest, `next build`, Lighthouse CI; a weekly cron checks the nanoka manifest.

---

## 9. Engine v3 and calculator plan

**Principle:** one engine, many consumers (calculator, DPR simulator, weapon and set rankings, upgrade priority, tier-list evidence). Every output prints its assumptions and a confidence level.

**9.2 Replace estimates with data (blocks everything else):**
| Today | Replace with | Status |
|---|---|---|
| `CHAR_LEVELS` one multiplier | `character.stats[asc][lv]` | **done** (v0.2.0) |
| `WEAPON_LEVELS` global table | `weapon.curve[asc][lv]` | **done** (v0.2.0) |
| `skillCurve` single curve | per-skill `levels[level].rows` | data generated; engine switch open |
| `ECHO_MAIN`, `SUB_VALUES`, `ECHO_FIXED` | extracted tables (spike) | open |
| `FORTE_OPTIONS` guess | `minorFortes` from `skill_trees` | open |
| `ENEMY_PRESETS` | `monster.stats[level]` plus curated presets | open |

**9.3 Formula spec:** zones for base stat, additive bonus, amplify, deepen, DEF, RES (3-branch), crit, healing/shield and echo-skill rows. DEF form `(800 + 8L) / (800 + 8L + defEnemy*(1 - ignore))` to be verified against datamine and golden tests. Each formula is a pure function with a docstring and a section in METHODOLOGY.md.

**9.4 Effects DSL:** `Effect { id, source{kind,ref}, scope, stat, zone, value | value[], perStack?, maxStacks?, condition?, duration?, cooldown?, confidence, text }`. Parse weapon/sonata/chain text with params; hand-curate the rest in `data/manual/effects/<slug>.yaml`; show anything unmodelled as an "Unmodelled" chip with raw text. Target: 100% of 5-star weapons and sonatas.

**9.5 Echo system:** main-stat options per cost (1/3/4), fixed secondaries, substat roll values (8 tiers), echo level/tune; five slots, cost cap 12, 4-3-3-1-1 and 4-4-1-1-1, two sonata sets, main-echo skill as a slot-1 effect; manual, import (Inventory Kamera) and generated reference builds.

**9.6 Status and Tune Break:** Negative Statuses (Glacio Chafe, Fusion Burst, Electro Flare, Aero Erosion, Spectro Frazzle, Havoc Bane); Tune Rupture/Strain/Off-Tune from `AbnormalDamage`, `element_info`, `stats_weakness`; Concerto and resonance-energy simulation. Largest unknown: do a one-day spike first.

**9.7 Rotation and team simulation:** ordered action list with presets from `data/manual/rotations/<slug>.yaml`; three-character team state with buff windows; per-action damage with explain trace, per-character share, total DPR, DPS, and an assumptions block. **Pending rule:** an unfinished rotation prints "Incomplete (N unmodelled effects)", never a confident number.

**9.8 Features (priority):** real-data build workspace; weapon compare and all-weapons ranking in % with stated team; echo-set and main-stat ranking; upgrade priority by damage share; rotation timeline and team DPR; optimizer in a Web Worker; benchmark (0/100/200%) and 0-100 echo score; import/export (`.tideforge`, Kamera, share code, undo/redo); showcase card PNG; echo screenshot analyzer (stretch).

**9.9 Verification (non-negotiable):** at least 30 in-game golden values across 8 archetypes; oracle comparison against TheWuWaCalculator and Slyraf within 1% (bigger gaps documented); parser equivalence tests (`"19.61%+9.81%*3"` vs `rate_lv`); property tests (monotonicity, crit average between non-crit and crit).

---

## 10. Product specification

**Sitemap:** `/`, `/characters[/slug]`, `/weapons[/slug]`, `/echoes[/slug]`, `/sonatas[/slug]`, `/enemies[/slug]` (new), `/tier-list` (+ `/history`, `/consensus` new), `/teams` and `/team-builder` (new), `/calculator` (build, rotation, optimizer, benchmark), `/showcase` and `/roster` (new), `/convene` (+ tracker later), `/banners`, `/events`, `/calendar` (new), `/patches[/version]`, `/planner` (new), `/guides` (new), `/glossary`, `/mechanics` (new), `/methodology`, `/data-status`, `/about`, `/about/credits`.

- **Home:** full-bleed featured splash with banner countdown (UTC+8 and local), version strip ("3.7 live, 3.8 preview"), live banners, events ending soon, meta snapshot, "what changed" from the data diff, tool grid, data-quality badge.
- **Resonator list:** portrait grid with rarity frame, element and weapon icons, role tag; filters (element, weapon, rarity, role, version, owned) synced to the URL; grid/compact/roster views.
- **Resonator detail:** header with parallax splash and three attributed rating chips; tabs Overview (stats with ascension selector and minor-fortes toggle), Skills (level slider driving the multiplier table, buff chips, damage-share upgrade priority), Chain, Build (engine-computed weapon ranking in % with team caption, echo sets with layouts and substat targets, attributed community view), Teams and rotation, Materials, Reviews and notes.
- **Weapons:** R1-R5 slider with highlighted changing numbers, signature owner, computed "best on" list, effect chips.
- **Echoes/Sonatas:** 1-5 tune slider, cost pips, "used in" list, an Echo stats guide with probability helper.
- **Enemies:** monster database (311) powering calculator presets.
- **Calculator:** left builder, centre results, right explain; persistent assumptions block, undo/redo, snapshots, share and import/export; mobile stepper.
- **Tier list:** per mode (Tower of Adversity, Whimpering Wastes) and role (Main DPS, Sub DPS, Support), S+ to D tiers, Expert tag, S0R1 (5-star) / S6R1 (4-star) baseline statement, dated changelog and up/down markers; **Consensus** page with a normalised score:

| Score | Prydwen | Slyraf |
|---|---|---|
| 100 | T0 | S+ |
| 90 | T0.5 | S |
| 80 | T1 | A |
| 70 | T1.5 | B |
| 55 | T2 | C |
| 40 | T3 | D |
| 25 | T4 | n/a |

  Each lens is shown under its own label; a combined score exists only on the Consensus page with the definition printed. The map lives in `data/manual/tier-map.yaml`.
- **Teams and Team Builder:** our simulated DPR table with a Pending state; Slyraf's table on a separate attributed "Reference" tab; three slots, "my box" filter, synergy chips, "find my best teams".
- **Roster:** local-first (zustand plus IndexedDB), feeds team builder, planner, optimizer; JSON export/import; Kamera import.
- **Convene:** keep the engine; audit against official rules; banner selector with art; pity import; local tracker; spend-plan view.
- **Banners/events/patches:** art cards, UTC+8 and local time, state `official | leak | projected | beta`, calendar view; `/patches/[version]` generated from the data diff.
- **Planner:** roster plus targets to totals, shortfall, 3:1 conversion helper, farm hints, stamina estimate, weekly-reset awareness.
- **Cross-cutting:** command-palette search with images; i18n next phase; PWA offline calculator; per-entity SEO, JSON-LD, `next/og`; accessibility (shape never relies on colour alone, focus rings, reduced motion, AA contrast).

---

## 11. Design system: "Abyssal Glass"

Evolve "Tide & Resonance": keep the dark ink base and element theming; add depth, art and light.

- **Surfaces:** layered glass (translucent panel, 1 px inner highlight, soft shadow), subtle noise, element-tinted wash behind hero content.
- **Art-first:** portraits that bleed beyond cards, hover parallax, gradient fade into the page, element glow rims.
- **Rarity:** 5-star gold frame with shimmer, 4-star violet; CSS/SVG overlays.
- **Icons:** real element, weapon-type, stat, role and skill icons; Unicode glyphs only as accessible fallback.
- **Type:** Sora (display) and Inter (body); base 16 px; `tabular-nums` for numbers only; scale 12/14/16/20/28/40/64.
- **Colour:** tokens `--surface-1..4`, `--glow-<element>`, `--rarity-4/5`; AA contrast on every surface.
- **Motion:** staggered reveals, shared-layout card-to-hero transitions, number tweens, `prefers-reduced-motion` respected, each under 300 ms.
- **Layout:** 12-column grid, 1360 px container, bottom nav on mobile, sticky sub-nav, drawer sheets for filters.
- **Component library:** `Art`, `ElementIcon`, `WeaponTypeIcon`, `StatIcon`, `RarityFrame`, `PortraitTile`/`Card`, `WeaponCard`, `EchoCard`, `SonataChip`, `EffectChip`, `StatRow`, `MultiplierTable`, `LevelSlider`, `RankSlider`, `Tabs`, `FilterBar`/`Sheet`, virtualised `DataTable`, glossary `Tooltip`, `Dialog`, `Toast`, `ConfidenceBadge`, `SourceBadge`, `Countdown`, `BannerCard`, `HeroSplash`, `TierBoard`, `TeamSlot`, `RotationTimeline`, `EchoSlotEditor`, `ScoreGauge`, `ShareCard`.

---

## 12. Implementation roadmap

Hours are for one developer. Tick-by-tick status is in [ROADMAP.md](ROADMAP.md).

| Phase | Est. | Contents |
|---|---|---|
| **P0 Foundations and cleanup** | 6-8 h | P0-1 lockfile, devDependencies, `.nvmrc`, `engines`. P0-2 delete dead/duplicate files. P0-3 remove three-way data duplication. P0-4 green baseline. P0-5 baseline screenshots. P0-6 PERMISSIONS, LICENSE, DATA-LICENSE, credits. P0-7 message nanoka maintainer and Prydwen. |
| **P1 Data pipeline v2** | 20-26 h | P1-1 `fetch/nanoka.ts`. P1-2 `parse/markup.ts`, `parse/multipliers.ts`. P1-3 extend zod schema, normalize characters (curves, per-level rows, chains, materials, Rover). P1-4 normalize weapons/echoes/sonatas/monsters/items. P1-5 spike: echo tables and Tune Break numbers. P1-6 `fetch/arikatsu.ts` and cross-check. P1-7 invariants in CI, `/data-status` freshness and conflicts. P1-8 provenance enum values. |
| **P2 Images and art-first shell** | 22-28 h | P2-1 `fetch/images.ts`. P2-2 storage plan. P2-3 `<Art/>` and icon components. P2-4 tokens, glass, type scale, motion. P2-5 rebuild Header, Footer, Home hero, grids. P2-6 missing-image CI gate. |
| **P3 Database pages v2** | 24-30 h | P3-1 Resonator detail. P3-2 Weapon detail. P3-3 Echo and Sonata detail. P3-4 Enemies. P3-5 Postgres schema and `data:seed`. P3-6 search upgrade. P3-7 OG images, SEO, JSON-LD, sitemap. |
| **P4 Engine v3** | 30-40 h | P4-1 real curves. P4-2 effects DSL. P4-3 echo system. P4-4 heal/shield/echo-skill rows. P4-5 Negative Status and Tune Break. P4-6 rotation and team sim. P4-7 golden suite plus oracle script plus methodology. |
| **P5 Calculator v2** | 24-32 h | P5-1 workspace. P5-2 weapon/echo-set rankings and upgrade priority. P5-3 rotation timeline. P5-4 benchmark and echo score. P5-5 optimizer in a worker plus Kamera import. P5-6 undo/redo, snapshots, export/import. P5-7 showcase card. |
| **P6 Rankings and editorial** | 20-26 h | P6-1 Prydwen/Slyraf fetchers into `external_opinions`. P6-2 tier list v2. P6-3 Consensus page. P6-4 DPR ranking and team builder. P6-5 authored notes and rotations for the top 20. |
| **P7 Planning tools and time** | 18-24 h | P7-1 roster. P7-2 planner. P7-3 banners/events from official sources, UTC+8, calendar, beta state. P7-4 patch pages from diffs. P7-5 Convene audit and tracker. |
| **P8 Polish and stretch** | 16-24 h | P8-1 PWA and perf budgets. P8-2 i18n scaffold. P8-3 Playwright and Lighthouse CI. P8-4 optional Spine/Live2D, screenshot analyzer, WebGPU optimizer. P8-5 weekly data-watch Action. |

**Phase gates ("done when")** P0: CI green, no dead routes. P1: 0 placeholder stats, 100% rows with all levels, `data:validate` green, Jinhsi golden. P2: every grid shows real art, Lighthouse perf >= 85 on `/characters`. P3: every entity page renders from real data with art, passes axe, has an OG image. P4: golden tests within +/-0.5%, oracle builds within +/-1%. P5: Kamera import to an optimised, explained build in under 2 minutes. P6: tier list shows evidence links, Consensus lists all sources with dates, no Prydwen/Slyraf prose. P7: `/patches/3.7` generated automatically, planner round-trips a roster.

**Quick wins (first 2 days):** P0-1..P0-4; nanoka fetch plus images; real image component with pile portraits as grid art and hero; real element icons.

---

## 13. Risks and decisions

| Risk | Mitigation |
|---|---|
| nanoka is outside your permissions and could change or block | Ask permission, cache all raw data, keep the Arikatsu fallback, never hot-link |
| Prydwen origin access considered abuse | Ask in writing; honour 10 s delay; Playwright fallback |
| Scraped HTML breaks on redesign | Parser tests on saved fixtures, soft-fail per page, staleness on `/data-status` |
| Tune Break/status maths unknown | Spike early, golden tests, show "Incomplete" rather than guess |
| Image licensing (Kuro assets) | Fan disclaimer, non-commercial, self-hosted, credits page, easy purge |
| Data volume | Per-entity lazy bundles, immutable caching, IndexedDB |
| Scope creep | Phase gates, "done when" criteria, quick wins first |
| Editorial drift | Evidence links, changelog, Consensus page shows disagreement |
| 3.8 beta mistaken for live | `channel: beta` badge/toggle, excluded from the live tier list |
| Calculator mismatch with game | Golden tests, oracle cross-checks, published methodology |

**Decisions (recommendations):** (1) nanoka primary, Arikatsu cross-check; (2) Postgres for pages and search plus static per-entity bundles for the calculator; (3) mirror images to your own storage, never hot-link; (4) our DPR plus an attributed Consensus page, no republished prose; (5) Slyraf-style S+..D tiers with modes and roles, Prydwen's T-scale mapped on Consensus; (6) time-box a 1-day Tune Break spike; (7) skip true 3D, do 2D hero art, Spine/Live2D optional.

---

## Appendix A: Verification log (2026-11-09)
Repo clone OK (2 commits, no `public/`, no lockfile); `npm ci` failed without a lockfile; counts 61/118/187/37/187/330; Slyraf `robots.txt`, `sitemap.xml` (78 WuWa URLs, 62 character pages) OK; prydwen.gg public host 403 Cloudflare, `Crawl-delay 10`, CloudFront origin 200 for HTML, `page-data` and images; thewuwacalculator.com Vite SPA; nanoka `manifest.json` (`live 3.7`, `latest 3.8.5`), indexes (character 65, weapon 134, echo 187, sonata 37, monster 311, item 2,018), details and image URLs 200; Arikatsu default branch `3.7` with about 506 BinData tables and 13 TextMap languages. **Not verified:** encore.moe API, echo main/substat tables, Tune Break numbers, resistance values, DEF formula constants, Spine/Live2D availability.

**Re-verified during implementation (v0.2.0):** nanoka live = 3.7; character index 64, weapon 133, echo 187, sonata 37, monster 311; all 468 mirrored images returned 200; Jinhsi asc 6 Lv 90 = 10825 / 412.5 / 1258.8866 exactly.

## Appendix B: nanoka character detail, key map
```
id, rarity, weapon(type id), element(id), tag, name, nick_name, desc, icon, background, background_stand,
chara_info, stories, voices, goods, special_cook, stats{asc:{lv:{life,atk,def}}}, stats_weakness, level_exp,
skill_trees{n:{node_type, consume, skill:{name,desc,param,simple_desc,icon,type,
  level{k:{name,param[[...per level]],format}}, consume, damage{id:{element,related_property,type,rate_lv[],
  energy,element_power,hardness_lv,tough_lv,weakness_lvl}}}}},
skill_branches, chains{1..6}, ascensions{1..6:[{key,value}]}, skin, forte, forte_new, live2d, audio, recommend
```
Element ids: 1 Glacio, 2 Fusion, 3 Electro, 4 Aero, 5 Spectro, 6 Havoc. Weapon type ids: 1 Broadblade, 2 Sword, 3 Pistols, 4 Gauntlets, 5 Rectifier (verify). Weapon stat units: `is_ratio` = fraction, `is_percent` = hundredths (see DATA.md).

## Appendix D: file-by-file disposition (status)
| Path | Action | Status |
|---|---|---|
| `src/engine/*` | keep, refactor (constants replaced by data) | in progress (curves done) |
| `src/data/schema.ts` | extend (§5.3) | open |
| `scripts/pipeline/run.ts` | replace with the modular pipeline | partly (new modules alongside) |
| `scripts/legacy-scrape/` | delete (identical copy) | done |
| `scripts/scrape/` | keep as the community-fallback scraper only | done (writes to `data/raw`) |
| `data/raw/*.json`, `src/data/*.json` raw copies | one raw location | done (src copies deleted) |
| `src/components/CalculatorClient.tsx`, `src/lib/calc.ts`, `src/lib/data.ts` | delete | done |
| `src/components/{CharacterGrid,WeaponGrid,EchoGrid,ConvenePlanner}.tsx` | delete / rebuild | done (deleted) |
| `src/app/tierlist/`, `src/app/api/builds/` | delete | done |
| `src/components/GameImage.tsx` | replace with `<Art/>` | upgraded in place (v0.2.0); `<Art/>` open |
| `src/lib/game.ts` glyph maps | replace with real icons, keep as fallback | element icons done |
| `src/content/tier-list.ts` | move to `data/manual/` plus DB | open |
| `.github/workflows/ci.yml` | fix, add `data:validate`, Lighthouse | fixed; Lighthouse open |
| `docs/ROADMAP.md` | replace with this plan's phase checklist | done |

## Appendix E: glossary of newer mechanics (to document on `/mechanics`)
Concerto Energy; Resonance Energy; Intro / Outro skills; Unison (and Unison Response); Negative Statuses (Glacio Chafe, Fusion Burst, Electro Flare, Aero Erosion, Spectro Frazzle, Havoc Bane); Tune Break, Tune Rupture, Tune Strain, Shifting/Off-Tune; Forte Circuit; Minor Fortes; Sequence (Resonance Chain); Echo cost layouts; Sonata effects. Source definitions from the datamine `<te href>` glossary links.
