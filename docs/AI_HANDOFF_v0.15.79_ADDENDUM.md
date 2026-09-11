# v0.15.79 Safety Baseline Addendum

## Purpose
v0.15.79 is intentionally not a feature release. It freezes the v0.15.78 behavior that stopped the reported Windows hard-freeze and adds permanent safety rails for the many feature patches expected after this point.

## Last known good
- v0.15.78 is the first user-confirmed build that stopped freezing after the BLACKBOX-evidenced owner-state `renderAll()` path was removed.
- Do not rewrite or weaken the v0.15.78 owner-state fix while doing unrelated feature work.
- v0.15.79 becomes the first transactional-update safety baseline for future in-app updates.

## Transactional updater contract
`updater-safety-patch-v01579.js` patches the historical in-app updater before compile.

Before future update files are written:
1. `update-safety-v01579.js` creates a persistent snapshot under the app user-data safety directory.
2. All manifest-touched files plus `index.html`, `autosync-core.js`, `main.js`, `preload.js`, and `package.json` are recorded with existed-before metadata.
3. New-version files are then applied by the historical updater.
4. The pending transaction survives process restart.

On the first boot of the new version:
- a probation record is opened;
- both stable MAIN and RENDERER heartbeat files must remain fresh for 12 consecutive checks;
- only then is the update committed as healthy.

If a probation boot hangs or exits abnormally:
- `external-watchdog-v01579.js` records `HNG-M001`, `HNG-R001`, or `HNG-B001` and writes a safety-failure marker;
- on the next launch the safety module restores the previous snapshot;
- files that did not exist before the failed update are removed;
- the app relaunches on the restored version.

This mechanism starts protecting updates made *from* v0.15.79 onward. Keep the v0.15.78 Windows installer as a manual recovery artifact for the v0.15.78 → v0.15.79 transition itself.

## Stable heartbeat contract
Starting with v0.15.79 use these non-versioned files in the diagnostics directory:
- `heartbeat-main.json`
- `heartbeat-renderer.json`
- `external-hang.log`

The v0.15.78-named heartbeat/log files are still written for backward diagnostic compatibility.

## Renderer circuit breakers
`runtime-safety-net-v01579.js` wraps only known high-risk UI/heavy entry points:
- `renderAll`
- `runRandomCombos`
- `renderRandomAnalysis`
- `renderRandomDetails`
- `renderDataExplorer`
- `renderAramHistoryFeedback`

Guards:
- recursive re-entry is blocked (`SAFE-R001`);
- slow/critical calls are logged (`SAFE-P001` / `SAFE-P002`);
- three recent synchronous errors open a 30-second circuit (`SAFE-CB1`);
- two recent critical blocking calls open a 30-second circuit (`SAFE-CB2`);
- calls while the circuit is open are skipped (`SAFE-CB0`).

Do not broaden these circuit breakers casually. They are a containment layer, not a replacement for fixing root causes.

## CI safety policy
`tools/runtime-stability-v01579-audit.js` is a permanent release gate. It validates:
- v0.15.79 safety files parse and are delivered;
- current entry installs the boot guard before the normal runtime stack;
- updater patch remains transactional and idempotent;
- snapshot rollback restores old files and removes newly introduced files;
- live owner-state restore cannot call `renderAll()` or TOP5;
- no new document-wide MutationObserver is introduced outside the historical compatibility allowlist;
- runtime recursive re-entry and repeated-error circuit behavior works in VM tests;
- scoring logic remains unchanged.

Future releases must preserve this audit or replace it with an equal-or-stronger safety gate. Never weaken the test merely to make a feature PR green.

## Scoring
`score_logic_changed:false`

Recommendation, ban, team score, item, threat, purchase, and time-power algorithms are unchanged.
