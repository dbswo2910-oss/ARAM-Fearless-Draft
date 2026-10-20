# ARAM Rating — Engine v0.1 Research Foundation

Status: **research-only / not player-facing**

This folder is intentionally isolated from the active Electron runtime. It does
not modify `update/manifest.json`, preload, AutoSync ownership, RANDOM, DATA,
item recommendations, Riot Grade, draft scoring, or player-profile rendering.

## Research question

> Can standard-ARAM win/loss and teammate/opponent strength alone produce a
> useful estimate of future match outcomes?

v0.1 deliberately excludes KDA, damage, damage taken, healing, shielding,
champion tier, composition tier, role, champion mastery, recent-form weighting,
and patch adjustment from the rating update. Those raw fields may be stored for
future experiments.

## Compliance gate discovered during source research

Riot's current General Policies state that products cannot create alternatives
to official skill ranking systems and explicitly list MMR/ELO calculators as
prohibited alternatives:

- https://developer.riotgames.com/policies/general

Therefore this repository does **not** currently ship a player-facing
`ARAM Rating`, percentile, leaderboard, or live Riot Match-V5 crawler. A UI card
must remain blocked until the intended use is reviewed/approved with Riot.

Riot also documents the local League Client API as unsupported for third-party
applications, so the existing app's LCU bridge is not treated as a scalable
research crawler.

The research benchmark itself remains useful: it can validate methodology on
synthetic data or on match data the project is lawfully allowed to process.

## Data-source findings

### 1. Riot official API — preferred long-term source if/when the use case is approved

Verified current developer documentation:

- Match-V5 is listed as the League of Legends match-history API.
- Riot ID should be resolved to PUUID; PUUID is the preferred stable player key.
- KR is a platform route and ASIA is a regional route family.
- Development keys expire every 24 hours.
- Personal keys are intended for personal/private research and are rate limited
  to 20 requests/second and 100 requests/2 minutes.
- Production keys are required for public consumption and start much higher.
- 429 handling must honor `Retry-After`.
- API keys must not be embedded in distributed binaries.

References:
- https://developer.riotgames.com/docs/lol
- https://developer.riotgames.com/docs/portal
- https://developer.riotgames.com/apis/

Expected sanctioned collector shape after policy approval:
1. Riot ID -> PUUID.
2. PUUID -> Match-V5 match IDs, filtered to queue 450 where supported.
3. Match ID -> full match payload with ten participants.
4. Normalize, deduplicate by `match_id`, enqueue newly observed PUUIDs.
5. Respect application/method/service rate limits, `Retry-After`, retry cap,
   cooldown, maximum matches/players/depth/calls, and checkpointing.

No private API is assumed.

### 2. OP.GG — research reference only, no automated collector in v0.1

OP.GG's help center has public guidance around its data, while its platform
terms expressly restrict automated means such as bots, spiders and scrapers
without prior permission. v0.1 therefore does not implement an OP.GG scraper,
private endpoint, CAPTCHA bypass, or rate-limit bypass.

References:
- https://help.op.gg/hc/ko/
- https://op.gg/ko/lol/policies/agreement

### 3. Existing ARAM Fearless Draft data

Current app structure, verified from repository:
- Electron main owns a `LeagueAutoSyncCore` instance.
- `ipcMain.handle('match-history:load', ...)` calls
  `core.getAramMatchHistory(opts)`.
- `preload.js` exposes it as `window.aramDesktop.getAramMatchHistory`.
- Standard ARAM is queue 450; Mayhem is separate.
- v0.15.128 adds cache-first history painting, interactive quick scan,
  background deep backfill, duplicate request coalescing, and a latest-game
  probe.
- Existing result compatibility already handles LCU-style
  `participantIdentities`, `participants[*].stats`, champion ID, K/D/A, damage,
  CC and item fields.
- Player profile is currently renderer-side and derived from loaded history; it
  is not a durable global skill-rating database.
- Existing persistent safety/state systems are file/local-state based; there is
  no SQLite runtime dependency in the active package.

`program_import.py` converts exported current-program/LCU match payloads into
the research envelope. It refuses any match whose 10 participants cannot be
resolved to stable PUUIDs.

## Database

`schema.sql` keeps raw match storage separate from derived experiments.

