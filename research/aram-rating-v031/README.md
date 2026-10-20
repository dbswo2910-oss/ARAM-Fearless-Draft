# ARAM Rating v0.3.1 — density-first active sampling + searched-player PUUID join

This branch is a research continuation from the real B1 result while keeping the production game features and scoring owners unchanged. Raw real match JSON, PUUIDs, Riot IDs and local identity mappings are never committed.

## Real B1 basis

Privacy-safe aggregate only:

- accepted matches: 159
- players: 1,238
- single-match fraction: 90.06%
- players 2+: 123
- players 5+: 15
- players 10+: 11

The local existing history bridge successfully returned up to 30 standard-ARAM matches in the capability probe, so the searched-player Research UI issue is not classified as a collection limitation.

## Research UI identity root cause

The Rating run already uses PUUID as the canonical identity join: `identity.puuid_to_player_id -> players[player_id]`. Every observed PUUID gets Elo/Glicko/TrueSkill-family state, including one-observation players. There is no minimum-observation hide gate; 1–2 games are shown with `표본 부족`.

The UI-side bug was target resolution and refresh ownership. The old helper chose `state.account || state.target || state.localAccount` as one mixed fallback and only remounted on profile mutation when the Research card was absent. A searched player could therefore retain the current account/stale PUUID or leave an existing card unrefreshed.

The repair makes **resolved PUUID the only canonical Research join key**. In searched mode the resolver never falls back to the logged-in local PUUID. Resolution order is searched target PUUID -> explicit targetPuuid -> searched account PUUID -> exact Riot ID match inside the returned searched match participants -> searched match `me` PUUID. Current-account mode remains local-account-first. Target changes now trigger a card remount even when the card already exists.

Local diagnostic output masks PUUID and prints:

```text
Search Riot ID:
Resolved PUUID:
Research DB player found: true/false
Observations:
Rating state found: true/false
Reason if unavailable:
```

## v0.3.1 sampling goal

The objective is not maximum new matches/request. It is maximum repeat-observation density and faster reduction of cold-start/uncertainty.

Candidate features:

- `current_observation_count`
- `already_observed_recent_matches`
- `expected_new_headroom = 20 - already_observed_recent_matches`
- `expected_duplicate_ratio`
- repeat-neighbor ratio / known-network overlap
- expected repeat gain
- threshold potential for 2+ / 5+ / 10+
- new-player proxy penalty
- duplicate waste / saturation / request cost

`already_observed_recent_matches` uses the candidate's exact match-id appearances already present in the current checkpoint, capped to the 20-match history window. It is the strongest no-extra-request overlap evidence available before querying that candidate. v0.3 did not persist a candidate's full pre-request 20-match history, so the counterfactual report labels any retrospective use of realized duplicate count explicitly as an oracle rather than pretending it was available at request time.

Default saturation skip:

- `expected_new_headroom <= 2`, or
- `expected_duplicate_ratio >= 0.8`.

## Candidate pools

1. **Pool 1:** original Phase-A seed players currently observed 1–4 times. Original singletons are strongest.
2. **Pool 2:** Phase-B-discovered players already observed at least twice.
3. Phase-B-discovered singletons are excluded.

The real 159-match preview produces 244 eligible candidates; the current Top 25 are all original Phase-A one-observation players with headroom 19. No network request was used to generate that preview.

## Priority formula

The implementation uses bounded components rather than allowing `repeat_connection_value` to dominate:

```text
priority =
  pool_bonus
+ 4.0 * headroom_ratio
+ existing_network_overlap
+ expected_known_player_reappearances
+ uncertainty_reduction
+ threshold_potential
- expected_new_player_penalty
- 5.0 * expected_duplicate_ratio
- saturation_penalty
- request_cost
```

Pool ordering is an explicit policy: Pool 1 precedes Pool 2, then priority orders candidates within a pool.

## B1 counterfactual

The v0.3 export did not persist exact pre-request recent-overlap match IDs. For retrospective validation only, realized duplicate count is used as an overlap oracle; the live v0.3.1 priority does **not** use realized results.

Privacy-safe aggregate result:

- old priority vs realized information gain Spearman: **-0.719**
- v0.3.1 counterfactual Spearman: **+0.799**
- old Top-5 realized information gain: **66.0**
- v0.3.1 Top-5: **208.5**
- saturated Player 001: headroom 0 -> skipped

## B2 safety

The helper uses the existing IndexedDB database/key exactly:

- DB: `aram-rating-research-v03`
- checkpoint: `checkpoint-v03`

It refuses B2 if the checkpoint contains fewer than 159 accepted matches. It does not re-import/restart from the 20-match Phase-A seed. B2 limits are fixed to Top 25, 20 matches/player, 500 accepted matches total. Loading the helper performs **zero network requests**. Network collection begins only after the user explicitly calls `runB2()`.

The initial anonymous Top-25 preview is a before-request snapshot. During B2 the candidate pool is **recomputed after every completed request from the updated checkpoint**, so newly created repeat observations and saturation can change the next candidate. The same player is never recursively expanded twice in the B2 completion set. If the final request would exceed the 500-match cap, density/new-player/threshold metrics are calculated only from the rows actually accepted; fetched-but-rejected rows are not credited.

After 10 completed B2 candidates it stores an interim snapshot with network KPIs and, when the bundled Research rating engine is available, Frozen/Walk-forward cold-start. B1/B2 totals include both `new_unique_matches_per_request` and `density_gain_per_request`.

## Real 159-match evaluator

The privacy-safe report preserves the existing v0.2 80/20 chronological evaluation semantics. The held-out test has 32 matches. TrueSkill-family has the best observed Frozen Log Loss, but the candidate gate remains `insufficient_real_data`: the existing gate requires at least 500 real matches and 100 frozen-test matches. No model is promoted.

## Manual use

Load the helper only; this does not collect:

```js
fetch('https://raw.githubusercontent.com/dbswo2910-oss/ARAM-Fearless-Draft/research/aram-rating-v031-active-sampling/research/aram-rating-v031/phase-b2-v031-devtools.js?ts='+Date.now()).then(r=>r.text()).then(code=>(0,eval)(code))
```

Preview with no requests:

```js
await aramRatingPhaseB031.preview()
```

Explicit B2 run (user action only):

```js
await aramRatingPhaseB031.runB2()
```
