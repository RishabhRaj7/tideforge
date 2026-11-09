# Tideforge

Forge your resonance. A fan-made **Wuthering Waves** companion: tier list, Resonator / weapon / Echo database, damage calculator, Convene planner, banners and events. Every number shows where it came from.

> Unofficial fan project, not affiliated with Kuro Games.

## Quick start
```bash
cp .env.example .env
npm install
npm run db:push        # creates the builds + feedback tables
npm run data:build     # raw -> validated dataset in src/data/generated (+ report.json)
npm test               # engine + data invariants
npm run dev
```

## What is where
| Path | Purpose |
|---|---|
| `src/engine` | Pure TypeScript damage / stats / Convene engine. No React, DB or Next imports. Unit tested (`tests/`). |
| `scripts/pipeline` | Data pipeline: `data/raw` -> normalize -> zod-validate -> `src/data/generated`. |
| `src/data/schema.ts` | zod data contracts shared by pipeline and app. |
| `src/server/repos` | `server-only` read models. The 1.5 MB dataset never reaches client bundles. |
| `src/app/api/v1` | Versioned API: builds (zod, rate limit, collision-safe codes), engine data, search index, feedback. |
| `src/content` | Editorial content (tier list) reviewed through PRs. |
| `docs/` | Architecture, data notes, roadmap and status against the master plan. |

See `docs/ARCHITECTURE.md` for decisions and `docs/ROADMAP.md` for what is done and what is next. Live data coverage is at `/data-status`.

## Images
Game art is not committed. Components render a fallback tile when `/img/...` is missing. Put processed assets in `public/img` (see `docs/DATA.md`).
