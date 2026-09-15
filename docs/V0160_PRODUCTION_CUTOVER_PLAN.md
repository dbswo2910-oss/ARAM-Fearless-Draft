# v0.16.0 CLEAN BASELINE — Production Cutover Plan

Status: **READY FOR CUTOVER PREPARATION / FINAL RELEASE NOT YET AUTHORIZED**

This plan converts the physically accepted v0.16 RC into a production release in a controlled, reversible sequence. It does not itself mutate `main`, switch `update/manifest.json`, activate canonical owners, or delete Golden runtime files.

## Accepted evidence

- Golden production version: `0.15.135`
- Validated RC head: `7dd0b921170db86d9001c299065fcca4f0d3983d`
- Physical Windows + real League/LCU acceptance: `SUCCESS`
- Physical evidence SHA-256: `34f782275d40ca023ccb88624f04286b8e5b2904ef0c0e76ad9c63153f2fa0ec`
- Stable Chromium userData: `aram-fearless-draft`
- Research IndexedDB / checkpoint: `aram-rating-research-v03` / `checkpoint-v03`
- Research matches: `159 -> 159`
- Research checkpoint digest: `da9f4d570cd56b9f273734ad4c8a0c7c779f5104f0783502c784d503b2be0140`
- Real LCU request: HTTP `200`

The preparation approval is recorded in `release/v0.16.0-cutover-preparation.json`. That approval is intentionally narrower than final production-release authorization.

## Cutover sequence

### Phase 0 — immutable preflight

Before any production mutation:

1. Confirm `update/manifest.json` still reports `0.15.135`.
2. Confirm all 15 canonical owners remain `shadow` and the registry remains `production_active:false`.
3. Confirm the physical-evidence digest above is unchanged.
4. Confirm Golden branch `baseline/v0.15.135-golden` still points to the v0.15.135 release commit.
5. Run canonical exercise, final-runtime parity, state/Research compatibility, behavioral differential, AutoSync/updater/lifecycle soak, Full Regression and AI Continuity at the cutover candidate head.

Any failure aborts the cutover before production files are changed.

### Phase 1 — build a dedicated v0.16 release package

Create a new versioned production package from the canonical `src/` tree. Do not overwrite or rewrite `update/v0.15.135/`.

The v0.16 package must preserve:

- `aram-fearless-draft` userData identity.
- `aram-rating-research-v03` database.
- `checkpoint-v03` checkpoint key.
- updater rollback / probation behavior inherited from the v0.15.79 safety baseline until the canonical updater proves the same contract.
- stable semantic `data-ui-role` UI contracts.
- no automatic Research B2 collection.

The release package must be reproducible from repository sources and must contain only dependencies actually required by the final assembled runtime.

### Phase 2 — activate canonical ownership in the release candidate

On the cutover candidate only:

1. Change the canonical owner registry from shadow to production for the 15 validated owners.
2. Point the v0.16 package bootstrap/preload/runtime entry path at canonical owners.
3. Keep the Golden runtime available as Last Known Good rollback material.
4. Do **not** delete legacy runtime files in the same change that first activates canonical production ownership.

The first production-active candidate must still have an immediate path back to v0.15.135.

### Phase 3 — full post-activation regression

With canonical ownership production-active in the candidate package, rerun all release gates:

- final assembled runtime parity / intentional-difference audit
- Windows Electron E2E
- installed Windows cold start
- installed persistence migration
- state + Research compatibility
- behavioral differential
- screenshot / rerender / semantic UI contracts
- AutoSync + updater + lifecycle soak
- Full Regression
- AI Continuity
- privacy-safe diagnostics

Legacy removal remains blocked if any gate fails.

### Phase 4 — manifest switch

Only after Phase 3 is green **and final production release approval is explicit**:

1. Produce the final `0.16.0` manifest/package metadata.
2. Change `update/manifest.json` from `0.15.135` to `0.16.0`.
3. Merge the reviewed cutover candidate into `main`.
4. Keep v0.15.135 LKG material intact through the probation window.

This is the point at which production changes. No earlier phase is a production release.

### Phase 5 — probation and rollback

After the manifest switch:

- verify first cold start
- verify second cold start
- verify settings/localStorage persistence
- verify Research checkpoint remains 159 and digest remains stable
- verify League/LCU reconnect and AutoSync single-flight behavior
- verify updater heartbeat/probation state
- verify no fatal Electron load/index error

Rollback trigger: any fatal startup, persistence loss, Research mutation, repeated AutoSync failure, or updater probation failure.

Rollback target: frozen Golden v0.15.135 package/manifest lineage.

### Phase 6 — legacy runtime removal

Legacy removal is a separate cleanup after canonical production ownership has passed probation.

Do not remove a legacy file merely because a canonical replacement exists. Remove only dependencies proven absent from the final manifest/runtime dependency map, then rerun every gate once more.

## Approval boundary

Current approval scope: **cutover preparation and validation only**.

Current state:

- cutover plan ready: **YES**
- physical acceptance: **YES**
- final production release approved: **NO**
- `main` mutation authorized: **NO**
- manifest switch authorized: **NO**
- canonical production activation authorized: **NO**
- legacy deletion authorized: **NO**

The next step is a separate explicit final production-release authorization, followed by the dedicated cutover candidate implementation.