Core raw tables:
- `players`
- `matches`
- `match_players`

Collection state:
- `crawl_frontier`
- `crawl_checkpoint`

Derived/recomputable output:
- `rating_runs`
- `rating_player_states`
- `rating_predictions`
- `rating_metrics`

`matches.match_id` is a primary key and
`match_players(match_id, player_id)` is a composite primary key, so duplicate
matches/participants cannot silently accumulate.

Only queue **450** is accepted by the v0.1 importer.

## Collection frontier

`storage.Frontier` implements the resumable state machine and hard limits
without doing network I/O:

- maximum matches
- maximum players
- maximum depth
- maximum calls
- retry limit
- cooldown / retry-after
- persisted pending/inflight/done/failed state
- persisted checkpoint
- stale in-flight recovery after interruption

A sanctioned provider can later attach to this frontier without rewriting the
database or rating engine.

## Models

All models consume only team membership + result.

### Team Elo
- initial 1500
- team strength = mean player rating
- logistic win probability
- equal per-player team update
- uncertainty is explicitly a sample-size heuristic because Elo has no native
  posterior variance

### Glicko-family team approximation
- initial 1500 / RD 350
- each player observes the opposing team mean as a pseudo-opponent
- opposing team RD is the standard error of that team mean
- all ten updates use the same pre-match snapshot
- reported uncertainty is Glicko-family RD

### TrueSkill-family Gaussian team model
- two-team, no-draw Gaussian skill model
- team performance sums individual performance distributions
- v/w moment update for the winning/losing team
- uncertainty is posterior sigma converted to the common display scale
- dependency-free implementation for deterministic research; it is described
  as TrueSkill-family rather than claiming to be Microsoft's reference package

## Validation

`evaluation.py` enforces a chronological split. Default:
- oldest 80% = training
- newest 20% = future test

Checks:
- train/test match IDs must be disjoint
- train must finish no later than test starts
- every prediction is calculated from pre-match state
- primary test is `frozen` ratings created from training only
- a separate `walk_forward` diagnostic may update only after each test result

Metrics:
- accuracy
- log loss
- Brier score
- 10-bin calibration / ECE
- sample count
- cold-start player fraction
- favorite's actual win rate by absolute rating-difference bins:
  `0–50`, `50–100`, `100–200`, `200–300`, `300+`

Model selection is driven by frozen future-test log loss. Paired bootstrap
confidence intervals compare candidate models on the exact same matches.
If the best observed model is not clearly better than the runner-up, the result
is `no_clear_winner`.

The benchmark also compares against a 50/50 baseline:
- log loss = ln(2) ~= 0.6931
- Brier = 0.25

## Local commands

```bash
python research/aram-rating-v01/cli.py init-db --db /tmp/aram-rating.db

python research/aram-rating-v01/cli.py synthetic \
  --db /tmp/aram-rating.db --matches 1200 --players 240

python research/aram-rating-v01/cli.py audit-data --db /tmp/aram-rating.db

python research/aram-rating-v01/cli.py evaluate \
  --db /tmp/aram-rating.db --output /tmp/report.json

python research/aram-rating-v01/cli.py convert-current-program \
  --input current_program_history.json --output exported_matches.jsonl

python research/aram-rating-v01/cli.py import-jsonl \
  --db /tmp/aram-rating.db --input exported_matches.jsonl
```

Synthetic results validate the pipeline only. They are not evidence that a
real ARAM rating works.

## Automated experiment gate

`experiment.py` formalizes the future AI-improvement loop. A candidate model is
compared with the baseline on the **same frozen future test set**. It can be
promoted only when the candidate has lower future-test log loss and the paired
bootstrap 95% confidence interval for candidate-minus-baseline log loss is
fully below zero. Training fit is never a promotion criterion.

## Player-facing integration gate

Do **not** connect this to the current profile UI yet.

The future card proposed by product design (`rating ± uncertainty`, sample
percentile, games, trend, confidence) is intentionally deferred until both are
true:

1. Real KR standard-ARAM data demonstrates out-of-sample predictive value.
2. The player-facing use case is compatible with Riot policy / explicitly
   accepted by Riot.

If opened later, the label must state that it is an unofficial estimate from
public match history and must never be presented as Riot internal MMR.
