# v0.15.116 — Runtime / Update Integrity Stability

This release is a scoring-neutral stability pass focused on the parts that sit underneath the UI.

- Update probation can no longer be committed as healthy after the current boot has written a runtime safety failure marker. The pending update stays quarantined so the existing next-boot rollback path can restore the previous snapshot.
- Runtime injection keeps the existing per-script isolation, then performs a critical readiness check for the safety net, performance owner, live AutoSync, Random Practice PICK/IN GAME owners, interaction stability layer, and the v0.15.115 UI owner. A critical miss is persisted as `SAFE-RT116` instead of being only a console warning.
- Runtime readiness is written to `diagnostics/runtime-readiness-v015116.json` for post-failure inspection.
- The in-app updater now rejects malformed manifests with duplicate install targets, install/delete collisions, unsafe sources, invalid optional SHA-256 values, duplicate deletes, or attempts to delete critical runtime files.
- The v0.15.115 single-owner RANDOM/DATA UI architecture is preserved exactly. No new DOM owner or delayed reparent repair layer is added.
- Recommendation, Random scoring, item recommendation, champion data, and balance math are unchanged.

`score_logic_changed:false` · `random_scoring_changed:false`
