# v0.16.0 CLEAN BASELINE — Cutover Eligibility

This document is a release-safety matrix, not a production activation request. `main` stays on the v0.15.135 Golden application code until explicit approval.

## Automated evidence

| Gate | State | Evidence / meaning |
| --- | --- | --- |
| Canonical subsystem ownership | PASS (shadow) | All registered canonical owners are `shadow`; `production_active:false`. |
| Differential / full regression | PASS at prior green checkpoints | Existing Stability Foundation, Full Regression and AI Continuity gates remain mandatory after every release-candidate change. |
| Installed Windows cold start | PASS | Reconstructed real v0.15.49 installed baseline → materialized Golden v0.15.135 → pinned Electron cold start. |
| Installed persistence migration | PASS | `v0.16.0 Installed Persistence Acceptance` #5 at `d87f429333da47df78ed5cd8e81b31ef53764031`: real Chromium localStorage + Research IndexedDB `aram-rating-research-v03` / `checkpoint-v03` with 159 synthetic matches survived the in-place update and two Golden restarts; state-integrity mirror was also verified at the actual Golden preload fallback root. |
| AutoSync / updater / lifecycle deterministic soak | PENDING CURRENT BRANCH CI | `tools/stability/autosync-updater-lifecycle-soak-audit.js` performs repeated single-flight/cache/reset, transaction/rollback/probation and idempotent resource-disposal cycles with zero network or Research collection. |
| Cutover dependency enumeration | READY | `tools/stability/cutover-readiness-audit.js` enumerates every Golden manifest source plus preserved fallback/storage dependencies into `cutover-readiness-report.json`. |

## Preserved compatibility identities

- Chromium `userData`: `aram-fearless-draft`
- Research IndexedDB: `aram-rating-research-v03`
- Research checkpoint key: `checkpoint-v03`
- v0.15.117 state-integrity preload fallback: `%APPDATA%\ARAM Fearless Draft` (legacy behavior; do not silently rewrite during refactor)
- v0.15.79 / v0.15.116 transaction + probation safety remains required until canonical updater cutover is proven.

## Why legacy runtime is not deleted yet

The canonical code is intentionally shadow-only. Removing the active Golden runtime before real-client acceptance would turn a safe refactor into a production cutover without evidence. Therefore the generated readiness report currently sets `legacy_runtime_removal_eligible:false` and `production_cutover_eligible:false`.

The remaining external/manual blockers are:

1. Physical Windows smoke test on the user machine.
2. Real League Client / LCU AutoSync timing, credentials, reconnect and queue behavior.
3. Real DPI/font/rendering smoke test.
4. Explicit approval to make the canonical runtime production-active.

After the deterministic soak and all standard CI gates are green at one checkpoint, the branch is eligible to become an **RC candidate for manual acceptance**, not yet an automatic production release.
