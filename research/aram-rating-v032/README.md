# ARAM Rating v0.3.2 — Accuracy-First Research Foundation

This branch starts from the v0.16.0 CLEAN BASELINE. It is Research-only: it does not change the production manifest, does not automatically collect matches, and does not replace the production rating model.

## Immutable continuity
- IndexedDB: `aram-rating-research-v03`
- checkpoint: `checkpoint-v03`
- canonical identity: PUUID
- the Research checkpoint is extended in place; no destructive reset is allowed.

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
- `b2-manual-core.js`: B2 manual sampling/accounting core
- `b3-manual-core.js`: B3 density-first candidate ranking for the 500→1000 phase

## Completed research checkpoints
- B1 reference: 159 matches.
- B2 manual accuracy-first expansion reached the hard cap at 500 matches without resetting the existing checkpoint.
- B2 500-match evaluation currently reports `no_clear_winner`; TrueSkill-family is observed leader but is not promoted.

## B3 — density-first 500→1000
B3 is intentionally split into preview and execution stages. The current stage is **preview-only**:
- requires an existing 500+ match checkpoint;
- prioritizes already-observed 2+ players, repeat-network overlap, 5+/10+ threshold progress, and single-neighbor recovery;
- applies a stronger new-player explosion penalty;
- proposes at most 50 candidates toward a 1000-match target;
- performs **zero Riot/LCU collection requests** and **zero checkpoint writes**.

Preview files:
- `b3-manual-core.js`
- `phase-b3-v032-preview-devtools.js`

The actual B3 live runner is not enabled by this stage. It must be separately reviewed/approved after preview output is inspected.

## Still not enabled
No automatic background sync, no mass crawler, no champion/patch correction activation, and no production model promotion.
