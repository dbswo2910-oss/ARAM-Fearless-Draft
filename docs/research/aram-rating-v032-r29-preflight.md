# ARAM Rating v0.3.2 — R29 preflight

This document records the GitHub-side checks that can be completed before the physical R29 run on the user's installed Windows app.

## Current boundary

- Production rating activation remains **OFF**.
- Automatic promotion remains **OFF**.
- R29 without `-Collect` performs no new Riot/LCU history collection.
- The physical R29 run remains required for installed-app evidence because GitHub CI cannot substitute for the user's installed state.

## GitHub-side preflight checklist

- [x] R29 one-shot evidence refresh script exists on the research branch.
- [x] R29 finalizer exists and is covered by CI self-test.
- [x] R29 workflow completes successfully on the current branch.
- [x] R28 final evidence planner workflow completes successfully.
- [x] R27 selection-gate inspector workflow completes successfully.
- [x] R26 shadow evidence inspector workflow completes successfully.
- [x] R19/R20/R21 research safety dry-runs complete successfully.
- [x] Full Regression Audit completes successfully.
- [x] Final Production Cutover and AutoSync Updater Soak complete successfully.
- [ ] Physical R29 installed-state run (must be performed on the user's PC).

## Physical-run output required

`audit-output/r29-one-shot-evidence-refresh/r29-one-shot-evidence-refresh.json`

The next research step must be chosen from that report's classification and blockers. No model should be promoted merely because it is the current point-estimate leader.
