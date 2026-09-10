# v0.15.73 Addendum — Reproduced item-catalog hard freeze

## User symptom
After v0.15.72, repeated Random Practice interaction could still eventually freeze the entire Electron renderer, sometimes after navigating to another tab such as Data.

## Reproduced root cause
The freeze was reproduced outside the user's PC using the verified installed base `index.html` plus the current runtime overlay. Runtime injection stopped at `random-item-icons-v01556.js` when the desktop item catalog API was forced to return `{ok:false}`.

Historical v0.15.56 code used this path:

`sync() -> loadCatalog().then(sync) -> catalog.ok is false -> loadCatalog().then(sync) -> ...`

Because `pending` is cleared after each failed/unsuccessful result, this becomes an unbounded Promise/microtask retry chain. v0.15.70 timer suppression could not govern it because the retry is Promise-driven rather than interval-driven.

## Fix
The installed target filename remains `random-item-icons-v01556.js` for compatibility, but v0.15.73 delivers the maintained source from `update/v0.15.73/random-item-icons-v01556.js`.

- no unconditional `loadCatalog().then(()=>sync())` retry
- failed `{ok:false}` catalog results leave the existing text UI usable
- one delayed retry is allowed with a 15–30 second backoff
- a successful catalog result may re-enter `sync()` to add icons
- exposes `getStatus()` for catalog/retry diagnostics
- scoring remains untouched (`score_logic_changed:false`)

## Reproduction validation
Before the fix, the forced-failure runtime-injection test stopped at v0.15.56 and timed out. With the patched file under the same forced failure, all 56 runtime overlays loaded successfully. A follow-up stress loop repeatedly exercised Random Practice and Data navigation for 20 cycles without the hard freeze.

## Release invariant
Keep v0.15.72 Random Practice cooperative TOP5/single-owner changes, v0.15.71 AutoSync governor, and v0.15.70 Random In-game owner intact. Do not revert to the historical immediate catalog retry behavior.
