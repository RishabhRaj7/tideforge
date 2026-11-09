# Tideforge

Forge your resonance. A fan-made **Wuthering Waves** companion: tier list, Resonator / weapon / Echo database with real art, damage calculator on datamined stat curves, Convene planner, banners and events. Every number shows where it came from.

> Unofficial fan project, not affiliated with Kuro Games. See `DATA-LICENSE.md` and `docs/PERMISSIONS.md`.

## Status (v0.2.0, game 3.7)
- Real art: 468 images mirrored (Resonators, weapons, Echoes, Sonatas, elements).
- Real stats: exact per-level Resonator stats (60/61) and weapon curves (118/118) from the datamine; the calculator uses them. Per-level skill multiplier rows are generated (2,029 rows) and will drive the engine next.
- Still to come (see `docs/ROADMAP.md`): echo tables, effects DSL, Tune Break/status, rotation and team simulation, optimizer, Consensus tier list, planner.

## Quick start
```bash
nvm use                       # Node 22
cp .env.example .env
npm install
npm run db:push               # builds + feedback tables (Postgres)
npm run data:fetch            # nanoka datamine cache (git-ignored)
npm run data:curves           # exact stat curves + per-level skill rows
npm run data:images           # mirror art into public/img (git-ignored, about 24 MB)
npm test
npm run dev
```
The generated JSON is committed, so the app runs before any fetch; art shows fallback tiles until `data:images` has run.

## Scripts
| Script | What it does |
|---|---|
| `data:fetch` | Fetch nanoka indexes and details into `data/raw/nanoka/<ver>` (cached, polite) |
| `data:build` | Legacy wiki raw to validated `src/data/generated/*` and `report.json` |
| `data:curves` | Datamine to `curves/`, `skill-levels/`, `nanoka-report.json` |
| `data:images` | Mirror art to `public/img` and write `images.json` |
| `data:validate` | Golden values, curve and parser invariants |
| `data:all` | Everything above, in order |
| `test`, `typecheck`, `build`, `db:push` | As named |

## What is where
| Path | Purpose |
|---|---|
| `src/engine` | Pure TypeScript damage / stats / Convene engine. No React, DB or Next imports. |
| `scripts/pipeline` | Fetch (nanoka, images), parse (multipliers, markup), normalize (curves), legacy `run.ts` |
| `src/data` | zod schema, generated datasets, `version.json` |
| `src/server/repos` | `server-only` read models; builds exact engine bundles from the curves |
| `src/app/api/v1` | Versioned API: builds, engine data, search index, feedback |
| `src/content` | Editorial tier list |
| `tests` | Engine, data, curve goldens, parsers |
| `docs` | The documentation set below |

## Documentation
| Doc | Contents |
|---|---|
| [`docs/PLAN.md`](docs/PLAN.md) | Audit and master plan (findings, decisions, phases) |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Status of every plan item |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Decisions (ADRs), data flow, folder structure |
| [`docs/DATA.md`](docs/DATA.md) | Sources, pipeline commands, units, known conflicts, patch-day procedure |
| [`docs/METHODOLOGY.md`](docs/METHODOLOGY.md) | Formulas, confidence levels, verification |
| [`docs/PERMISSIONS.md`](docs/PERMISSIONS.md) | Permission log, scraping rules, attribution, takedown |
| [`CONTRIBUTING.md`](CONTRIBUTING.md), [`CHANGELOG.md`](CHANGELOG.md) | How to contribute; what changed |
| [`LICENSE`](LICENSE), [`DATA-LICENSE.md`](DATA-LICENSE.md) | Code license (MIT); what it does not cover |

Live data coverage is at `/data-status`, formulas at `/methodology`, sources at `/about/credits`.

## Owner to-do (cannot be done from code)
1. Message the nanoka.cc maintainer, and ask Prydwen whether fetching from their CloudFront origin is acceptable. Record both in `docs/PERMISSIONS.md`.
2. Add the saved permission messages for Prydwen, Slyraf and TheWuWaCalculator to `docs/PERMISSIONS.md`.
3. Confirm the MIT license is what you want.
