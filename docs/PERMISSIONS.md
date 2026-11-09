# Permissions, scraping rules and attribution

Tideforge is a **personal, non-commercial fan project**. Everything here exists to keep the permissions we rely on intact.
Plan reference: [PLAN.md section 6](PLAN.md).

## Permission log
Fill this in with the real messages (screenshots or pasted text) and dates. **Nothing below is assumed; unconfirmed rows stay "pending".**

| Source | Scope needed | Status | Date | Evidence |
|---|---|---|---|---|
| Prydwen (prydwen.gg) | Reading structured data and ratings for display with attribution | Stated by the owner as granted (personal project). **Attach the message.** | | |
| Prydwen CloudFront origin | Fetching from `d2ankz0m1a0dsp.cloudfront.net` instead of the public host (the public host has a Cloudflare challenge) | **Pending. Ask in writing.** If refused: Playwright flow using your own browser session | | |
| Slyraf (slyraf.com) | Reading guides, tier list, DPR tables for display with attribution. Reference and display only, **never ML training** (their content signal is `ai-train=no`) | Stated by the owner as granted. **Attach the message.** | | |
| TheWuWaCalculator | Using it interactively as a test oracle (no scraping) | Stated by the owner as granted. **Attach the message.** | | |
| nanoka.cc | Primary datamine and image CDN. **Not covered by the three permissions above.** | **Pending. Message the maintainer before production use.** Fallback: Arikatsu/WutheringWaves_Data (public) | | |
| encore.moe | Optional API | Not used. Not verified | | |

## Rules for every fetcher
- Descriptive `User-Agent`: `TideforgeBot/1.0 (+https://github.com/RishabhRaj7/tideforge; personal fan project)` (in `scripts/pipeline/lib/http.ts`). Add a contact email if the maintainers ask.
- Rate limits: **Prydwen 10 s between requests** (their Crawl-delay), **Slyraf 2 s**, **nanoka concurrency 4 with 250 ms delay** (images: concurrency 6, 40 ms; mirrored once, then cached).
- Run fetchers on patch day or manually. **Never** on page load and **never** from the browser.
- Cache raw responses under `data/raw/` and do not re-fetch unchanged files.
- Do not scrape logged-in areas (Pull Tracker, Matrix Planner) or anything under `/api/` or `/auth/`.
- Never hot-link third-party art at runtime (it is their bandwidth and it can break). Mirror it once.

## What we store from Prydwen and Slyraf
Facts and ratings only (tier, role, mode, percentage values, team lists, capture date, source URL), in a future `external_opinions` table. Every card links back to the source page and shows the capture date, for example:
> Prydwen: T0.5 (Tower of Adversity), captured 2026-11-09, view on Prydwen
We do **not** republish their guide prose, rotations or rankings as ours. Our guides and rotations are written by us from datamine plus engine output.

## Non-commercial stance
No ads, paywall or affiliate links. Ask the site owners first before adding even a tip-jar link.

## Takedown and purge
Game art and text belong to Kuro Games. If a rights holder or source asks for removal: delete `public/img`, remove the affected generated files, republish. Mirrors are reproducible so this is a one-command change.

## Attribution (shown on `/about/credits` and in the footer)
nanoka.cc, Arikatsu/WutheringWaves_Data, Prydwen, Slyraf, TheWuWaCalculator and the community wiki, with what each is used for. Footer disclaimer: "Fan-made. Wuthering Waves and all game assets are property of Kuro Games."
