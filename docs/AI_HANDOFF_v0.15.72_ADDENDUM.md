# AI Handoff v0.15.72 Addendum

## New real-Windows signal
The remaining renderer freeze is global rather than Random- or Live-only. Repeated interaction in any top-level view can eventually stall. Maximizing the Electron window makes the failure reproduce much faster, while a smaller window is materially more stable.

## Runtime audit
The verified installed base `index.html` is ~35 MB and its visual layer includes multiple large blur/backdrop/shadow/gradient surfaces. The current updater overlay contains 60+ JavaScript files with many recurring timers, MutationObservers, document-level event listeners and DOM rewrites. Historical compatibility layers have been partially preempted since v0.15.66/v0.15.68/v0.15.70, but hidden-view callbacks and overlapping Random Pick watchers still exist.

## v0.15.72 architecture
`runtime-global-performance-v01572.js` must load before every historical overlay. `main-v01572.js` tags each overlay execution with `window.__ARAM_LOADING_RUNTIME_V01572__` so the governor can associate timers, observers and document listeners with the feature/view that created them.

The governor:
- skips feature-owned timer/observer/document-event callbacks when the owning view is inactive;
- coalesces MutationObserver bursts;
- clamps noncritical fast overlay intervals to >=1500 ms;
- suppresses the v0.15.49/v0.15.55/v0.15.58/v0.15.68 Random Pick recurring watchers during bootstrap and replaces them with one Random maintenance owner;
- uses a 2s Random heartbeat only while Random is active for AutoSync-driven cosmetic refresh;
- activates `aramLargeViewportV01572` at large viewport area and removes high-cost backdrop blur, broad shadows and transitions while using an opaque body/background surface;
- records per-owner callback max times and Chromium Long Task counts through `aramGlobalPerformanceV01572.getStats()`.

v0.15.71 AutoSync transport stabilization remains active. v0.15.70 Random In-game ownership remains active. No scoring/recommendation/item/threat/purchase algorithm is changed.

## Next diagnosis if real Windows still freezes
Do not add another blind menu-specific overlay. Capture `aramGlobalPerformanceV01572.getStats()` before/after stress interaction if possible. The `owners` map identifies timer/observer/event owners and maximum callback time; `longTaskMaxMs`/`longTasks` separates JS main-thread stalls from compositor-only failures. If the freeze only occurs with `large:true`, next isolate GPU/compositor behavior by comparing the existing `ARAM_DISABLE_HARDWARE_ACCELERATION=1` diagnostic mode rather than changing scoring/UI logic.
