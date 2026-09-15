# v0.16 canonical source tree

This directory is the target canonical architecture for the v0.16.0 CLEAN BASELINE migration.

## Rules

- v0.15.135 remains the production Golden Baseline until the v0.16 RC passes all gates.
- No file under `src/` is allowed to silently replace a production owner before its subsystem migration and differential tests pass.
- One subsystem has one canonical owner. Emergency overlays are temporary and must be absorbed into that owner before the next normal release.
- Runtime string replacement is not an accepted long-term implementation technique in this tree.
- Storage identities (`aram-fearless-draft`, `aram-rating-research-v03`, `checkpoint-v03`) must not change without an explicit migration.
- Critical renderer nodes use stable `data-ui-role` contracts.
- Production release requires final-runtime audit + Windows Electron E2E + persistence checks + differential checks.

## Target layout

- `main/` — Electron bootstrap/window lifecycle
- `preload/` — context bridge and IPC surface
- `core/` — shared lifecycle, contracts and owner registry
- `state/` — persistence and migration
- `updater/` — update/LKG/cold-start safety
- `autosync/` — League live sync/concurrency
- `riot/` — Riot/API/data services
- `draft/` — draft evaluation and UI orchestration
- `random/pick/` — RANDOM PICK
- `random/ingame/` — RANDOM IN GAME
- `data/` — champion data and Patch Notes
- `items/` — item catalog/recommendation
- `profile/` — match history, player profile and results
- `research/` — local read-only Rating research integration
- `diagnostics/` — privacy-safe diagnostics

The migration order is foundation-first: main → preload → state → lifecycle → updater → AutoSync → Riot/data services → Draft → RANDOM → DATA → Items → Profile/Results → Research.
