# ARAM Rating v0.3.2 — B2 Top-25 Manual Runbook

This runbook is Research-only. It does not change the production Rating model.

## Preconditions

- Desktop app is running v0.16.0 CLEAN BASELINE.
- League Client is running and logged in before the real B2 run.
- Existing IndexedDB must already contain `aram-rating-research-v03` / `checkpoint-v03`.
- Existing checkpoint must contain at least 159 accepted standard ARAM matches and the original 20 Phase-A seed matches.
- The runner refuses to create a missing Research DB and never deletes/resets the existing checkpoint.

## 1. Load the Research helper

Open the app DevTools Console and run:

```js
await fetch('https://raw.githubusercontent.com/dbswo2910-oss/ARAM-Fearless-Draft/research/aram-rating-v032-accuracy-first/research/aram-rating-v032/phase-b2-v032-devtools.js?t='+Date.now()).then(r=>{if(!r.ok)throw new Error('helper_fetch_'+r.status);return r.text()}).then(s=>(0,eval)(s))
```

Loading the helper does **not** start Riot/LCU collection. It only registers `window.aramRatingB2V032`.

## 2. Preview first — no Riot/LCU collection

```js
await aramRatingB2V032.preview()
```

Expected preview contract:

- `status: 'PREVIEW_ONLY'`
- `riot_lcu_collection_requests_performed: 0`
- `checkpoint_matches >= 159`
- up to 25 anonymized candidates
- before-run network KPIs: single-match fraction, 2+/5+/10+ players, connected components, giant-component ratio

Stop if the checkpoint is missing, below 159, or the Phase-A seed contract is not exactly 20 accepted matches.

## 3. Real B2 run — explicit approval only

Do not run this command until the live B2 collection is explicitly approved:

```js
await aramRatingB2V032.runB2({confirm:'B2-ACCURACY-FIRST'})
```

Hard safety limits:

- maximum 25 expanded players
- maximum 20 fetched standard-ARAM matches per selected player
- maximum 500 total accepted matches in the checkpoint
- maximum 75 collection requests
- dynamic re-ranking after every accepted expansion
- automatic/background collection remains OFF

The runner only accepts queue 450 matches with exactly 10 unique PUUID participants, deduplicates match IDs, verifies the returned history contains the requested target PUUID, and persists after every accepted expansion.

## 4. Status / abort

```js
await aramRatingB2V032.status()
```

```js
aramRatingB2V032.abort()
```

Abort is cooperative; the in-flight request may finish, then the run stops and keeps the last safely persisted checkpoint.

## Result metrics

The returned summary is privacy-safe and does not expose raw PUUID or Riot ID. Compare before/after:

- accepted match count
- single-match fraction
- players with 2+ / 5+ / 10+ observations
- connected components
- giant-component ratio
- interim snapshot after 10 expansions

The Research checkpoint may contain raw PUUIDs locally because PUUID is the canonical identity key; those values are not committed into repository reports.
