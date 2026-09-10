# AI handoff addendum — v0.15.77 BLACKBOX stability architecture

## Context
Real Windows renderer freezes continued after v0.15.75 isolated the live `in_game` transition and after a local v0.15.76 hard-safe experiment disabled the live analysis path. Do not resume single-cause speculative freeze patches. v0.15.77 changes the debugging/stability architecture so the next real freeze produces an exact runtime or JavaScript stack signal.

## Structural problems found
### 1. All-or-nothing runtime injection
Historical `main.js` constructed one Promise chain across roughly fifty renderer overlays. If one `executeJavaScript()` rejected, all later overlays and the normal timer-hook restoration path were skipped. That can leave a partially initialized renderer where historical bootstrap suppression remains active or newer stability owners never load.

v0.15.77 moves injection to `runtime-loader-v01577.js`. Each runtime gets deterministic `RTI-###` logging, errors are caught per file, later files continue, and finalization always attempts:
- `aramRandomIngameRuntimeV01570.finishBootstrap()`
- `aramRuntimePerformanceV01568.restoreTimerHook()`
- `aramBlackboxV01577.rescan()`

### 2. Freeze probe queueing
The v0.15.75 watchdog used a timeout race around `executeJavaScript`. Winning the timeout did not cancel the renderer request. v0.15.77 is single-flight: a second probe is never submitted while the first is unresolved.

### 3. Freeze stack capture must be armed early
A synthetic Chromium hard-loop showed `Debugger.pause` captures the exact running frame when the Debugger domain is enabled before the stall. A separate attach-after-freeze test showed `Debugger.enable` may itself fail to answer once the renderer is already locked. Therefore `freeze-blackbox-v01577.js` attaches/enables the debugger while the renderer is healthy and keeps it armed for diagnosis.

On `FRZ-001` or `FRZ-002`, the main process sends `Debugger.pause`, records up to 16 frames to `freeze-stack-v01577.log`, resumes the renderer, and marks a successful stack as `FRZ-003`. Frames include function name, source URL, script id, line, and column.

### 4. Document-wide MutationObserver delivery
`runtime-source-stability-v01577.js` preserves prior catalog guards and additionally scopes active observers:
- v0.15.66 item art: only `#random`, `#historyMatchDetail`, and `#data`, child-list subtree changes only;
- role mastery / specialized role profile / profile UX / Riot grade history: only the profile overlay `#pp19ov` when it exists.

Do not restore documentElement/body observation without a measured reason.

## Renderer blackbox
`runtime-blackbox-v01577.js` is injected before the performance owner. It records renderer exceptions/rejections and wraps high-risk global/runtime operations when available. It also exposes a tiny noninteractive bottom-right `DIAG ...` badge and `aramBlackboxV01577.snapshot()`.

Important codes:
- `RTI-###`: renderer overlay injection
- `JS-E###`: JavaScript exceptions
- `JS-P###`: Promise failures
- `OP-SLOW` / `OP-CRIT`: synchronous operation latency
- `LT-001` / `LT-002`: long tasks
- `FRZ-001`: heartbeat stall
- `FRZ-002`: Electron unresponsive
- `FRZ-003`: exact JavaScript stack captured
- `FRZ-004`: stack capture failed/unavailable
- `CRS-001`: renderer process gone

## Real freeze workflow
If the app freezes on Windows after v0.15.77:
1. force-close the app;
2. collect `freeze-blackbox-v01577.log`, `freeze-stack-v01577.log`, and `last-diagnostic-v01577.json`;
3. inspect the newest `FRZ-003` first;
4. map its top frame to the exact source file/function/line;
5. only then make the next fix.

If `FRZ-003` is absent and the latest event is `FRZ-004`, investigate compositor/native/layout stalls rather than assuming another JavaScript loop.

## Preserved behavior
- v0.15.73 failed-catalog retry protection remains.
- v0.15.74 remaining catalog guards remain, now applied by `runtime-source-stability-v01577.js` before runtime execution.
- v0.15.75 exact installed-index in-game transition patch remains active.
- v0.15.72 Random Practice cooperative TOP5 and v0.15.70/v0.15.71 owners remain.
- Recommendation, ban, score, threat, item judgement, and purchase formulae are unchanged.

`score_logic_changed:false`
