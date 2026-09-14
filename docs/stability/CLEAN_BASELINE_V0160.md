# v0.16.0 CLEAN BASELINE — execution plan

Tracking issue: #83

This is the ordered stabilization/canonicalization program. Do not skip forward into `src/` migration before the safety gates in steps 1–11 are materially in place.

## Phase A — freeze and map

1. **Freeze v0.15.135 Golden Baseline.** Preserve the exact release commit/branch and record real-Windows evidence without copying personal local data.
2. **Repository Inventory + Runtime Dependency Map.** Classify JS/JSON/workflow/updater/runtime files as active distribution, active dependency, fallback/safety, migration, historical, or unreferenced/dead candidate. Build a machine-readable dependency graph and owner map.
3. **CI cleanup.** Separate current functional-domain gates from historical/version-pinned audits. Historical release workflows must not auto-activate or mutate current distribution.

## Phase B — safety before refactor

4. **UI Contract Hardening.** Define stable semantic roles for critical UI. During canonical migration, every critical role becomes a permanent `data-ui-role` contract rather than a topology guess.
5. **Final assembled-runtime test.** Test the bytes assembled from the active manifest after the complete runtime patch chain, not only source fragments.
6. **Windows Electron E2E.** Execute the actual Chromium/Electron DOM on Windows. A complete installed-app fixture is required for production-equivalent E2E; synthetic fixture E2E must be labeled as synthetic.
7. **Screenshot / visual regression.** Capture golden screens as artifacts for RANDOM PICK, IN GAME, DATA tier list, Patch Notes, Player Profile, and Results.
8. **Re-render / soak regression.** Repeated view transitions must not create duplicate DOM, listeners, observers, timers, request storms, memory growth, or progressive slowdown.
9. **In-app DIAG.** Provide privacy-safe runtime diagnostics and JSON export so real-Windows failures can be investigated without DevTools copy/paste.
10. **State/Data compatibility.** Preserve stable app identity, LocalStorage/IndexedDB/state files/history/Research checkpoint behavior. No silent reset. Any schema change needs an explicit migration.
11. **v0.15.135 differential snapshots.** Capture deterministic outputs for Draft, RANDOM TOP5/DNA, power timing, item recommendations, Profile/ROLE, history parsing and Riot Grade linking.

## Phase C — canonicalization

12. Create the canonical `src/` tree only after Phase B gates exist.
13. Migrate bottom-up: main/bootstrap → preload/IPC → state/persistence → resource lifecycle → updater → AutoSync → shared Riot/data → Draft → RANDOM → DATA → Item → Profile/Results → Research.
14. Absorb hotfix **intent**, not historical patch files. New canonical code expresses the final invariant directly.
15. Use subsystem shadow/differential comparison before switching ownership.
16. Remove legacy runtime chains from production only after the corresponding canonical owner passes all gates.
17. Minimize the manifest/package and make the build reproducible.

## Phase D — promotion

18. Publish a v0.16.0 RC and run full regression, Windows E2E, screenshots, soak, persistence migration, updater cold-start, AutoSync soak and differential checks.
19. Promote v0.16.0 CLEAN BASELINE only after real-Windows RC acceptance.
20. Enforce permanent development rules in AGENTS/CI.

## Permanent rules to enforce

- One canonical owner per subsystem.
- No patch-of-patch as normal development.
- No runtime string replacement as normal feature development after v0.16.0.
- Stable semantic UI roles for critical controls/containers.
- Emergency overlay/hotfix is temporary and must be absorbed by the canonical owner in the next normal release.
- No release when required Windows E2E/compatibility gates fail.
- No storage identity/schema change without an explicit migration and preservation test.
- No scoring drift during structural work unless separately approved and documented.
- Historical release directories/tags remain in Git; removal from the active manifest is not history deletion.

## Current blocker that must remain explicit

The repository currently preserves only fragments of the historical installed application, not a complete current installed-app fixture (notably the giant renderer/base HTML is not present in the active manifest). Therefore a truly production-equivalent Windows Electron E2E cannot be honestly declared complete until a complete installed-app fixture is preserved. Synthetic Electron/DOM gates can still be built now, but must not be mislabeled as real installed-app acceptance.
