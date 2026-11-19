# Leonida Legend — GTA VI Trophy Guide & Tracker

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/sixtyseconds5/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/sixtyseconds5/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline guide and tracker for all **55 PlayStation 5 trophies** of Grand Theft Auto VI (1 Platinum, 2 Gold, 6 Silver, 46 Bronze — 28 of them hidden on PlayStation until earned). Every trophy has its official name, description and grade as PlayStation publishes them, plus a guide written for this entry, in the author's own words, with its sources cited beside it.

## What it does

- **Checklist tracker** — tick trophies off as you earn them; progress is saved in the browser (localStorage) and can be exported to a file and imported back.
- **Filters** — by kind (story, missable, collectibles, activities, online), by grade, by earned/unearned, and by text search.
- **Spoiler-safe mode** — hides the names, descriptions and guides of hidden trophies until you earn them.
- **Trophy detail view** — official description, grade, the guide, and its sources for every trophy.
- **Roadmap to the Platinum** — six stages in order (story → strangers → activities → collectibles → money & mayhem → cleanup), with the one possibly missable trophy flagged and the 100% checklist counts spelled out.
- **Deep links** — `?view=roadmap`, `?grade=silver`, `?kind=collectible`, `?trophy=positive-mental-attitude`, `?spoiler=1`, `?q=bank`.

## Launch-day honesty

GTA VI releases 19 November 2026. The guides are built from the official trophy descriptions plus the cited sources (the PlayStation list via Exophase and PSNProfiles; EGamers.io's trophy list drawing on GTABase, PowerPyx, TechWiser and Press-Start; Output Lag). Where the description is the only source, the guide says so and flags what is unconfirmed — no specific location or step is presented as fact without a source. Nothing is copied from another guide.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080. It is plain static files under `app/` — no build step, no network requests at run time. It works with the network off.

## Files

- `app/index.html`, `app/app.js`, `app/style.css` — the guide itself.
- `app/data/trophies.json` — the 55 trophies: official name, description, grade, hidden flag, kind, missable flag, roadmap stage, guide and sources.
- `main.ts` — hands the entry in (copies `app/` and `screenshots/`, writes `dossier.json`).
- `screenshots/` — four renders of the app in a real browser.
