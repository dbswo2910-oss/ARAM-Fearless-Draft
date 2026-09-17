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

The default v2 path is player-only. Regularization strength is selected only on a chronological validation block. Recency weighting and champion effects are optional nuisance-model extensions; neither is assumed helpful. Each can replace the simpler model only when the validation block shows a paired-bootstrap Log Loss improvement without Brier/ECE regression. Champion control additionally requires high champion-ID coverage.

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
- Optional champion effects use a substantially stronger L2 prior so champion strength is treated as a nuisance correction rather than a second player rating.
- Optional team-100 side bias is estimated separately.
- Optional recency decay is expressed as a half-life and must win a validation ablation before it is selected.
- Optimization is deterministic batch diagonal-Newton-style iteration with bounded steps.
- Player parameters are recentered inside each connected component after every iteration.
- The display scale maps logistic latent units to the familiar Elo-like 1500 scale using `400 / ln(10)`. This is presentation only; it does not make the estimate Riot MMR.
- Uncertainty is a **diagonal Fisher approximation**, inflated conservatively for sparse/small match-network components. It is intentionally labelled approximate and must not be presented as a full Bayesian posterior or predictive accuracy.

## What is intentionally excluded for now

KDA, kills, deaths, assists, damage, healing, shielding, CS, item build, role-like heuristics, and other post-game performance features do **not** directly change MMR v2. They may be researched later only if strict future prediction improves. This avoids rewarding stat padding and systematically underrating tanks/supportive play.

Richer team-composition interactions and patch-specific parameters are also excluded from the first candidate. They require their own leakage-safe ablations rather than being assumed useful.

## Validation contract

Chronological order is mandatory. The default evaluator uses a **nested 60 / 20 / 20 temporal split**:

- first 60%: training,
- next 20%: validation/model selection,
- final 20%: untouched future test.

The final 20% is never used to choose Elo/Glicko/TrueSkill baseline, player regularization, recency decay, or champion control. After validation locks the choices, the selected models are refit on the first 80% and evaluated once on the untouched final 20%. The evaluator can additionally perform exact walk-forward refits through that final future period.

Primary metric: **Log Loss**.

Secondary metrics: **Brier score, ECE calibration, Accuracy**.

Reports are split into cold-start, developing, and mature evidence cohorts. Candidate comparisons use paired bootstrap confidence intervals on identical future matches.

### Complexity gates

The simpler player-only static model is preferred unless added complexity proves useful on validation data.

- Recency weighting requires at least 100 validation matches, a paired-bootstrap Log Loss improvement, and Brier/ECE non-regression.
- Champion effects require the same validation evidence plus at least 95% champion-ID coverage across train + validation.
- Failed complexity gates fall back to the simpler already-selected model.

This keeps a feature from entering the MMR formula merely because it sounds plausible.

### Final promotion evidence gate

The current evidence gate is deliberately strict:

- at least 500 accepted real standard-ARAM matches,
- at least 100 validation matches,
- at least 100 untouched final future-test matches,
- candidate Log Loss improvement on the untouched final test with a 95% paired-bootstrap interval fully below zero versus the validation-selected existing baseline,
- Brier no worse than baseline by more than 0.002,
- ECE no worse than baseline by more than 0.01.

If these conditions are not satisfied, the result stays `insufficient_real_data` or `no_clear_winner`. Even `candidate_model` is research evidence only; there is no automatic production promotion.

## Production boundary

This branch does **not** modify `src/rating/universal/estimator.js`, the v0.17.1 updater manifest, the Universal Rating persistent DB owner, AutoSync/history network ownership, or the frozen `aram-rating-research-v03 / checkpoint-v03` checkpoint.

The live v0.17.1 sidecar can continue accumulating normal ARAM evidence. A later integration may feed a validated copy of that evidence into this evaluator, but data accumulation and predictive-model proof remain separate concerns.

## Next real-data step

Run the evaluator on a preserved, deduplicated queue-450 dataset with enough repeated players. Record dataset density and connected-component structure alongside predictive metrics. Do not broaden collection simply to inflate match count if it leaves most players as singletons; repeated observations and graph connectivity are part of rating identifiability.
