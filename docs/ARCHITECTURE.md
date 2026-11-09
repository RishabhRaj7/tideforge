# Architecture & decisions

## ADR-1: Game content as versioned, validated JSON; Postgres for mutable data
The master plan proposes Postgres as the source of truth for game content. Until the datamine pipeline exists, content is produced by `scripts/pipeline` into `src/data/generated/*.json`:
- diffable in git (a data change is a reviewable PR),
- validated by zod on every run, with a quality report (`report.json`),
- read only through `src/server/repos` (`server-only`), so it is not bundled into client JS,
- builds with no database needed for static pages.

Postgres (`src/db/schema.ts`) holds mutable data: shared builds and error reports. The repo layer is the seam: moving content tables into Postgres later only changes `src/server/repos`.

## ADR-2: Engine is pure and shared
`src/engine` has no imports from React, Next or the DB. It runs in the browser (calculator), Node (tests, batch jobs) and is ready for a Web Worker.

## ADR-3: Honesty over completeness
Placeholders are flagged (`baseStatsConfidence: "estimated"`), unmodelled passives are labelled, and the tier list is editorial only until objective DPR can be computed. See `/data-status` and `/methodology`.

## Rendering
Content pages are statically generated; Home / Banners / Events use `revalidate = 300` because they depend on the current time. Calculator data is fetched on demand from cacheable `/api/v1/engine-data` routes.

## Boundaries
`engine` imports nothing app-specific. `components` do not import `server`. Pipeline imports only `engine/tags` and `data/schema`.
