# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/). Dates are ISO. Game version in brackets where relevant.

## [0.2.0] - 2026-11-09 [game 3.7]
Implements the quick wins and the foundation of the master plan (`docs/PLAN.md`).

### Added
- **Art:** `npm run data:images` mirrors 468 game images (Resonator icons and portraits, 118 weapons, 187 Echoes, 37 Sonata sets, 6 element icons) into `public/img` from nanoka.cc, plus a coverage manifest `src/data/generated/images.json`.
- **Real data pipeline pieces:** `scripts/pipeline/fetch/nanoka.ts` (`npm run data:fetch`), `normalize/curves.ts` (`npm run data:curves`), parsers `parse/multipliers.ts` and `parse/markup.ts`, shared polite HTTP helper.
- **Datamined curves:** exact per-level stats for 60/61 Resonators and 118/118 weapons; per-level skill multiplier rows (2,029 rows) in `src/data/generated/skill-levels/`.
- **Engine:** uses exact Resonator level stats and weapon ATK/secondary curves when available (`EngineChar.levelStats`, `EngineWeapon.levelCurve`); falls back to the estimated tables otherwise.
- **UI:** real element icons (`ElementIcon`), portrait cards with element-tinted backdrops, weapon/Echo/Sonata thumbnails and detail art, portrait tiles on the tier list, datamine and art coverage on `/data-status`, `/about/credits`.
- **Tests:** 19 new tests (golden datamined values, curve invariants, parser behavior); 47 total. `npm run data:validate`.
- **CI:** fixed (lockfile), runs data invariants, typecheck, tests and build; weekly `data-watch` workflow opens an issue when nanoka's live version changes.
- **Docs:** `PLAN.md`, rewritten `ROADMAP.md`, `ARCHITECTURE.md` (ADR-4..6), `DATA.md`, new `METHODOLOGY.md`, `PERMISSIONS.md`, `CONTRIBUTING.md`, `LICENSE`, `DATA-LICENSE.md`.
- `src/data/version.json` as the single source of the live game version; `.nvmrc`.

### Changed
- `GameImage` renders an element-tinted backdrop, anchors portraits to the top and has an `icon` variant.
- `/methodology` now states that Resonator and weapon stats are datamined.
- `tsx`, `vitest`, `cheerio` are devDependencies; `vitest.config.ts` renamed to `.mts`.
- Legacy normalizer writes to `data/raw/` instead of `src/data/`.

### Removed
- Dead/duplicate code: second `CalculatorClient`, `src/lib/calc.ts`, `src/lib/data.ts`, `ConvenePlanner` duplicate, `CharacterGrid`/`WeaponGrid`/`EchoGrid`, `src/app/tierlist/`, `/api/builds`, `scripts/legacy-scrape/`, and the raw JSON copies in `src/data/` (about 2.7 MB).

### Known issues
See "Known data findings" in `docs/ROADMAP.md` and `docs/DATA.md` (Lily has no datamine entry; Aureate Zenith wiki conflict; Solar Flame rank-param anomaly).

## [0.1.0] - initial
Wiki-scraped dataset, pure TypeScript engine (zones, explain, stat weights), 25+ routes, versioned API, design tokens, Convene engine.
