# ARAM Rating MMR v2 — Global Latent Shadow

## Status

- **RESEARCH / SHADOW ONLY**
- Standard ARAM only: `queueId === 450`
- Production Rating remains OFF.
- Automatic model promotion remains OFF.
- This is an unofficial personal skill estimate, not Riot MMR.

## Goal

Estimate the latent skill of a searched ARAM player as accurately as the available match graph permits. Accuracy, calibration, uncertainty honesty, and leakage-free future validation take priority over instant coverage or a visually impressive score.

## Why this model exists

The current Elo/Glicko/TrueSkill-family baselines update players sequentially. MMR v2 instead fits the connected 5v5 match network jointly with a regularized Bradley–Terry/logistic likelihood:

`P(team A wins) = sigmoid(sum(player skill A) - sum(player skill B) + optional champion effects + side bias)`

The player-only candidate is the default v2 research candidate. Champion effects are stronger-shrunk nuisance parameters and are accepted only when a future holdout of at least 100 matches shows a paired-bootstrap Log Loss improvement without Brier/ECE regression.

## Evidence rules

1. Canonical identity is PUUID.
2. Canonical evidence identity is `matchId`.
3. Duplicate `matchId` evidence is idempotently ignored.
4. Any known queue other than 450 is rejected.
5. Invalid/incomplete 10-player matches are rejected, not guessed.
6. Evidence is sorted by timestamp then matchId.
7. Disconnected player components are tracked explicitly; equal-looking display ratings across disconnected components must not be treated as proven comparable.
8. A player with zero observed games is **unmeasured** (`rating: null`), never a fake 1500.

## Estimation

- Player latent skills use an L2 zero prior.
- Optional champion effects use a stronger L2 prior.
- Optional team-100 side bias is estimated separately.
- Optimization is deterministic batch diagonal-Newton-style iteration with bounded steps.
- Player parameters are recentered inside each connected component after every iteration.
- The display scale maps logistic latent units to the familiar Elo-like 1500 scale using `400 / ln(10)`. This is presentation only; it does not make the estimate Riot MMR.
- Uncertainty is a **diagonal Fisher approximation**. It is intentionally labelled approximate and must not be presented as a full Bayesian posterior or predictive accuracy.

## What is intentionally excluded for now

KDA, kills, deaths, assists, damage, healing, shielding, CS, item build, role-like heuristics, and other post-game performance features do **not** directly change MMR v2. They may be researched later only if strict future prediction improves. This avoids rewarding stat padding and systematically underrating tanks/supportive play.

Patch recency/decay and richer team-composition interactions are also excluded from this first global-latent candidate. They require separate ablations rather than being assumed useful.

## Validation contract

Chronological order is mandatory. The evaluator uses an 80/20 temporal split by default and supports exact walk-forward refits.

Primary metric: **Log Loss**.

Secondary metrics: **Brier score, ECE calibration, Accuracy**.

Reports are split into cold-start, developing, and mature evidence cohorts. Candidate comparisons use paired bootstrap confidence intervals on the same future matches.

The current promotion evidence gate is deliberately strict:

- at least 500 accepted real standard-ARAM matches,
- at least 100 frozen future-test matches,
- candidate Log Loss improvement with a 95% paired-bootstrap interval fully below zero versus the strongest existing baseline,
- Brier no worse than baseline by more than 0.002,
- ECE no worse than baseline by more than 0.01.

If these conditions are not satisfied, the result stays `insufficient_real_data` or `no_clear_winner`. Even `candidate_model` is research evidence only; there is no automatic production promotion.

## Production boundary

This branch does **not** modify `src/rating/universal/estimator.js`, the v0.17.1 updater manifest, the Universal Rating persistent DB owner, AutoSync/history network ownership, or the frozen `aram-rating-research-v03 / checkpoint-v03` checkpoint.

The live v0.17.1 sidecar can continue accumulating normal ARAM evidence. A later integration may feed a validated copy of that evidence into this evaluator, but data accumulation and predictive-model proof remain separate concerns.

## Next real-data step

Run the evaluator on a preserved, deduplicated queue-450 dataset with enough repeated players. Record dataset density and connected-component structure alongside predictive metrics. Do not broaden collection simply to inflate match count if it leaves most players as singletons; repeated observations and graph connectivity are part of rating identifiability.
