# ARAM Rating Research v0.2 — Real KR ARAM Validation

Status: **research-only / no player-facing Rating UI**

v0.2 continues the v0.1 methodology from baseline commit
`fb4c23da9f5584fcfc82bc3982c47854a3c27f4b`. The v0.1 dedicated audit and
Full Regression Audit both passed before this branch was created.

## Goal

Test whether a latent skill signal exists in **real KR standard ARAM (queue 450)**
using only match outcome and pre-match teammate/opponent strength. KDA, damage,
damage taken, healing, shielding, gold, champion strength, composition score,
role and recent-form weighting are stored when present but are not rating inputs.

This branch does not modify the active Electron runtime, `update/manifest.json`,
preload IPC, AutoSync ownership, RANDOM, DATA, item recommendations, Riot Grade,
draft/recommendation scoring, or player profile UI.

## Real-data source order

No OP.GG scraper, private endpoint guess, CAPTCHA/rate-limit bypass, or Riot
Match-V5 network crawler is added here. The first source is data the desktop app
already obtained through its existing match-history flow.

`export-current-history-devtools.js` is a developer-only helper for a running
app. It calls the already exposed `window.aramDesktop.getAramMatchHistory`, then
copies the raw response to the DevTools clipboard when possible. It adds no IPC,
UI, updater payload, background poller, or network source.

Because the repository/CI environment cannot access the user's running League
Client or Electron session, **real match exports are deliberately not committed**.
`data/.gitignore` prevents accidental PUUID-bearing datasets or SQLite DBs from
being added to the public repository.

## Pipeline

1. Export current-program history locally.
2. `run.py audit-export` normalizes only fields that actually exist and performs
   a strict data audit.
3. Accepted rows are copied into the v0.1 SQLite raw tables.
4. `run.py evaluate-real` performs a chronological 80/20 split.
5. Team Elo, Glicko-family and TrueSkill-family models are evaluated on the same
   frozen future test and separately in walk-forward mode.
6. Constant 50%, historical player win-rate and recent player win-rate baselines
   are evaluated on the same matches.
7. The report includes network connectivity, cold-start strata, paired bootstrap,
   rating-difference buckets, favorite-probability calibration, patch slices,
   uncertainty-by-sample and anonymized extreme-value diagnostics.

## Data audit

The audit reports raw / accepted / rejected counts and exact rejection reasons.
It checks queue 450, 10 participants, 5v5 teams, stable PUUIDs, duplicate PUUIDs,
winner consistency, duration/remake threshold, timestamps, future timestamps,
patch parseability, champion-id plausibility, duplicate match IDs, duplicate
participants and conflicting duplicate versions. Bad rows are rejected rather
than repaired.

Default minimum duration is 180 seconds and may be changed explicitly from the
CLI. Missing champion IDs are reported as a warning because champion identity is
not a v0.2 rating input; a present but invalid champion ID is rejected.

## Model decision states

- `candidate_winner`: all promotion gates pass on real future data.
- `no_clear_winner`: enough data exists but no model meets every gate.
- `insufficient_real_data`: fewer than the configured real-data threshold
  (default 500 matches / 100 test matches).
- `pipeline_failure`: integrity/leakage/runtime validation failed.
- `fixture_only`: CI fixture execution; never presented as real evidence.

A model cannot become `candidate_winner` merely by winning on training data or by
having the best point estimate. It must beat 50/50 on Log Loss and Brier, avoid a
material calibration regression, improve on no-cold-start matches, beat its main
competitor with a paired-bootstrap 95% CI below zero, have enough test matches,
and show multi-patch robustness when that can be assessed.

## Local commands

```bash
# In the running desktop app DevTools, execute the contents of:
# research/aram-rating-v02/export-current-history-devtools.js
# Save the copied JSON as e.g. private/current-history.json

python research/aram-rating-v02/run.py audit-export \
  --input private/current-history.json \
  --accepted private/accepted.jsonl \
  --audit private/data-audit.json

python research/aram-rating-v02/run.py import-real \
  --db private/aram-rating-real.db \
  --input private/accepted.jsonl

python research/aram-rating-v02/run.py evaluate-real \
  --db private/aram-rating-real.db \
  --output-dir private/report
```

`run-all` performs all three steps in one command.

## Current environment limitation

GitHub Actions has no access to the user's live desktop history cache. Therefore
CI validates the entire pipeline with explicitly labelled **fixtures** and also
asserts that an empty real-data run returns `insufficient_real_data`. Synthetic
or fixture rows are never substituted for the real-data result.
