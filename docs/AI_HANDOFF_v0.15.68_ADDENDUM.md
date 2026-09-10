# AI Handoff Addendum — v0.15.68 Native Window Stability

This addendum supersedes the v0.15.67 rendering/native-move strategy where the two differ.

## Active updater version

- Active updater version: **v0.15.68**
- Balance/data patch remains **26.17**
- Recommendation/scoring logic changed: **false**

## Real-Windows evidence

The user confirmed that v0.15.67 still becomes unresponsive when the native Electron window is physically moved. Treat that real-Windows result as authoritative over the earlier static/VM success.

## Corrected diagnosis

- v0.15.67 forced `app.disableHardwareAcceleration()` on Windows by default. The app's large installed UI uses many compositing-heavy effects, so software rendering can increase native move/resize cost rather than reduce it.
- v0.15.67 also handled continuous `move` and `resize` events and used `webContents.executeJavaScript()` during the interaction. Do not repeat work on every native move/resize event.
- `runtime-performance-v01567.js` was injected mid-chain and therefore could not govern short intervals created by earlier runtime patches.

## v0.15.68 runtime contract

1. Chromium/GPU compositing is the default again. Software rendering is diagnostic opt-in only with `ARAM_DISABLE_HARDWARE_ACCELERATION=1`.
2. Remove continuous `mainWindow.on('move', ...)` and `mainWindow.on('resize', ...)` work.
3. Native interaction state is toggled only at `will-move`/`moved` and `will-resize`/`resized`, with an idempotent state guard.
4. `runtime-performance-v01568.js` is the **first** injected runtime patch so all later overlay-created sub-second maintenance intervals can be governed.
5. During native move/resize, governed callbacks skip and expensive animation/transition/backdrop/shadow effects on known surfaces are temporarily suppressed.
6. Windows background material is explicitly `none` when the Electron API is available.
7. Historical v0.15.59/v0.15.61/v0.15.62 party-label runtimes remain preempted by one scoped compatibility owner; the final visible contract remains `팀원픽` in the remaining-random pool slot, with `외부픽` precedence.
8. Identical writes to `#riShopPlannerV01553` remain deduplicated.
9. Recommendation, composition, threat, item, purchase, and scoring logic remain unchanged (`score_logic_changed:false`).

## Validation

`tools/runtime-stability-v01568-audit.js` must pass inside Full Regression Audit before release. Static/VM validation cannot replace a real Windows check. After update, physically drag the window across the desktop and resize it repeatedly while confirming that click/scroll remains responsive.

If the freeze persists after v0.15.68, stop adding speculative runtime layers. Collect the user's actual current `appfiles/index.html`, `autosync-core.js`, `main.js`, `package.json`, `preload.js`, and current performance runtime for direct analysis; do not collect Riot credentials, lockfiles, browser profiles, or unrelated personal data.
