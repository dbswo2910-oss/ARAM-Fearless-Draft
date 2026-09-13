# ARAM Rating Research v0.3 — bounded network expansion

Phase B is research-only. It starts from the real Phase A connected component and tries to increase **repeat observations of already-known players**. It does not expose Rating/MMR/Elo/tier/percentile/leaderboard UI and is not referenced by the production manifest.

## Why

Phase A: 20 accepted KR standard-ARAM matches, 160 players, 93.75% single-match players, 100% giant component, 80% Frozen cold-start. Strategy: `CASE_B_REPEAT_EXISTING_PLAYERS`.

## Seed contract

Phase B **does not use the currently rendered Match Lab rows as its seed**. The real Phase A export (`schema: aram-rating-real-sample-v02`) must be imported once into local research IndexedDB. For the current experiment the importer validates the expected shape exactly: **20 matches / 160 players**. A one-match/current-screen seed is rejected.

Local-only storage:

- Phase A imported seed: `IndexedDB aram-rating-research-v03 / phase-a-seed-v02`
- Phase B checkpoint: `IndexedDB aram-rating-research-v03 / checkpoint-v03`

If a newly imported Phase A seed has a different fingerprint, the stale checkpoint is cleared. If the fingerprint matches, checkpoint/resume is preserved.

The helper also uses a global single-instance lock. A second invocation while Phase B is active exits immediately with:

```text
Phase B already running
```

## History-path audit

Tracked path: `LeagueAutoSyncCore.getAramMatchHistory` → Electron `match-history:load` → preload bridge → renderer.

Code-proven facts:

- `history-latency-v015128.js`: UI default **20**, renderer max **30**.
- `autosync-concurrency-v015119.js`: session cache max **40**, forwards caller `limit/scan`; it does not prove a 20-row backend cap.
- No pagination cursor contract is exposed by the current renderer/preload IPC.
- Phase A requested `limit=100, scan=200`, but the real Windows runtime returned 20 standard ARAM matches.
- The final base `autosync-core.js` implementation required by `main.js` is not tracked in this Git tree, so a hidden backend hard-cap line cannot honestly be named from repository source alone.

v0.3 therefore adds a read-only capability probe (`limit=30, scan=150`) against the same existing bridge. If another participant's history cannot be returned normally, collection stops as `blocked_by_data_source`; there is no external scraper or fallback crawler.

## Bounded collector

Phase B-1 defaults: top **10** seed players, max **20** history/player, hard cap **500** accepted unique matches, max **30** requests, **15 s** request timeout, **2** retries, **1.8 s** cooldown, **10 min** run timeout, IndexedDB checkpoint/resume and `window.aramRatingPhaseB.abort()` manual abort.

Newly discovered players are diagnostic only and never enter the frontier. Phase B-2 is allowed only if B-1 adds unique matches and moves repeat-observation KPIs in the desired direction; it can expand top 25–50 original seed candidates, still within the 500-match hard cap.

Priority heuristic:

`repeat_connection_value + uncertainty_reduction_value + component_density_value - duplicate_cost - request_cost`

Repeated observations, graph degree/bridge value and uncertainty-reduction proxy are rewarded. Duplicate/retry pressure from B-1 is fed back into B-2 scoring. Each candidate records requests, fetched matches, duplicates, new unique matches, new/known-player appearances, 2+/5+/10+ crossings and information gain.

## Evaluation

`phase_b.py` evaluates acquisition-order snapshots at seed, 100, 250, 500 and a final partial snapshot. It reuses the v0.2 evaluator unchanged: 50%, historical WR, recent WR, Elo, Glicko-family, TrueSkill-family, Frozen/Walk-forward, Log Loss/Brier/Accuracy/ECE, cold-start and uncertainty. The existing candidate gate remains authoritative; 500 matches never forces a winner.

## Privacy

Raw collector JSON, local SQLite, PUUID mappings, imported Phase A seed and identity-bearing checkpoints stay local. GitHub receives code, aggregate metrics and synthetic fixtures only.

## DevTools run

Load the helper:

```js
fetch('https://raw.githubusercontent.com/dbswo2910-oss/ARAM-Fearless-Draft/research/aram-rating-v03-network-expansion/research/aram-rating-v03/phase-b-expansion-devtools.js?ts='+Date.now()).then(r=>r.text()).then(code=>(0,eval)(code))
```

On the first run only, import the real Phase A JSON and start Phase B:

```js
await aramRatingPhaseB.importPhaseAAndRun()
```

Select `aram-rating-real-sample-20260914-0104.json`. The importer must report `Seed matches: 20 / Seed players: 160` before expansion begins.

After that, rerun only the helper load line. It automatically uses the stored Phase A seed and resumes the matching checkpoint. To abort safely:

```js
aramRatingPhaseB.abort()
```
