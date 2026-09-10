# v0.15.71 real-game AutoSync stability addendum

## Real Windows finding
After v0.15.70 consolidated Random In-game UI maintenance, the user isolated the remaining freeze to **real League games only**. Preview/non-game use did not reproduce it. This changes the primary fault domain from generic Random In-game rendering to the live AutoSync data path.

The verified installed base has two independent live loops:
- main `LeagueAutoSyncCore.start()` at 750 ms, with repeated LCU + Live Client HTTPS reads;
- renderer `setupLolAutoSync()` at 900 ms, invoking `getAutoSyncState()` without a single-flight guard.

The renderer also called `aramTrackLinkedGame(s)` every poll. In `in_game`, that path synchronously parsed, sorted, serialized, and rewrote Match Lab linkage data in localStorage repeatedly even though the game/team identity is effectively static.

## v0.15.71 architecture
`autosync-live-runtime-v01571.js` patches the main-process Core before instantiation:
- 1200 ms core cadence;
- live identity/lobby refresh at most every 15 s;
- live credential/gameflow checks at most every 3 s;
- active-player name cached 15 s;
- event history cached 3 s.

`runtime-live-autosync-v01571.js` patches the already-created renderer loop:
- single-flight `lolAutoSyncPoll` so delayed IPC can never accumulate overlapping polls;
- renderer cadence 1250 ms;
- complete 5v5 Match Lab linkage written once per process/game;
- stable AutoSync/account status DOM paints deduped;
- diagnostic counters exposed at `window.aramLiveAutosyncRuntimeV01571.getStats()`.

`main-v01571.js` is the v0.15.71 Electron entry. It patches the cached AutoSync Core, then compiles the immutable v0.15.70 `main.js` base after narrowly injecting the renderer live governor and promoting the runtime version to v0.15.71. This keeps the validated v0.15.70 runtime base intact.

v0.15.70 remains the owner of Random In-game HUD maintenance and hidden legacy-render suppression. v0.15.71 is specifically the real-game transport/persistence governor. Both are score-neutral.

## If real Windows still freezes
Do not add another generic timer clamp. Capture whether the freeze occurs with the Random tab inactive as well as active, and inspect v0.15.71 counters. The next split is:
1. if freezing with Random tab inactive: main AutoSync/Chromium/League interaction;
2. if only with Random In-game active: live model computation or body repaint path.
