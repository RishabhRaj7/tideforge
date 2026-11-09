# Data

Pipeline: `npm run data:build` (`scripts/pipeline/run.ts`)

1. **raw**: `data/raw/*.json` is the legacy wiki scrape (Python/Lua scripts kept in `scripts/legacy-scrape` for reference only).
2. **normalize**: strips wiki template leakage, fixes typos, parses ISO dates, derives release versions from banner history, infers hit tag and scaling stat, parses weapon passives into templates with per-rank parameters, flags placeholders.
3. **validate**: zod contracts in `src/data/schema.ts` + leakage invariants. Failures exit non-zero.
4. **generate**: `src/data/generated/*.json` and `report.json` (rendered at `/data-status`).

## Provenance
Every entity carries `provenance { source, sourceRef, version, confidence, verifiedAt }`. Current content is `community` (wiki) confidence; placeholders are `estimated`.

## Next data milestones
- Replace wiki sources with datamined game files (real stat curves, per-skill multiplier arrays, passive parameters).
- Real stats for Buling, Jingran, Lily, Lucilla, Lucy, Rebecca; skill rows for Cartethyia, Encore, Hiyuki, Lily.
- Image pipeline (sharp, AVIF/WebP) into `public/img` or object storage.
