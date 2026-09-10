# AI Handoff Addendum — v0.15.69 Renderer Freeze Root-Cause Fix

This addendum supplements the existing project handoff notes.

## Real installed diagnostics
A real v0.15.68 Windows diagnostics archive captured on 2026-09-11 confirmed:

- installed path: `%LOCALAPPDATA%\ARAM Fearless Draft AutoUpdate\appfiles`
- `index.html`: 35,359,059 bytes, SHA-256 `8DE7A8EB03E363B808439D48673A4808809D82DB67BC1B7955E80414A8782906`
- `autosync-core.js`: 39,400 bytes, SHA-256 `A9F206DF445D06EEFC99AE55F1CEB3A7A5FF108A40A8393FA75EC413D2C4ABA6`
- installed main/package were v0.15.68
- the base UI is therefore the same verified baseline captured at v0.15.49; the freeze was not caused by an unexpected base-file replacement.

## Root-cause finding
The installed base `index.html` contains a developer Golden Guard with 271 synchronous engine regression checks. `init()` schedules the full suite 30 ms after startup via:

`setTimeout(()=>runEngineRegressionTests(false),30)`

The first Data-tab visit can also start the same suite automatically via `ensureRegressionRun()` when no previous result exists. The suite repeatedly calls expensive recommendation and scoring paths, including full 173-champion pick/ban ranking. Because this work runs synchronously on the renderer thread, the UI can stop responding shortly after launch or after a few apparent clicks.

An earlier WebAudio/SFX leak hypothesis was tested on the user's real Windows app by disabling SFX and was disproven as the primary cause; the freeze still reproduced.

## v0.15.69 decision
Do not remove Golden Guard itself and do not change recommendation/scoring logic. `main.js` patches only the two exact installed-base autorun markers before loading `index.html`:

1. Electron startup no longer auto-runs the suite. Standalone/browser HTML retains the historical startup behavior.
2. Data-tab entry only renders an existing result; it does not trigger a new full run automatically.
3. The explicit `전체 테스트 다시 실행` button remains available.
4. Before the first surgical edit, the original index is copied to `index.pre-v01569-auto-regression.bak.html`.
5. The patch is idempotent; once the exact old markers are absent, no file rewrite occurs.

v0.15.68 GPU/native move safeguards remain active. `score_logic_changed:false` in intent: pick/ban/team/item/threat/purchase algorithms are untouched.

## If v0.15.69 still freezes on real Windows
Do not immediately add another broad polling or rendering workaround. The next diagnostic should instrument renderer event-loop lag and count active timers/observers by runtime layer, then isolate overlay groups. The real installed baseline is now verified, so further investigation should target runtime behavior rather than guessed DOM structure.
