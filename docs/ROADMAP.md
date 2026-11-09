# Roadmap and status

Source of truth for scope: [PLAN.md](PLAN.md). This file tracks **status only**.
Legend: [x] done, [~] partial, [ ] not started. Last updated for **v0.2.0**.

## Phase 0: Foundations and cleanup
- [x] P0-1 Lockfile committed, `tsx`/`vitest` moved to devDependencies, `.nvmrc` (22), `engines.node >= 20`
- [x] P0-2 Dead/duplicate code deleted (second CalculatorClient, `lib/calc`, `lib/data`, grids, `ConvenePlanner`, `tierlist/`, `/api/builds`, `legacy-scrape`)
- [x] P0-3 Data duplication removed (raw copies in `src/data/*.json` deleted; one raw location `data/raw`)
- [x] P0-4 Green baseline: `tsc`, vitest, `next build`
- [ ] P0-5 Baseline screenshots (8 pages, desktop and mobile)
- [x] P0-6 `PERMISSIONS.md`, `LICENSE`, `DATA-LICENSE.md`, `CONTRIBUTING.md`, `/about/credits`
- [ ] P0-7 Message nanoka's maintainer and Prydwen; record replies in `PERMISSIONS.md` (**owner action**)
- [x] `GAME_VERSION` moved to `src/data/version.json`

## Phase 1: Data pipeline v2
- [x] P1-1 `fetch/nanoka.ts` (manifest, indexes, details, cached, polite rate limits). Live 3.7 fetched; `--channel=latest` supported for beta
- [x] P1-2 `parse/multipliers.ts` and `parse/markup.ts` with tests
- [~] P1-3 Characters: real stat curves for 60/61 and per-level skill rows (2,029 rows) generated into `curves/` and `skill-levels/`. Not yet merged into `characters.json`/zod schema; chains, materials, Rover grouping open
- [~] P1-4 Weapons: real ATK/secondary curves and R1-R5 params for 118/118. Echoes (skill levels, sonata membership), sonatas, monsters, items open
- [ ] P1-5 Spike: echo main/substat tables and Tune Break numbers (Arikatsu)
- [ ] P1-6 `fetch/arikatsu.ts` and cross-source validation
- [~] P1-7 Invariants: `npm run data:validate` (golden curves, parsers, schema) wired into CI. Per-source freshness and conflicts on `/data-status` partly done (datamine and art coverage shown)
- [ ] P1-8 Provenance enum values (`computed`, `nanoka`, `prydwen`, `slyraf`)

## Phase 2: Images and art-first shell
- [x] P2-1 `fetch/images.ts`: 468 files mirrored (120 character icons+portraits, 118 weapons, 187 echoes, 37 sonatas, 6 elements); `images.json` coverage manifest
- [~] P2-2 Storage plan documented (dev `public/img`, prod bucket+CDN). Bucket upload and `remotePatterns` open
- [~] P2-3 `GameImage` upgraded (element-tinted backdrop, top-anchored portraits, icon variant) and `ElementIcon`. `<Art/>`, `RarityFrame`, `WeaponTypeIcon` open
- [~] P2-4 Tokens/glass/type scale/motion: existing tokens kept; Abyssal Glass pass open
- [~] P2-5 Art in Resonator grid, detail hero, home "newest", weapons table, echoes grid, sonata/weapon/echo detail, tier board. Header/Footer/Home hero rebuild open
- [~] P2-6 Image coverage on `/data-status`. CI missing-image gate open (images are not committed, so the gate needs a fetch step)

## Phase 3: Database pages v2
- [ ] P3-1 Resonator detail tabs, level slider with real multipliers, minor-fortes toggle, buff chips
- [ ] P3-2 Weapon detail: R1-R5 slider with curve preview (curves now available)
- [ ] P3-3 Echo/Sonata detail: tune slider, "used in"
- [ ] P3-4 Enemies database
- [ ] P3-5 Postgres content schema and `data:seed`
- [ ] P3-6 Search upgrade
- [ ] P3-7 OG images, JSON-LD, full sitemap

## Phase 4: Engine v3
- [~] P4-1 Real curves: Resonator and weapon level stats now exact (`levelStats`, `levelCurve`). Skill-level curve, echo tables, forte, enemies still estimated
- [ ] P4-2 Effects DSL (weapons/sonatas partly modelled in the old format; chain/inherent/forte not)
- [ ] P4-3 Echo system data and layouts
- [ ] P4-4 Healing/shield/echo-skill rows
- [ ] P4-5 Negative Status and Tune Break
- [ ] P4-6 Rotation and team simulation
- [~] P4-7 Golden tests: datamined-stat goldens (Jinhsi Lv90, Ages of Harvest) added; the 30 in-game damage values and oracle script open

## Phase 5: Calculator v2
- [x] Baseline calculator (panels, explain, stat weights, A/B weapon compare, share) from v0.1
- [ ] P5-1..P5-7 workspace on real data, rankings, rotation timeline, benchmark, optimizer, undo/redo, showcase

## Phase 6: Rankings and editorial
- [~] Baseline editorial tier list (roles, elements, roster filter, changelog)
- [ ] P6-1..P6-5 Prydwen/Slyraf opinions, tier list v2, Consensus, DPR ranking, team builder, authored notes

## Phase 7: Planning tools and time
- [~] Baseline Convene planner, banners, events, patches overview, materials list
- [ ] P7-1..P7-5 roster, planner, official banners with UTC+8, patch diffs, Convene audit and tracker

## Phase 8: Polish and stretch
- [x] P8-5 weekly data-watch workflow (`.github/workflows/data-watch.yml` opens an issue when nanoka live changes)
- [ ] P8-1 PWA and budgets, P8-2 i18n, P8-3 Playwright and Lighthouse CI, P8-4 stretch items

## Known data findings (see DATA.md)
- Lily has no datamine entry (placeholder in our data): fallback to the estimated multiplier table
- Wiki vs datamine conflict: Aureate Zenith secondary stat (wiki Crit. Rate 4.5%, datamine Crit. DMG 9%). Datamine wins
- Datamine anomaly: Solar Flame has one 4-entry rank param row
- 8 further weapons differ from wiki only by rounding at Lv1 (for example DEF 13.6 vs 13.68)
