# CURRENT STATE — ARAM Fearless Draft

> **Cold-start handoff file.** Read this after `AGENTS.md` before changing code. It is generated from `update/manifest.json` + `docs/continuity-manual.json` by `tools/sync-current-state.js`. Do not hand-edit generated facts.

## Active distribution

- Active updater: **v0.15.119**
- Manifest message: v0.15.119 · AUTOSYNC CONCURRENCY — single-flight core, stale-response guard, reconnect backoff
- Manifest commit: `ee4fe8d947633c6e002cf75e5f3b63efe8213e65`
- Package: `update/v0.15.119/package.json` → **v0.15.119**
- Electron entry: `main-v015119.js` → `update/v0.15.119/main-v015119.js`
- Current runtime stability source: `update/v0.15.119/runtime-source-stability-v015119.js`

## Active ownership — do not create competing owners

- RANDOM PICK DOM/state owner: **runtime-v015100** (v0.15.115 single-owner baseline)
- DATA view owner: **ui-stability-v015115** → `update/v0.15.115/ui-stability-baseline-v015115.js`
- Persistent-state owner: **state-integrity-v015117** → `update/v0.15.117/state-integrity-v015117.js`
- Resource lifecycle owner: **resource-lifecycle-v015118** → `update/v0.15.118/resource-lifecycle-v015118.js`
- AutoSync main owner: **autosync-concurrency-v015119** → `update/v0.15.119/autosync-concurrency-v015119.js`
- AutoSync renderer owner: **runtime-live-autosync-v01571+v015119** → `update/v0.15.72/runtime-live-autosync-v01571.js`
- Permanent update/runtime safety root: **v0.15.79**

## Non-negotiable continuity rules

1. Repository state wins over conversational memory. Never reconstruct the current architecture from an old chat summary alone.
2. Do not revive the v0.15.103–v0.15.114 late RANDOM/DATA overlay stack. Extend the active owner or atomically replace it.
3. CI success proves code/regression contracts, **not** final Electron appearance. If real-Windows evidence is pending, say so.
4. Do not call a visual issue fixed until the user has supplied/confirmed the relevant real-Windows screenshot/video when the change is visual/runtime-sensitive.
5. Accuracy over speed: inspect active source, owner lineage, manifest, and relevant historical regression before patching.
6. Future v0.15.120+ activation workflows must run `node tools/sync-current-state.js` after mutating the manifest and before committing the release metadata.

## Real-world validation still open

- **random_pick_after_v015115_single_owner_reset** — `pending`: No post-v0.15.115 real-Windows screenshot/video has yet been recorded as the final visual acceptance baseline.
- **autosync_v015119_real_league_soak** — `pending`: Code-level async race simulations and CI pass, but a prolonged real League Client/LCU/Live Client session has not been recorded as completed acceptance evidence.
- **installed_app_snapshot** — `known_stale_baseline`: Latest preserved real installed-app baseline is v0.15.49 while the active updater is newer.

## Next planned work

- Version: **0.15.120**
- Theme: **SAFE MODE / CRASH-LOOP ISOLATION**
- Status: `planned`
- Intent: If a module repeatedly breaks startup or runtime readiness, isolate the failing optional subsystem and boot a minimal usable app instead of making the entire application unavailable.

## Retired UI overlays — regression guard

- `ui-layout-restore-v015103.js` — active=false, delete=true
- `random-data-ui-hotfix-v015105.js` — active=false, delete=true
- `random-data-ui-hotfix-v015106.js` — active=false, delete=true
- `view-boundary-repair-v015107.js` — active=false, delete=true
- `data-random-hardfix-v015108.js` — active=false, delete=true
- `ui-screenshot-polish-v015109.js` — active=false, delete=true
- `patch-notes-density-v015110.js` — active=false, delete=true
- `random-dna-rail-v015111.js` — active=false, delete=true
- `random-workspace-stability-v015112.js` — active=false, delete=true
- `random-workspace-readable-v015113.js` — active=false, delete=true
- `random-pick-integrity-v015114.js` — active=false, delete=true

## New-chat restore sequence

Before editing anything, read in this order:

1. `AGENTS.md`
2. `docs/CURRENT_STATE.md`
3. `update/current-state.json`
4. `update/manifest.json`
5. `docs/KNOWN_ISSUES.md`
6. `docs/AI_HANDOFF.md`
7. `latest main commit + latest merged PR + relevant GitHub Actions results`

Then state, in a short pre-work checkpoint: active version, active owners, unresolved real-Windows checks, planned next work, and whether the requested change touches scoring/UI/state/AutoSync. If any of those facts conflict, stop and resolve the repository evidence before editing.
