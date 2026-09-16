# ARAM Rating v0.3.2 Research

Accuracy-first research branch for ARAM player rating. Production activation remains OFF.

## Current checkpoint path

- B2/B3/B4/B5/B5.1 research stages are manual-only.
- B5.1 legacy collector failure was diagnosed and repaired without destructive migration.
- R8 repaired 15 false HTTP400 completion entries while preserving the 1982-match checkpoint.
- R9 resumed collection safely: 1 request, 20 valid returned, 2 new unique matches, checkpoint 1982 -> 1984.
- R10 expanded the recovery to 3 more anchors: all 3 accepted, 60 valid matches returned in aggregate, **0 new unique matches**, checkpoint remained 1984.
- R9+R10 combined: 4 requests / 80 valid returned / 2 new unique = **2.5% unique-yield ratio**, a strong fixed-queue saturation signal.

## R11 result

The post-R10 read-only evaluation completed on the user PC with:

- classification: `R11_NO_CLEAR_WINNER_BULK_COLLECTION_SATURATED`
- selection status: `no_clear_winner`
- observed leader: Elo
- observed runner-up: Glicko
- dataset: 1984 matches / 10478 players / 1587 train / 397 test
- next step: `TARGETED_INFORMATION_GAIN_COLLECTION_ONLY`

Elo is currently the observed leader, but the full candidate gate has not established a clear research winner. Since the remaining fixed queue is already producing very low marginal unique-match yield, blind queue exhaustion is no longer justified.

## R12

`phase-b51r12-v032-targeted-plan-devtools.js` is a read-only targeted information-gain planner. It requires the exact post-R10 checkpoint and the `no_clear_winner` selection state, performs **zero Riot/LCU requests** and **zero checkpoint writes**, and ranks only the 11 remaining anchors using:

- Elo / Glicko / TrueSkill-family rating disagreement
- current model uncertainty
- low-observation potential
- held-out closed-network evidence
- prior B5.1 evidence-first priority

Only anchor rank and aggregate score components are returned; raw PUUID and identity mapping are not exported. The intended follow-up is to collect the highest-ranked anchor one at a time and re-evaluate after each successful addition.

## Safety

- production activation: OFF
- automatic collection: OFF
- destructive reset/migration: forbidden
- research diagnostics are not shipped in the production manifest
