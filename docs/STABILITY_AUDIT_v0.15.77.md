# v0.15.77 freeze-risk audit

This audit was initiated because real Windows freezes persisted after both in-game transition isolation and a hard-safe live-path experiment.

| Area | Finding | v0.15.77 action |
|---|---|---|
| Runtime loader | One rejected overlay aborted every later overlay and normal cleanup | Per-file fault isolation with `RTI-###`; mandatory finalizer |
| Watchdog | Timeout race left unresolved renderer probes outstanding | Single-flight renderer heartbeat |
| Freeze diagnosis | Post-freeze debugger attachment may be too late | Debugger attached/enabled while healthy; `Debugger.pause` on stall |
| Freeze stack | Previous logs only knew last successful heartbeat | `FRZ-003` persists actual function/file/line/column call frames |
| Item art observer | Whole-document child/attribute observation | Scope to item-bearing roots only |
| Profile observers | Several whole-document child-list observers | Scope to `#pp19ov` only |
| Catalog consumers | Historical failed-catalog retry risks | Preserve v73/v74 backoff transformations |
| Random TOP5 | Historical synchronous exhaustive calculation | Preserve v72 cooperative calculation |
| AutoSync | Historical overlap / frequent live transport | Preserve v71 single-flight governor |
| In-game renderer | Historical stacked recurring owners | Preserve v70 single owner |
| In-game transition | Pick pipeline could re-enter at game start | Preserve v75 transition isolation |
| Persistence | Synchronous JSON/localStorage path remains possible cost | Instrument via `STO-100`; do not change semantics without captured evidence |
| Remaining base timers | Core/online/grade/status periodic work still exists | Measure through blackbox before removing product behavior |

The purpose of this release is not to claim a new single freeze root cause. It removes two structural amplification mechanisms and makes the next real freeze attributable to a concrete runtime or JavaScript stack whenever Chromium can pause the renderer.

`score_logic_changed:false`
