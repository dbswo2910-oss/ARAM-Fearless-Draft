# v0.16.0 CLEAN BASELINE — Cutover Eligibility

This is the release-safety matrix for the physically accepted v0.16 RC. Production `main` and `update/manifest.json` remain on the v0.15.135 Golden application until the separate final production-release authorization.

## Automated and physical evidence

| Gate | State | Evidence / meaning |
| --- | --- | --- |
| Canonical subsystem ownership | PASS (shadow) | All 15 canonical owners remain `shadow`; `production_active:false`. |
| Differential / full regression | PASS | RC automated checkpoint passed final-runtime parity, state/Research compatibility, behavioral differential, soak, Full Regression and AI Continuity. |
| Installed Windows cold start | PASS | Hosted Windows acceptance reconstructs installed baseline and proves Golden cold start. |
| Installed persistence migration | PASS | Chromium localStorage + Research IndexedDB continuity verified across in-place update and Golden restarts. |
| Physical user Windows PC | PASS | Real user PC acceptance completed successfully. |
| Real League Client / LCU | PASS | Real LCU lockfile/auth flow reached HTTP 200 with privacy-safe evidence. |
| Research continuity | PASS | `aram-rating-research-v03` / `checkpoint-v03` remained 159 -> 159 with unchanged checkpoint digest. |
| Cutover preparation approval | PASS | Approval is recorded for cutover preparation and validation only. |
| Production cutover plan | READY | `docs/V0160_PRODUCTION_CUTOVER_PLAN.md` defines package build, activation, regression, manifest switch, probation/rollback and later legacy cleanup. |

Physical evidence SHA-256:
`34f782275d40ca023ccb88624f04286b8e5b2904ef0c0e76ad9c63153f2fa0ec`

## Preserved compatibility identities

- Chromium `userData`: `aram-fearless-draft`
- Research IndexedDB: `aram-rating-research-v03`
- Research checkpoint key: `checkpoint-v03`
- v0.15.117 state-integrity preload fallback: `%APPDATA%\ARAM Fearless Draft`
- v0.15.79 / v0.15.116 transaction + probation safety remains required through canonical updater probation.

## Current release state

- cutover preparation ready: **YES**
- physical Windows acceptance: **YES**
- real League/LCU acceptance: **YES**
- final production release approved: **NO**
- `update/manifest.json` switched to v0.16.0: **NO**
- canonical production activation: **NO**
- legacy runtime removal eligible: **NO**

Legacy runtime remains the Last Known Good rollback path until the production-active canonical candidate passes the complete post-activation gate suite and probation.

## Remaining gates

1. Separate explicit final production-release authorization.
2. Build/activate the production-active v0.16 candidate without deleting Golden LKG files.
3. Rerun the complete release gate suite on that production-active candidate.
4. Switch the manifest only after all gates are green.
5. Complete probation before any legacy runtime removal.
