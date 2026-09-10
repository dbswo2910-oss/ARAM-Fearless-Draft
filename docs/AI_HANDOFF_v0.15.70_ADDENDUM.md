# AI Handoff Addendum — v0.15.70 Random In-game single-owner runtime

## Real Windows symptom
The user still experienced full UI freezes after v0.15.69, and specifically reported that the problem appeared after extensive Random Game In-game work. Treat this observation as the primary diagnosis context for v0.15.70.

## Root architectural problem
The installed base `index.html` already contains a full Random In-game renderer. v0.15.50 later hid its DOM shell and introduced the compact Coach, but the base renderer kept calculating and repainting the hidden shell. Meanwhile v0.15.50-v0.15.57 accumulated multiple independent polling/observer layers. The result was duplicated computation and DOM/image churn for the same live state.

Particularly important paths:
- base `renderRandomDetails()` performs threat, next-item, power, alive and fight-plan calculations plus many `innerHTML` writes.
- base AutoSync can call it as live state changes.
- base `showTab('random')` calls `renderRandomAnalysis()`, which rebuilds pick-analysis DOM and ends by calling `renderRandomDetails()`.
- v0.15.50 adds a 700ms Coach poll and a Random-wide capture click scheduler.
- v0.15.51 adds a subtree MutationObserver.
- v0.15.52/v0.15.53/v0.15.54/v0.15.56/v0.15.57 add separate recurring polls; v0.15.57 also invokes v0.15.56 icon refresh.

## v0.15.70 runtime contract
`runtime-random-ingame-v01570.js` is loaded immediately before `random-ingame-coach-v01550.js` and temporarily owns timer/observer registration only while v0.15.50-v0.15.57 initialize. After `item-icons-global-v01557.js` is injected, `main.js` calls `finishBootstrap()` and restores those browser APIs.

The new owner then:
- keeps one 1000ms heartbeat;
- does heavy work only when `#random` is active, `data-random-mode="ingame"`, the document is visible, and v0.15.68 is not in native-interaction busy state;
- suppresses hidden base detail/analysis rendering in In-game mode while preserving it in Pick mode;
- uses semantic state changes rather than exact seconds/gold to decide when the entire Coach must rerender;
- preserves the <=7s respawn AUTO boundary and a coarse 30-second timing bucket;
- patches clock/respawn/gold text directly between semantic renders;
- runs v0.15.51/v0.15.52 and current item decoration after real Coach-body changes;
- runs v0.15.53/v0.15.54 shop work only in Build and throttles it;
- skips v0.15.57 whole-app icon scanning while Random In-game is active;
- exposes diagnostic counters/timing maxima via `aramRandomIngameRuntimeV01570.getStats()`.

## Do not regress
Do not re-enable independent recurring timers in v0.15.50-v0.15.57 or add another whole-#random MutationObserver for In-game upkeep. New In-game UI should plug into the single-owner lifecycle.

Do not change scoring simply to solve a renderer freeze. v0.15.70 is intentionally score-neutral.

## Validation priority
After static/CI regression succeeds, the decisive validation remains the user's real Windows session: repeatedly switch Random Pick/In-game, switch top navigation tabs, click LIVE/Build/Detail, move/resize the window, and leave the in-game Coach running for several minutes. If a freeze remains, use the v0.15.70 runtime diagnostics rather than stacking another speculative poller.
