# ARAM Rating v0.3.2 — Accuracy-First Research Foundation

This branch starts from the v0.16.0 CLEAN BASELINE. It is Research-only: it does not change the production manifest, does not start live/B2 collection, and does not replace the production rating model.

## Immutable continuity
- IndexedDB: `aram-rating-research-v03`
- checkpoint: `checkpoint-v03`
- canonical identity: PUUID
- existing 159-match Research checkpoint is preserved; no destructive reset is allowed.

## Accuracy objective
Primary model metric is future-match Log Loss. Brier score, calibration/ECE, accuracy, uncertainty, density and network connectivity are secondary diagnostics. A score is never shown for a zero-observation player.

## v0.3.2 modules
- `accuracy-first-contract.js`: scientific/safety contract and winner gate
- `target-analysis-core.js`: arbitrary resolved-PUUID target state machine
- `adaptive-sampling.js`: target-centric information-value ranking; no network calls
- `global-network-metrics.js`: connected-components/density metrics
- `confidence-framework.js`: uncertainty and user-facing confidence separation
- `temporal-evaluator.js`: leakage-free frozen/walk-forward evaluation helpers
- `b2-compatibility.js`: v0.3.1 continuity adapter
- `baseline-reference.js`: aggregate B1 reference only

## Non-goals of this commit
No real B2 Top-25 execution, no mass arbitrary-player crawling, no automatic background sync, no champion/patch correction activation, and no production model promotion.
