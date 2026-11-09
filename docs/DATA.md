# Data

Where numbers come from, how the pipeline runs and what is known to be wrong. Priority and reconciliation rules: [PLAN.md section 5](PLAN.md).

## Sources
| Source | Role | Confidence | Notes |
|---|---|---|---|
| **nanoka.cc** (`static.nanoka.cc`) | Primary datamine: stats, per-level skill rows, weapon curves, images | `datamined` | Static JSON, no auth. Live and beta channels via `manifest.json`. Not covered by the permissions in PERMISSIONS.md: ask the maintainer |
| Arikatsu/WutheringWaves_Data | Cross-check and public fallback (raw BinData tables, 13 TextMap languages) | `datamined` | Not wired yet (P1-6) |
| Wiki scrape (`data/raw/*.json`, `scripts/scrape/`) | Descriptive fields, banners, events, passives text | `community` | Legacy source; placeholders flagged `estimated` |
| Prydwen, Slyraf | Attributed editorial opinions | n/a | Not ingested yet (Phase 6); never merged into our numbers |
| Official Kuro news | Banners, events, patch dates | `official` | Manual entry today |

### nanoka endpoints used
| Endpoint | Contents |
|---|---|
| `/manifest.json` | `ww.live` (3.7), `ww.latest` (3.8.5), `ww.available` |
| `/ww/<ver>/{character,weapon,echo,sonata,monster}.json` | Index files (names in en/ko/zh/ja, icon paths, rank, element) |
| `/ww/<ver>/en/{character,weapon,echo,monster}/<id>.json` | Details: stat curves, skill trees with per-level params, chains, ascension costs, weapon R1-R5 params |
| `/ww/<ver>/en/item.json` | 2,018 items |
| `/assets/ww/<path>.webp` | Art. Recipe: `/Game/Aki/UI/<path>.<Name>` becomes `<path>.webp` |

## Pipeline (commands)
```bash
npm run data:fetch      # nanoka -> data/raw/nanoka/<ver>/ (git-ignored cache, resumable). --channel=latest for beta
npm run data:build      # legacy raw (wiki) -> validated src/data/generated/*.json + report.json
npm run data:curves     # nanoka raw -> curves/, skill-levels/, nanoka-report.json
npm run data:images     # nanoka art -> public/img/** (git-ignored) + images.json
npm run data:validate   # golden curves, parser and schema invariants (also runs in CI)
npm run data:all        # all of the above in order
```
Fetchers are polite by construction (`scripts/pipeline/lib/http.ts`): descriptive User-Agent, concurrency 4 and 250 ms delay for data, 6 for images, retry with backoff, skip files that exist. To force a refresh delete `data/raw/nanoka/<ver>`.

### Layout
```
scripts/pipeline/
  lib/http.ts                 UA, retry, bounded concurrency
  fetch/nanoka.ts             manifest, indexes, details
  fetch/images.ts             art mirror + coverage manifest
  parse/multipliers.ts        "19.61%+9.81%*3" -> [[19.61,1],[9.81,3]]  (+ flat+pct, raw)
  parse/markup.ts             <color>, <size>, <te href> and {0} params -> AST / text
  normalize/curves.ts         stat curves + per-level skill rows
  run.ts                      legacy wiki normalizer (to be absorbed)
```

### Generated files (committed)
| File | Content |
|---|---|
| `src/data/generated/{characters,weapons,echoes,sonatas,banners,events}.json`, `report.json` | Legacy normalized dataset |
| `src/data/generated/curves/characters.json` | `{ slug: { id, stats: { asc: { level: [hp, atk, def] } } } }` (60 Resonators) |
| `src/data/generated/curves/weapons.json` | `{ slug: { id, sub, curve: { asc: { level: [atk, secondary%] } }, ranks: string[][] } }` (118 weapons) |
| `src/data/generated/skill-levels/<slug>.json` | Per-level skill rows: `{ node, type, name, desc, rows: [{ name, mult: Multiplier[], extra }] }` where `mult[i]` is level i+1 |
| `src/data/generated/nanoka-report.json`, `images.json` | Coverage summaries shown on `/data-status` |
| `src/data/version.json` | Live game version (single source) |

Not committed: `data/raw/nanoka/**` (re-fetch), `public/img/**` (run `data:images`).

## Units and conventions
- Weapon stat rows: `is_ratio` true means a fraction (`0.0855` = 8.55%); `is_percent` true means hundredths (`4860` = 48.6%); otherwise a flat value. The curve file stores secondary stats **in percent**.
- Level `20` exists in ascension 0 and 1 (and 40 in 1 and 2, and so on); the engine's `LEVEL_ASC` picks the right pair for labels such as `"40 (asc.)"`.
- Element ids in nanoka: 1 Glacio, 2 Fusion, 3 Electro, 4 Aero, 5 Spectro, 6 Havoc. Names are matched to our slugs by lowercase alphanumerics, so `Rover: Aero` matches `Rover (Aero)`.
- Nanoka markup is stripped with `parse/markup.ts`; `hasMarkup()` is the invariant check (`<color`, `<size`, `<te`, `{0}`).

## Provenance
Every entity carries `provenance { source, sourceRef, version, confidence, verifiedAt }`. The calculator engine character reports `baseConfidence: "datamined"` when exact stats are in use.

## Known findings and conflicts
| Finding | Detail | Handling |
|---|---|---|
| Lily | No datamine entry (placeholder in our data) | Estimated multiplier fallback; image falls back to a glyph tile |
| Aureate Zenith | Wiki: Crit. Rate 4.5%. Datamine: Crit. DMG 9% | Datamine wins; wiki fix pending |
| Solar Flame | One rank param row has 4 entries (others 5) | Allow-listed in `tests/curves.test.ts` |
| 8 weapons | Wiki Lv1 secondary differs by rounding only (for example DEF 13.6 vs 13.68) | Datamine wins |
| Nanoka weapons without stats | 9 "Projection: ..." entries have no ascension data | Not in our dataset; ignored |
| Still wiki-only | Echo main/substat tables, voice actors, obtain text | Spike P1-5 |
| Open gaps from the original audit | Buling, Jingran, Lucilla, Lucy, Rebecca had placeholder base stats (now covered by curves); skill rows missing for Cartethyia, Encore, Hiyuki, Lily in the legacy dataset (per-level rows now generated from the datamine where it has them); weekly-boss materials empty for all | Merge into `characters.json` in P1-3 |

## Patch-day procedure (target under 1 hour)
1. The weekly data-watch workflow opens an issue when nanoka `live` differs from `src/data/version.json` (or run `curl https://static.nanoka.cc/manifest.json`).
2. `npm run data:all` (it re-fetches only what is missing; delete the old version folder first for a clean pull).
3. Review the diff of `src/data/generated/**` and the `/data-status` report; fix conflicts.
4. Bump `src/data/version.json`, update banners/events (manual until official ingestion exists), update `docs/ROADMAP.md` and `CHANGELOG.md`.
5. Open one PR; CI runs `data:validate`, typecheck, tests and the build.

## Images
Art is mirrored once and served from our own origin (never hot-linked from nanoka). Dev: `public/img` populated by `npm run data:images` (about 24 MB, 468 files). Production: upload the folder to object storage behind a CDN and set `NEXT_PUBLIC_ASSET_BASE` plus `images.remotePatterns` (planned). Components fall back to a glyph/monogram tile when a file is missing, so a missing mirror degrades gracefully instead of breaking pages.
