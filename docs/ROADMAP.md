# Roadmap vs. the master plan

Legend: done, partial, not started.

| Plan area | Status | Notes |
|---|---|---|
| F-01..F-06 foundations | done | package name, .gitignore, .env.example, README, CI, `public/`, docs |
| D-01..D-02 schema + pipeline | partial | zod contracts + TS pipeline (raw JSON in); no datamine fetch yet |
| D-03..D-06 real data | not started | blocked on datamine ingestion; flagged in `/data-status` |
| D-07 banners/events | partial | ISO dates, status, linked features; no official-post ingestion |
| D-11 repo layer / client bundle | done | `server-only` repos; JSON never in client bundles |
| UX design system / shell | done | tokens, element theming, header/mega-menu, bottom nav, footer, command palette, motion kit |
| C-01..C-05 databases | done | characters (filters, URL-synced), hub with 6 tabs, weapons (rank slider), echoes, sonatas |
| C-07 compare page, glossary tooltips | not started | |
| E-01..E-02 engine v2 | done | zones, 3-branch RES, HP/DEF scaling, tests |
| E-03 effects DSL | partial | weapon + Sonata effects; chain/inherent/forte not modelled |
| E-04 golden tests | partial | formula unit tests; in-game golden vectors still needed |
| E-05 calculator | done | panels, explain, stat weights, A/B weapon compare, share |
| E-06..E-12 status damage, timeline, team, optimizer, analyzer | not started | |
| M-02 tier list | partial | roles, elements, roster filter, changelog; no objective DPR yet |
| M-05..M-06 patches, banners, events | partial | patch overview without diffs |
| P-01 Convene v2 | done | banner types, guarantee rules, conservative/community models, histogram |
| P-02..P-05 tracker, budget, materials, waveplate | not started | materials page lists who-needs-what only |
| A-01..A-05 accounts/community | partial | shared builds API (zod, rate limit, retry); roster is local-first |
| i18n, PWA, public API docs, map | not started | |
