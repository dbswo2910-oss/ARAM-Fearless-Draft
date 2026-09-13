# v0.15.118 — Resource Lifecycle Stability

This release is a scoring-neutral stability pass for timers, listeners, observers, and long-lived renderer owners.

- Random IN GAME no longer queues unbounded one-shot ticks. `scheduleTick()` now coalesces work and preserves the earliest requested run while merging force-refresh intent.
- Random IN GAME replaces the permanent 1-second heartbeat interval with an adaptive timeout heartbeat: 1 second while the live coach is active, 3.5 seconds while inactive, and 8 seconds while the document is hidden. Its body observer is disconnected while inactive/hidden.
- Random Practice now keeps an owned reference to its long-task `PerformanceObserver` and exposes an idempotent disposer that clears deferred analysis/detail/maintenance/combo timers and cancels cooperative combo generations.
- Renderer AutoSync follow-up polls are coalesced behind one pending timeout, and the owner exposes an idempotent disposer for the follow-up and poll timer.
- `resource-lifecycle-v015118.js` is a non-UI aggregate owner. It adds no polling loop and provides a single snapshot/dispose surface for the three critical renderer runtime owners.
- Runtime readiness now verifies the lifecycle owner and all three critical disposers, persisting failures as `SAFE-RT118` through the existing v0.15.116 update rollback channel.
- CI performs a whole-active-manifest timer/listener/observer inventory and verifies the critical transformed sources remain lifecycle-bounded.
- v0.15.115 single-owner UI, v0.15.117 state integrity, recommendation logic, Random scoring, item logic, and champion data are unchanged.

`score_logic_changed:false` · `random_scoring_changed:false`
