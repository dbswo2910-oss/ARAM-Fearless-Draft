# AI Handoff Addendum — v0.15.74

## Why this release exists

v0.15.73 fixed one reproduced unbounded Promise retry in `random-item-icons-v01556.js`, but the user could still hard-freeze the renderer under stress.

A full search of current item-catalog consumers found another active unconditional retry in `random-ingame-shop-v01553.js`: when the item catalog was unavailable, `sync()` called `loadCatalog().then(()=>sync())` without checking success. Once the in-game coach shell existed, this could create the same microtask retry storm later than startup. This explains why earlier synthetic injection tests could stop at v0.15.56 while real use could still freeze after interaction.

## Runtime fix

The v0.15.74 Electron entry keeps the validated historical runtime files unchanged on disk but sanitizes three item-catalog consumers immediately before renderer injection:

- `random-ingame-shop-v01553.js`: failed catalog results no longer re-enter `sync()`; retries are gated to at least 15s.
- `item-icons-global-v01557.js`: failed catalog state is retained and refresh retries are throttled.
- `item-art-runtime-v01566.js`: failed catalog state is retained and DOM mutation traffic cannot repeatedly trigger catalog requests inside the cooldown.

This is a runtime-safety transform only. Recommendation, team scoring, threat, build direction and purchase math remain unchanged (`score_logic_changed:false`).

## Freeze watchdog

`freeze-watchdog-v01574.js` is installed in the Electron main process before the base main runtime is compiled. It writes a JSON-lines log under the app userData `diagnostics` directory and records:

- `webContents` unresponsive/responsive events
- render-process-gone details
- bounded renderer heartbeat timeouts
- last captured click/input/change target summary
- active Random/Data view
- available v0.15.70/v0.15.71/v0.15.72/v0.15.73 runtime stats
- renderer heap snapshot where available
- Electron process metrics on hard stalls

If a post-v0.15.74 freeze remains, use this log before making another speculative performance patch.
