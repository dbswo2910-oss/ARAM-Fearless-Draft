# AI Handoff Addendum — v0.15.67 Stability Hotfix

This addendum supplements `docs/AI_HANDOFF.md` for the v0.15.67 Windows responsiveness fix.

## Active updater version

- Active updater version: **v0.15.67**
- Balance/data patch remains **26.17**
- Recommendation/scoring logic changed: **false**

## Real-Windows symptom that triggered this release

After the v0.15.66 item-art single-owner fix, the app could still become unresponsive when the native Electron window was moved/resized or when UI navigation woke several sub-second cosmetic maintenance loops.

## v0.15.67 runtime decisions

1. On Windows, `main.js` calls `app.disableHardwareAcceleration()` synchronously before Electron is ready. `ARAM_ENABLE_HARDWARE_ACCELERATION=1` is an explicit diagnostic opt-in to GPU acceleration.
2. `runtime-performance-v01567.js` is injected before the historical party-label layers.
3. During runtime patch bootstrap only, newly-created UI `setInterval` jobs below 900 ms are wrapped and clamped to 900 ms. The global timer hook is restored after patch injection; already-created wrappers continue to respect the move/resize busy flag.
4. Native BrowserWindow move/resize events pulse `window.aramRuntimePerformanceV01567.setBusy(true)` and release after 220 ms of quiet time. Governed maintenance callbacks skip while busy.
5. v0.15.59/v0.15.61/v0.15.62 party-label runtime initialization is preempted. One scoped event-driven owner preserves the final v0.15.62 visual contract: `팀원픽` belongs in `#poolInputs`, while `외부픽` takes precedence.
6. The historical v0.15.53 shop source remains unchanged. A targeted `Element.prototype.innerHTML` wrapper deduplicates identical writes only when `id === 'riShopPlannerV01553'`, preventing a repeated identical shop paint from cascading into other DOM observers.

## Validation requirement

`tools/runtime-stability-v01567-audit.js` must pass inside Full Regression Audit before release. Static/VM validation cannot replace the final Windows check: move the app window, resize it, switch major screens, and verify that click/scroll interaction remains responsive.
