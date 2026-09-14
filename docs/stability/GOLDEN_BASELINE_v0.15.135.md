# v0.15.135 GOLDEN BASELINE

This document freezes the verified v0.15.135 behavior as the reference contract for the v0.16.0 clean-baseline program.

## Immutable reference

- Golden branch: `baseline/v0.15.135-golden`
- Golden commit: `2048d56ceec2317b4cef225f284443521005994d`
- Active release at freeze: `0.15.135`
- Manifest message: `v0.15.135 · PATCH NOTES SEMANTIC SHELL SWEEP`
- Stable Electron app identity: `aram-fearless-draft`
- Permanent updater/runtime safety lineage root: `v0.15.79`

The Golden branch is a reference only. Stabilization and canonicalization work must happen on separate branches and must not rewrite the Golden branch.

## Verified real-Windows evidence carried into the baseline

1. Repeated full exit/relaunch does not fall back to an older version after the v0.15.132 storage/cold-start recovery.
2. The existing Research checkpoint is visible again on the stable storage root. The user confirmed the preserved aggregate contained 159 accepted matches at the time of recovery verification.
3. On v0.15.135, DATA > Patch Notes no longer shows the outer generic `챔피언 상세 / 닫기` row while the Patch Notes content remains visible. This is real installed-Windows evidence and supersedes the failed v0.15.133/v0.15.134 attempts.

The 159-match value is real-world acceptance metadata, not a repository copy of personal Research records. Do not commit personal IndexedDB contents to the repository.

## Golden owner map

- RANDOM PICK DOM/state: `runtime-v015100` under the v0.15.115 single-owner contract.
- DATA view/presentation: `ui-stability-v015115`.
- Persistent state: `state-integrity-v015117`.
- Renderer resource lifecycle: `resource-lifecycle-v015118`.
- AutoSync main-process concurrency: `autosync-concurrency-v015119`.
- AutoSync renderer: `runtime-live-autosync-v01571+v015119`.
- Update/runtime safety: v0.15.79 lineage.

## Golden behavioral rule

v0.16.0 is a structural consolidation. Unless a change is explicitly approved as a product/scoring change, identical inputs must preserve the v0.15.135 observable behavior and calculation outputs.

The following are frozen for differential comparison:

- Draft recommendation/judgment outputs.
- RANDOM PICK TOP5 and candidate DNA outputs.
- RANDOM IN GAME coaching/build behavior.
- ROLE / Player Profile calculations.
- Item recommendation behavior.
- Match-history parsing and result selection behavior.
- Riot Grade authoritative-link behavior.
- State/storage identity and Research checkpoint readability.
- DATA / Patch Notes view contracts.

## What this baseline does not claim

Some historical real-world acceptance items remain pending (for example prolonged live AutoSync soak and direct Riot Grade comparison). The clean-baseline project must preserve their current implementation while keeping those acceptance statuses explicit; it must not reinterpret CI as proof of those real-client checks.

## Release gate

Before v0.16.0 can replace this baseline, all canonical subsystems must pass:

1. Golden source/runtime audit.
2. Functional regression suite.
3. Final assembled-runtime audit.
4. State/data compatibility checks.
5. Differential snapshots for scoring/parsing domains.
6. Windows Electron E2E against a complete installed-app fixture.
7. Visual screenshots and repeated-render/soak checks.
8. Final real-Windows RC acceptance.
