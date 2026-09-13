# v0.15.120 — DATA Patch Notes submenu restore

## What changed

- Restores the DATA top-level second navigation (`챔피언 티어리스트 | 패치노트`) as a full-workspace submenu instead of nesting it in the champion-detail/right column.
- Fixes the v0.15.115 DATA host discovery regression by resolving the tier browser and `#dataCard` from a shared ancestor scoped strictly inside `#data`.
- When Patch Notes is active, the role-tier browser branch is hidden and the Patch Notes/detail branch owns the full DATA workspace.
- Keeps the v0.15.99 Patch Notes content and v0.15.110 portrait density while preserving the v0.15.115 single-owner architecture.

## Explicitly unchanged

- RANDOM Practice layout, recommendation/scoring, and candidate selection logic.
- Riot grade collection/calibration.
- Match history/result synchronization and AutoSync behavior.
- Persistent-state and lifecycle owners.

## Validation boundary

Repository audits validate ownership, source wiring, submenu host placement contracts, and regressions. Final Electron visual acceptance still requires a post-update Windows screenshot because the installed base UI is not stored in this repository.
