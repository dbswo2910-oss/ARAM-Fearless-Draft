# ARAM Rating Research v0.2 — Real KR ARAM Validation

Status: **research-only / no player-facing Rating UI**

v0.2 continues the v0.1 methodology from baseline commit
`fb4c23da9f5584fcfc82bc3982c47854a3c27f4b`. The active application remains
v0.15.128 and this research branch does not modify `update/manifest.json`,
production preload IPC, AutoSync ownership, RANDOM, DATA, item recommendation,
Riot Grade, Match Lab UI, draft/recommendation scoring, or player profile UI.

## Phase A goal

Phase A is not a model-selection exercise. Its purpose is to prove that the first
real KR standard-ARAM sample can travel safely through:

`running app -> local JSON -> strict audit -> local identity anonymization -> SQLite -> network graph -> Elo/Glicko/TrueSkill-family -> frozen/walk-forward -> report`

For a 50–100 match sample the required status is
`insufficient_for_model_selection`. No candidate winner, KR percentile or skill
tier may be produced from Phase A.

## Export path

The installed app already exposes:

`window.aramDesktop.getAramMatchHistory(options)`

through production preload, which invokes `match-history:load` in the main
process and then the existing AutoSync core. The research exporter adds no new
IPC and is **not** included in the updater manifest.

`export-current-history-devtools.js` now:

1. uses current renderer/history cache first,
2. if fewer than 50 explicit queue-450 games are available, performs at most one
   bounded read through the application's existing standard-ARAM history path,
3. never uses Mayhem and never recursively expands participant histories,
4. keeps at most 100 explicit `queueId=450` matches,
5. validates queue / roster / PUUID / duplicate IDs,
6. automatically downloads
   `aram-rating-real-sample-YYYYMMDD-HHmm.json`,
7. keeps the file even when validation problems exist so Python Data Audit can
   report the exact rejected rows.

### One-line DevTools loader

Open the app DevTools Console and paste exactly one line:

```js
fetch('https://raw.githubusercontent.com/dbswo2910-oss/ARAM-Fearless-Draft/research/aram-rating-v02-real-data/research/aram-rating-v02/export-current-history-devtools.js?ts='+Date.now()).then(r=>{if(!r.ok)throw new Error('export helper download failed '+r.status);return r.text()}).then(code=>(0,eval)(code))
```

The helper downloads the JSON automatically. No long script needs to be pasted.
If the Electron renderer ever blocks that raw-GitHub fetch, the fallback is to
execute the helper file contents directly; no production code needs to change.

## Export schema

The envelope is:

```json
{
  "schema": "aram-rating-real-sample-v02",
  "metadata": {
    "source": "local_running_app",
    "exported_at": "...",
    "region": "KR",
    "queue": 450,
    "match_count": 83,
    "validation": {}
  },
  "matches": []
}
```

The individual match objects are preserved from the existing app response. The
exporter does not invent missing match fields.

## Privacy

Real export files contain Riot PUUIDs, so they are local-only. The directory:

`research/aram-rating-v02/data/*`

is ignored except for its `.gitignore` file.

Before SQLite import, Phase A converts every raw PUUID to a local internal ID such
as `player-internal-000123` and removes Riot ID / tag fields. The v0.1 database
schema retains the historical column name `puuid` for compatibility, but Phase A
stores only the internal anonymized value in that column. The raw PUUID ->
internal-ID map is kept only in `identity-map.local.json` inside the ignored local
Phase A output directory.

## One-command Phase A

After exporting:

```bash
python research/aram-rating-v02/phase_a.py "C:\path\to\aram-rating-real-sample-YYYYMMDD-HHmm.json"
```

Default local output goes to an ignored folder:

`research/aram-rating-v02/data/phase-a-YYYYMMDD-HHmmss/`

It contains:

- `data-audit.json`
- `identity-map.local.json`
- `accepted-anonymized.jsonl`
- `aram-rating-phase-a.db`
- `aram-rating-v02-report.json`
- `aram-rating-v02-report.md`
- `phase-a-summary.json`

## Data Audit

The audit reports raw / accepted / rejected counts and exact rejection reasons.
It checks queue 450, 10 participants, 5v5 teams, stable PUUIDs, duplicate PUUIDs,
winner consistency, duration/remake threshold, timestamps, future timestamps,
patch parseability, champion-id plausibility, duplicate match IDs and conflicting
duplicate versions. Invalid rows are rejected rather than repaired.

## Phase A outputs

Even with only 50–100 matches, the report includes:

- unique players
- average / median matches per player
- single-match player fraction
- 10+ match player fraction
- largest connected component fraction
- repeated teammate clusters (never treated as confirmed party)
- frozen-test cold-start rate
- Team Elo / Glicko-family / TrueSkill-family execution
- constant 50%, historical win-rate and recent win-rate baselines
- chronological 80/20 frozen and walk-forward runs
- Log Loss / Brier / Accuracy / ECE
- rating-difference and calibration buckets
- bootstrap diagnostics
- automatic Phase B collection recommendation

## Phase B recommendation logic

Phase A does not merely say “collect more data”. It classifies the observed
network:

- `CASE_A_DEEPEN_CURRENT_COMPONENT`: repeat observations are already healthy;
  deepen the current component.
- `CASE_B_REPEAT_EXISTING_PLAYERS`: too many one-game / cold-start players;
  expand histories of already-observed participants rather than adding seeds.
- `CASE_C_COMPONENT_BRIDGING`: the graph is fragmented; prioritize observed
  players likely to connect components.
- `CASE_HYBRID`: use a bounded mix of the above.

Riot Match-V5 automatic expansion remains disabled in Phase A.

## Decision states

- `insufficient_real_data`: no usable real sample yet / too few games to execute
  the chronological model pipeline.
- `insufficient_for_model_selection`: real Phase A metrics exist, but the sample
  is deliberately below the model-selection threshold.
- `candidate_winner` / `no_clear_winner`: only eligible after the larger real-data
  threshold is met; Phase A explicitly forbids `candidate_winner`.
- `fixture_only`: CI fixtures; never presented as real evidence.

## CI / regression

CI performs:

- v0.1 research audit
- v0.2 data/evaluation/report audit
- mocked full export path through the existing preload/main bridge contract
- automatic JSON download validation
- 84-match Phase A end-to-end fixture run
- anonymized DB verification
- `insufficient_for_model_selection` guard
- no-Riot-crawler guard
- existing Full Regression Audit through Draft/RANDOM/DATA/item/AutoSync/update
  safety/history/continuity checks.

Synthetic/fixture rows are never substituted for a real-data result.
