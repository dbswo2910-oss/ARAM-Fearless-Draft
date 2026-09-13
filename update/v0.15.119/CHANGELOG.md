# v0.15.119 — AutoSync Concurrency Stability

This release hardens asynchronous League/LCU/Live Client state flow without changing recommendation or scoring logic.

- Main-process AutoSync ticks are single-flight. A slow tick can no longer overlap the next scheduled tick and allow an older request tree to finish after a newer one.
- The core scheduler is one owned timeout chain rather than an unconditional interval. Failed ticks back off up to 15 seconds instead of immediately piling more network work onto a disconnected/restarting League client.
- Identity/party, credential, gameflow, and Live Client GET calls are coalesced per endpoint while in flight.
- Credential rotation invalidates the short-lived gameflow / Live Client caches and increments a connection epoch. An endpoint completion from the previous credential epoch is retried against the current connection instead of being accepted blindly.
- Renderer AutoSync polls keep the v0.15.118 single-flight/follow-up lifecycle and add a request sequence + lifecycle epoch guard so a completion after disposal/replacement is dropped before Random Practice fan-out.
- Runtime readiness now requires the v0.15.119 renderer concurrency marker and persists failures as `SAFE-RT119`.
- The v0.15.115 UI owner, v0.15.117 state-integrity owner, and v0.15.118 lifecycle owner remain unchanged.

`score_logic_changed:false` · `random_scoring_changed:false`
