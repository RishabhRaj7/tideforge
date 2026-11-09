# Architecture and decisions

## Overview
```
 nanoka.cc / wiki scrape ──► scripts/pipeline ──► src/data/generated/*.json ─┐
                                   │                                          ▼
                                   └──► public/img/** (art mirror)     src/server/repos (server-only)
                                                                        │             │
                     src/engine (pure TS) ◄───── /api/v1/engine-data ◄──┘     Server Components (pages)
                              ▲                                                       │
                              └──────────── Calculator (client) ◄─────────────────────┘
 Postgres (Drizzle): builds, feedback (mutable data)
```
Stack: Next.js 16 (App Router), React 19, Tailwind 4, zod 4, zustand, `motion`, minisearch, Drizzle + `pg`, vitest, tsx.

## ADR-1: Game content as versioned, validated JSON; Postgres for mutable data (revised direction)
Content is produced by `scripts/pipeline` into `src/data/generated/*` (diffable in git, zod-validated, read only through `src/server/repos` so it never reaches client bundles, buildable with no database). Postgres (`src/db/schema.ts`) holds shared builds and error reports.
**Direction (PLAN section 8.2):** Postgres becomes the query layer for pages, filters, search and tier-list history, seeded by `data:seed`; JSON stays the diffable build artifact. The repo layer is the seam, so the switch only touches `src/server/repos`. Not started.

## ADR-2: The engine is pure and shared
`src/engine` imports nothing from React, Next or the DB. It runs in the browser, in Node (tests, batch jobs) and is ready for a Web Worker. It receives exact datamined curves as plain data (`EngineChar.levelStats`, `EngineWeapon.levelCurve`) assembled by the repo layer.

## ADR-3: Honesty over completeness
Placeholders are flagged (`estimated`), unmodelled effects are labelled, a datamined value always beats a wiki value, and the tier list is editorial until DPR is computed. See `/data-status` and `/methodology`.

## ADR-4: Datamine first, editorial layer attributed (new)
nanoka is the primary source for numbers, text, IDs and images; Prydwen and Slyraf are stored as attributed external opinions, never as our numbers (PLAN section 5.1, PERMISSIONS.md).

## ADR-5: Mirror art, never hot-link (new)
Art is downloaded once into `public/img` by `npm run data:images`, which is git-ignored and reproducible. A coverage manifest (`images.json`) is committed. Components fall back to a glyph tile on any missing file. Production serves from object storage behind a CDN.

## ADR-6: Raw datamine is a cache, not source code (new)
`data/raw/nanoka/**` is git-ignored and re-fetchable; only compact, validated outputs are committed (about 4 MB in `src/data/generated`). `data/raw/*.json` (legacy wiki scrape) stays committed until the wiki is fully replaced.

## Rendering
Content pages are statically generated. Home, Banners and Events use `revalidate = 300` because they depend on the current time. The calculator fetches `/api/v1/engine-data` (weapons and Sonatas, including exact weapon curves) and `/api/v1/engine-data/[slug]` (a Resonator, including exact level stats) on demand from cacheable routes. `/api/health` checks database connectivity for the platform.

## Folder structure (current)
```
src/app/            routes (+ api/v1, api/health)       src/engine/       pure damage/stats/Convene engine
src/components/     ui, layout, motion, GameImage, ...   src/server/repos/ server-only read models
src/data/           zod schema, generated data, version  src/db/           Drizzle schema (builds, feedback)
src/content/        editorial tier list                  scripts/pipeline/ fetch, parse, normalize
scripts/scrape/     legacy wiki scraper (Python/Lua)     tests/            engine, data, curves, parsers
docs/               this folder                          .github/workflows ci, data-watch
```

## Boundaries
`engine` imports nothing app-specific. `components` do not import `server`. The pipeline imports only `engine/tags`, `engine/constants` (via the repo layer), and `data/schema`. Tests may import pipeline parsers directly.

## Setup after cloning
```bash
cp .env.example .env && npm install
npm run db:push
npm run data:fetch && npm run data:curves && npm run data:images   # datamine cache, curves, art
npm test && npm run dev
```
The generated JSON is committed, so the site works before any fetch; art simply shows fallback tiles until `data:images` runs.

## Boundaries of this build (what does not exist yet)
No Postgres content tables, no `<Art/>` with `next/image` and blur placeholders, no rotation/team simulation, no optimizer, no Prydwen/Slyraf ingestion. See ROADMAP.md.
