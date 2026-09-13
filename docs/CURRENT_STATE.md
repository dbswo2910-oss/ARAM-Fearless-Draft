# CURRENT STATE — ARAM Fearless Draft

> **Cold-start handoff file.** Read this immediately after `AGENTS.md` before changing code. The factual section is derived from `update/manifest.json` and `docs/continuity-manual.json` by `tools/sync-current-state.js`.

## Active distribution

- Active updater: **v0.15.119**
- Manifest message: `v0.15.119 · AUTOSYNC CONCURRENCY — single-flight core, stale-response guard, reconnect backoff`
- Manifest commit: `ee4fe8d947633c6e002cf75e5f3b63efe8213e65`
- Package: `update/v0.15.119/package.json` → **v0.15.119**
- Electron entry: `main-v015119.js` → `update/v0.15.119/main-v015119.js`
- Current runtime stability source: `update/v0.15.119/runtime-source-stability-v015119.js`

## Active ownership — do not create competing owners

- RANDOM PICK DOM/state owner: **runtime-v015100** under the **v0.15.115 single-owner baseline**.
- DATA view owner: **ui-stability-v015115** → `update/v0.15.115/ui-stability-baseline-v015115.js`.
- Persistent-state owner: **state-integrity-v015117** → `update/v0.15.117/state-integrity-v015117.js`.
- Resource lifecycle owner: **resource-lifecycle-v015118** → `update/v0.15.118/resource-lifecycle-v015118.js`.
- AutoSync main owner: **autosync-concurrency-v015119** → `update/v0.15.119/autosync-concurrency-v015119.js`.
- AutoSync renderer owner: **runtime-live-autosync-v01571+v015119** → `update/v0.15.72/runtime-live-autosync-v01571.js` transformed by the active v0.15.119 runtime source.
- Permanent update/runtime safety root: **v0.15.79**.

## Non-negotiable continuity rules

1. **Repository state wins over conversational memory.** Never reconstruct the current architecture from an old chat summary alone.
2. Do not revive the v0.15.103–v0.15.114 late RANDOM/DATA overlay stack. Extend the active owner or atomically replace it.
3. CI success proves code/regression contracts, **not** final Electron appearance.
4. Do not call a visual/runtime issue fully fixed while real-Windows evidence is still pending.
5. Accuracy over speed: inspect active source, owner lineage, manifest, known issues, and the relevant regression before patching.
6. Future **v0.15.120+** activation workflows must run `node tools/sync-current-state.js` after mutating the manifest and before committing release metadata.

## Real-world validation still open

- **Random Practice after v0.15.115 single-owner reset — `pending`.** No final real-Windows screenshot/video has yet been recorded proving all of: PICK/IN GAME isolation, unclipped grades, non-duplicated champion names, candidate-specific DNA/AD-AP changes, and no click-time DNA/detail reparent jump.
- **v0.15.119 AutoSync real-League soak — `pending`.** Code-level race simulations and CI pass, but prolonged real League/LCU/Live Client use still needs user-side confirmation.
- **Installed-app baseline — `known_stale_baseline`.** The preserved real installed snapshot is v0.15.49; it is historical and must not be mistaken for the active updater runtime.

## Next planned app work

- Version: **v0.15.120**
- Theme: **SAFE MODE / CRASH-LOOP ISOLATION**
- Status: `planned`
- Goal: if an optional module repeatedly breaks startup/runtime readiness, isolate the failing subsystem and boot a minimal usable app instead of making the entire application unavailable.
- Preserve v0.15.115 UI ownership, v0.15.116 rollback, v0.15.117 state integrity, v0.15.118 lifecycle disposal, v0.15.119 AutoSync concurrency, and current scoring unless explicitly requested.

## Retired UI overlays — never reactivate as independent owners

`ui-layout-restore-v015103.js`, `random-data-ui-hotfix-v015105.js`, `random-data-ui-hotfix-v015106.js`, `view-boundary-repair-v015107.js`, `data-random-hardfix-v015108.js`, `ui-screenshot-polish-v015109.js`, `patch-notes-density-v015110.js`, `random-dna-rail-v015111.js`, `random-workspace-stability-v015112.js`, `random-workspace-readable-v015113.js`, `random-pick-integrity-v015114.js`.

They remain historical source, but the active manifest schedules those installed overlay files for deletion. Do not solve a new UI issue by reintroducing the same multi-owner pattern.

## New-chat restore sequence

Before editing anything, read in this order:

1. `AGENTS.md`
2. `docs/CURRENT_STATE.md`
3. `update/current-state.json`
4. `update/manifest.json`
5. `docs/KNOWN_ISSUES.md`
6. `docs/AI_HANDOFF.md`
7. latest `main` commit, latest merged PR, and relevant GitHub Actions results

Then give a short **pre-work checkpoint** containing: active version, active owners, unresolved real-Windows checks, planned next work, and whether the requested change touches scoring/UI/state/AutoSync. If repository evidence conflicts, resolve the conflict before editing.
