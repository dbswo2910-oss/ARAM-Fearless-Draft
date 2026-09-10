# AI handoff addendum — v0.15.75

## Why this release exists

v0.15.74 added a main-process watchdog and a user freeze capture finally produced direct evidence. The renderer repeatedly stopped answering bounded probes while the process remained alive. There was no `render-process-gone` event. Captured stalls clustered around live `IN GAME` detection / Random in-game mode entry.

The verified installed base UI revealed a transition ownership bug: `lolAutoSyncApplyState()` used the same post-apply pipeline for both champion select and live in-game state. For `plan.kind === 'in_game'`, it synchronously performed `persist()`, `renderRandomInputs()`, and `runRandomCombos()`. That is a pick-practice pipeline and can cascade into Random analysis/detail rendering even though champion selection is already finished. The live poll also had an additional legacy `renderRandomDetails()` path while v0.15.70 already owns live Random in-game rendering.

## v0.15.75 ownership rule

Once AutoSync resolves `plan.kind === 'in_game'`:

1. copy the resolved live team/enemy state as before;
2. cancel any pending v0.15.72 cooperative TOP5 enumeration;
3. do **not** synchronously call `renderRandomInputs()`, `runRandomCombos()`, `renderRandomAnalysis()`, or legacy `renderRandomDetails()`;
4. defer persistence outside the critical transition stack;
5. queue `aramRandomIngameRuntimeV01570.refresh()` asynchronously and let the v0.15.70 owner decide whether a semantic coach rebuild is needed.

The normal champion-select / Random Practice pick path retains its historical render and TOP5 behavior. This release is transition isolation, not a scoring change.

## Installed-base patching

`update/v0.15.75/ingame-transition-patch-v01575.js` contains four exact, idempotent source contracts. `main-v01575.js` applies them to the real installed `index.html` before the UI loads. It backs up the original once as `index.pre-v01575-ingame-transition.bak.html`.

If an exact source contract is neither the known old form nor the known already-patched form, startup throws instead of silently applying a partial transition patch. This is intentional: repository sources do not contain the full installed 35 MB renderer, so a silently partial mutation would be less safe than a visible failure.

The four contracts isolate:
- AutoSync `in_game` state application from the pick-practice pipeline;
- the live-change detail refresh from legacy `renderRandomDetails()`;
- Random in-game mode entry from legacy detail rendering;
- Random tab entry from pick analysis while in in-game mode.

## Durable stage codes

v0.15.75 upgrades the watchdog so critical transition stages are sent through preload IPC to the Electron main process and appended immediately to `freeze-stage-v01575.log`. This survives a renderer stall better than querying the renderer after it is already frozen.

Stage codes:
- `IG110` — `AUTOSYNC_APPLY_INGAME_START`
- `IG119` — `AUTOSYNC_APPLY_INGAME_END`
- `IG120` — `INGAME_OWNER_REFRESH_START`
- `IG121` — `INGAME_OWNER_REFRESH_END`
- `IG130` — `LIVE_DETAIL_OWNER_REFRESH_QUEUED`
- `IG200` — `INGAME_MODE_CLICK_QUEUED`

Interpretation examples:
- IG110 with no IG119: stall is inside the synchronous in-game apply branch before it returns.
- IG119 but no IG120: queued owner refresh did not start, so inspect event-loop starvation between tasks.
- IG120 with no IG121: focus next investigation inside v0.15.70 owner/coach refresh and its post-render consumers.
- IG120 + IG121 followed by a watchdog timeout: transition finished; inspect subsequent recurring owner/AutoSync work rather than the initial transition.

The normal heartbeat log is `freeze-watchdog-v01575.log` and remains bounded; the stage log is intentionally separate and append-only.

## Validation performed before repository release

A local Chromium harness used the verified installed base `index.html` plus the current v0.15.74 runtime overlay. It injected a 10-player ARAM live state and exercised the same boundary seen in the freeze capture.

Results after applying the v0.15.75 patch:
- first live `in_game` application added 0 `runRandomCombos()` calls;
- added 0 `renderRandomAnalysis()` calls;
- added 0 legacy `renderRandomDetails()` calls;
- expected IG110/IG119/IG130/IG120/IG121 transition trace appeared;
- 30 rapid Random pick ↔ in-game mode transitions completed;
- v0.15.70 remained the live in-game render owner.

Keep the dedicated `tools/runtime-stability-v01575-audit.js` in Full Regression Audit. It checks idempotent installed-base patching, transition ownership, stage-code wiring, current preload/watchdog delivery, and score neutrality.

## Preserved work

v0.15.75 keeps:
- v0.15.74 remaining item-catalog retry guards;
- v0.15.73 v56 catalog retry fix;
- v0.15.72 Random Practice single-owner/cooperative TOP5 work;
- v0.15.71 AutoSync single-flight/throttling;
- v0.15.70 Random In-game single-owner runtime.

`score_logic_changed:false` — recommendation, ban, team-score, threat, item judgment, and purchase formulas are unchanged.
