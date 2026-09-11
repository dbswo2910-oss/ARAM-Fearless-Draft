# AI handoff addendum — v0.15.78 user-state freeze fix + dual heartbeat

## Why this release exists
The user's real v0.15.77 BLACKBOX archive finally produced a concrete renderer exception immediately before the reported freeze. The exact call chain was:

`lolAutoSyncPoll -> aramTrackLinkedGame -> activateOwner -> applyUserState -> renderAll`

`renderAll()` then threw at the installed base UI because `#champCount` was no longer present while the legacy function still unconditionally assigned `.textContent` to it. The function also synchronously ran broad UI work including Random Practice rendering/TOP5 before reaching that failure.

## v0.15.78 changes
1. `runtime-source-stability-v01578.js` extends the v0.15.77 source hardening and patches `multi-user-isolation-v01516.js` at injection time.
2. `applyUserState()` no longer calls the monolithic `renderAll()` function. It loads owner-scoped state, clears history runtime state, then runs guarded UI stages `USR-R01` through `USR-R09` over separate macrotasks.
3. `aramTrackLinkedGame()` no longer performs first owner activation synchronously inside the AutoSync poll call stack. It emits `USR-110` and defers `activateOwner()` with `setTimeout(..., 0)`; the first linked-game write can occur on a subsequent poll.
4. Owner-sync compatibility polling is reduced from 320 ms to 1500 ms.
5. `safe-index-patch-v01578.js` makes the historical `renderAll()` legacy count elements null-safe so unrelated callers cannot hit the same removed-DOM exception.
6. Existing recommendation, ban, team score, item, threat, and purchase logic is untouched.

## Why the watchdog architecture changes again
The v0.15.77 archive contained no `FRZ-001/FRZ-003` entry even though the user reported a freeze. The most useful recorded event was the `JS-E002` owner-state exception. A watchdog that shares the Electron main event loop cannot prove whether the main process itself has stalled.

v0.15.78 therefore adds independent heartbeats:
- `preload.js` writes `heartbeat-renderer-v01578.json` directly from the renderer process every 500 ms without main-process IPC.
- `hang-heartbeat-v01578.js` writes `heartbeat-main-v01578.json` from the Electron main process every 500 ms.
- it spawns `external-watchdog-v01578.js` as a detached Electron-as-Node process using `ELECTRON_RUN_AS_NODE=1`.
- the external process waits through an 8 s startup grace period, then treats >2600 ms heartbeat age as stalled.

Codes:
- `HNG-M001`: main heartbeat stalled, renderer heartbeat still fresh.
- `HNG-R001`: renderer heartbeat stalled, main heartbeat still fresh.
- `HNG-B001`: both heartbeats stalled.
- `HNG-OK`: recovered/healthy classification.
- `HNG-S001`: external watchdog spawn failure.

The v0.15.77 CDP BLACKBOX remains installed and should still be checked first when `FRZ-003` exists. If there is no FRZ stack, inspect `external-hang-v01578.log` next.

## Regression contract
`tools/runtime-stability-v01578-audit.js` must continue to verify:
- exact v0.15.78 package/manifest wiring;
- user-state source patch idempotence;
- no `renderAll()` call in owner restore;
- owner activation deferral;
- 1500 ms owner sync cadence;
- `USR-E001/E002/E003/USR-SLOW` instrumentation;
- VM owner activation with `renderAll=0` and `runRandomCombos=0`;
- null-safe base renderAll patch;
- direct renderer heartbeat + independent main heartbeat + external `HNG-*` classifier;
- score neutrality.

Do not return to speculative single-subsystem freeze fixes. If v0.15.78 still freezes, collect both BLACKBOX and `external-hang-v01578.log`, classify which event loop stopped, and fix only the evidenced path.

`score_logic_changed:false`
