# Contributing

Thanks for helping. Tideforge is a fan project: accuracy and honesty about uncertainty matter more than volume.

## Setup
```bash
nvm use                 # Node 22 (.nvmrc)
cp .env.example .env
npm install
npm run db:push         # builds + feedback tables (needs Postgres, see .env.example)
npm run data:fetch && npm run data:curves && npm run data:images   # optional: datamine cache and art
npm run dev
```

## Before you open a PR
```bash
npm run data:validate   # golden curves, parsers, schema
npx tsc --noEmit
npm test
npm run build
```
CI runs the same steps.

## Rules
- **Numbers come from the datamine.** Do not hand-edit generated JSON. Change the pipeline or add an override in `data/manual/` and explain why.
- **Cite sources.** Every new data field needs provenance (`source`, `confidence`). Datamined beats wiki; if they disagree, add a row to the findings table in `docs/DATA.md`.
- **Do not copy prose** from Prydwen, Slyraf or other sites. Facts and ratings only, attributed and linked (see `docs/PERMISSIONS.md`).
- **Be polite when fetching.** Use `scripts/pipeline/lib/http.ts`; respect the rate limits in `docs/PERMISSIONS.md`.
- **Engine changes need tests**, ideally a golden value verified in game. State assumptions. If a mechanic is not modelled, label it instead of guessing.
- **Keep `src/engine` pure** (no React, Next or DB imports).
- **Accessibility:** colour is never the only carrier of meaning, keep focus rings, respect reduced motion.
- **Docs are part of the change.** Update `docs/ROADMAP.md` (status), `docs/DATA.md` (sources, findings), `docs/METHODOLOGY.md` (formulas) and `CHANGELOG.md` when behavior changes.

## Reporting data errors
Use the "Report an issue" button on any page, or open a GitHub issue with the page URL, the value you see and the value you expect (with a screenshot from the game if possible).

## Licensing
Code is MIT (`LICENSE`). Game assets and text are not covered (`DATA-LICENSE.md`).
