# ARAM Rating v0.3.2 Research

Accuracy-first research branch for ARAM player rating. Production activation remains OFF.

## Current checkpoint path

- B2/B3/B4/B5/B5.1 research stages are manual-only.
- B5.1 legacy collector failure was diagnosed and repaired without destructive migration.
- R8 repaired 15 false HTTP400 completion entries while preserving the 1982-match checkpoint.
- R9 resumed collection safely: 1 request, 20 valid returned, 2 new unique matches, checkpoint 1982 -> 1984.
- R10 expanded the recovery to 3 more anchors: all 3 accepted, 60 valid matches returned in aggregate, **0 new unique matches**, checkpoint remained 1984.
- R9+R10 combined: 4 requests / 80 valid returned / 2 new unique = **2.5% unique-yield ratio**, a strong fixed-queue saturation signal.
- R13 replaced manual one-by-one iteration with bounded targeted collection and completed 3 information-gain-ranked anchors in one guarded run.

## R11 result

The post-R10 read-only evaluation completed on the user PC with:

- classification: `R11_NO_CLEAR_WINNER_BULK_COLLECTION_SATURATED`
- selection status: `no_clear_winner`
- observed leader: Elo
- observed runner-up: Glicko
- dataset: 1984 matches / 10478 players / 1587 train / 397 test
- next step: `TARGETED_INFORMATION_GAIN_COLLECTION_ONLY`

Elo was the observed leader, but the full candidate gate did not establish a clear research winner. Because the fixed queue had already reached very low marginal unique-match yield, blind queue exhaustion was stopped.

## R12-R14 result

R12 ranked the remaining anchors by targeted information gain. R13 then automated rank -> collect -> verify -> re-evaluate for up to 3 anchors with no retries and per-anchor rollback protection.

The final R14 user-PC read-only evaluation completed with:

- classification: `R14_NO_CLEAR_WINNER_TARGETED_SIGNAL_REMAINS`
- selection status: `no_clear_winner`
- observed leader: Elo
- observed runner-up: Glicko
- next step: `BUILD_ELO_GLICKO_DUAL_SHADOW_AND_STOP_BLIND_COLLECTION`

This means Elo remains the strongest observed model, but the research gate still does not justify replacing the production score with a single winner.

## R15 clean dual shadow

`src/research/dual-shadow.js` is the canonical dual-shadow owner under the existing Research subsystem. It is deliberately not a new top-level production owner and is not shipped through the production manifest.

The boundary is:

`Research checkpoint -> rating engine -> Research run -> Elo/Glicko dual shadow snapshot`

The dual shadow:

- observes Elo and Glicko only
- stays in memory only
- performs zero storage writes
- performs zero network/Riot/LCU requests
- performs zero UI writes
- never writes the production rating/score
- does not export raw PUUID or identity mappings
- is wired once into `src/research/owner.js`, not patched into Profile/Results/AutoSync individually

The purpose is to accumulate clean side-by-side evidence behind one interface before any future production-model cutover.

## Safety

- production activation: OFF
- automatic collection: OFF
- destructive reset/migration: forbidden
- Research dual shadow does not replace the production rating
- research diagnostics and dual-shadow source are not shipped in the production manifest
