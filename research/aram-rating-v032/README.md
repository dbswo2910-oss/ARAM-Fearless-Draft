# ARAM Rating v0.3.2 Research

Accuracy-first research branch for ARAM player rating. Production activation remains OFF.

## Current checkpoint path

- B2/B3/B4/B5/B5.1 research stages are manual-only.
- B5.1 legacy collector failure was diagnosed and repaired without destructive migration.
- R8 repaired 15 false HTTP400 completion entries while preserving the 1982-match checkpoint.
- R9 resumed collection safely: 1 request, 20 valid returned, 2 new unique matches, checkpoint 1982 -> 1984.
- R10 expanded the recovery to 3 more anchors: all 3 accepted, 60 valid matches returned in aggregate, **0 new unique matches**, checkpoint remained 1984. This is a strong marginal-yield saturation signal for the current fixed queue.

## R11

`phase-b51r11-v032-evaluate-devtools.js` is the next read-only step. It requires the exact post-R10 state (1984 matches / 4 completed / 11 remaining), performs **zero Riot/LCU requests** and **zero checkpoint writes**, and evaluates:

- Elo / Glicko / TrueSkill-family frozen and walk-forward metrics
- primary metric: log loss
- secondary metrics: Brier, ECE, accuracy
- cold-start exposure
- candidate selection gate / paired bootstrap signal from the pinned reference engine
- current network coverage
- R9+R10 marginal collection efficiency

If the candidate gate passes while marginal yield is saturated, the next technical step is production-shadow validation rather than bulk collection. If no model clears the gate, further collection should be targeted by information gain rather than by blindly exhausting the remaining queue.

## Safety

- production activation: OFF
- automatic collection: OFF
- destructive reset/migration: forbidden
- research diagnostics are not shipped in the production manifest
