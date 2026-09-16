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
- R14 confirmed Elo remains the observed leader but the model-selection gate remains `no_clear_winner` on the 2020-match checkpoint.
- R15 added the isolated Elo/Glicko dual shadow.
- R16 added a manual-review-only promotion gate.
- R17 added a passive installed-shadow RC core with a separate privacy-safe local evidence store.
- R18 builds a temporary-copy-only installed RC overlay kit without changing the production install or manifest.
- R19 adds a guarded Windows physical-acceptance harness. Windows CI dry run #1 (`35068242078`) completed SUCCESS; real user-PC execution remains the final physical gate.

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
- checkpoint: 2020 matches / 15 selected / 7 completed / 8 remaining
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

## R16 promotion gate

`src/research/shadow-promotion-gate.js` prevents the shadow from becoming a production decision just because one evaluation favors a model.

Before a model can even become **eligible for manual production review**, the gate requires:

- at least 3 distinct dual-shadow dataset snapshots
- at least 100 matches of dataset growth between the first and latest snapshot
- the latest research selection gate to be `candidate_winner`
- the same observed leader across all qualifying snapshots
- a positive leader advantage in both frozen and walk-forward log loss

Even after every condition passes, R16 returns only `eligible_for_manual_promotion_review`; it never authorizes or performs production activation automatically. The current R14 `no_clear_winner` evidence is explicitly classified as `hold_shadow`.

## R17 passive installed shadow RC core

`src/research/installed-shadow-rc.js` is the bounded normal-use observation core. It does not add a polling loop or a second Riot/LCU collector.

For one explicit RC run it:

1. reads `aram-rating-research-v03 / checkpoint-v03` read-only,
2. optionally performs at most one bounded call through the already-existing `window.aramDesktop.getAramMatchHistory` bridge,
3. pseudonymizes new match/player identities before persistence,
4. stores only privacy-safe delta evidence in the separate `aram-rating-shadow-evidence-v1` database,
5. evaluates the canonical checkpoint plus the persisted delta through the existing rating engine,
6. records a sanitized Elo/Glicko shadow snapshot, and
7. runs the R16 promotion gate.

The separate evidence store is capped, local-only, does not persist raw PUUIDs or raw match IDs, cannot write the canonical Research checkpoint, and cannot write the production score or UI.

Synthetic R17 regression covers repeated-run deduplication, later-match accumulation, missing-bridge degradation, raw-identity rejection, one-request-per-run bounds, and unchanged production manifest behavior.

## R18 temporary-copy installed RC kit

R18 packages the R17 modules into a renderer bundle plus a tiny alternate main shim for **temporary-copy-only** testing.

The kit deliberately:

- does not contain or replace `package.json`
- is not shipped by `update/manifest.json`
- does not patch `main-v0160.js`
- delegates to the exact production `main-v0160.js` after registering the temporary shadow injection hook
- injects the shadow only after renderer load
- runs the R17 core once, not on a recurring timer
- can emit a machine-readable, privacy-safe physical-test result

The intended physical path is `installed v0.16.0 -> temporary app copy -> R18 overlay -> stable userData`, so the installed production tree remains untouched.

R18 build/audit passed in the Research workflow before the physical harness was exposed.

## R19 guarded Windows physical gate

`tools/research/aram-rating-v032-r19-physical-shadow-rc.ps1` is the real-PC acceptance harness. Before asking for a user-PC run it is parsed and exercised in `ARAM Rating R19 Windows Dry Run` on `windows-latest`.

The harness:

- auto-detects the installed v0.16.0 app and Electron runtime when possible
- hashes key production files before and after the test
- creates a temporary copy of the installed app
- overlays only the R18 shadow RC kit into that temporary copy
- changes `package.main` only inside the temporary copy
- uses the existing stable `aram-fearless-draft` userData so it can see the real Research checkpoint and local match history
- reads the canonical Research checkpoint before and after and requires its digest/count to remain unchanged
- requires exactly one successful bounded match-history request with at least one valid ARAM match
- requires production score/UI/canonical-checkpoint writes and production activation to remain false
- requires privacy-safe output with no raw identity export
- removes the temporary app copy after the run

Windows dry run #1 / `35068242078` completed SUCCESS: R18 kit build, R18 kit audit, PowerShell parse/dry-run, dry-run contract verification, and safety-artifact upload all passed. This proves the harness syntax and safety contract on a Windows GitHub runner. It does **not** substitute for the one remaining physical user-PC + real League/LCU acceptance run.

## Safety

- production activation: OFF
- automatic collection: OFF
- blind bulk collection: OFF
- recurring shadow polling: OFF
- automatic promotion: OFF
- destructive reset/migration: forbidden
- canonical Research checkpoint writes from R17-R19: forbidden
- production score/UI writes from R17-R19: forbidden
- raw PUUID/raw match-ID persistence in the shadow evidence DB: forbidden
- Research dual shadow does not replace the production rating
- R16 requires separate manual release approval even after evidence matures
- R17/R18/R19 sources are not shipped through the production manifest
- real user-PC physical acceptance is required before considering the installed shadow RC physically validated
