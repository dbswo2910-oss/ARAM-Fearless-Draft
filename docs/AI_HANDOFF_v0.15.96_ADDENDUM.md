# AI Handoff Addendum — v0.15.96 RESULTS SYNC HOTFIX

## Scope

v0.15.96 fixes the post-match data boundary introduced by the v0.15.95 IN GAME Result dashboard.

v0.15.95 owns the Result UI and LIVE -> Result transition. v0.15.96 does not redesign that UI. It adds the missing post-game Match Lab refresh and stale-result protection.

## Runtime owner

Active layer: `update/v0.15.96/runtime-source-stability-v01596.js`.

It wraps v0.15.95 and patches `random-ingame-coach-v01550.js` after the prior runtime-source stability layers have been applied.

## Post-game contract

When a real LIVE standard ARAM session ends:

1. v0.15.95 switches the IN GAME subtab to `결과` and records `endedAt`.
2. v0.15.96 notices the new `endedAt` on the existing coach heartbeat.
3. The result sync forces Match Lab state to the current account and `standard` ARAM queue.
4. It calls the existing `loadAramHistory(true)` loader rather than creating a second match-history implementation.
5. It retries at bounded intervals up to 10 attempts because League Client history publication may lag the gameflow transition.
6. The newest returned match must match the captured live game id when available, or be newer/different than the pre-finish Match Lab head.
7. Until that condition is satisfied, the Result tab displays a sync state rather than rendering a previous game as though it were the just-finished one.
8. Exhausted retries produce an explicit retry state. Clicking `결과` retries immediately while preserving the game-end stale guard.

## Stability rules

- Reuse the existing roughly 700 ms Random In-game coach render heartbeat.
- Do not add a result-specific `setInterval`.
- Do not add a result-specific `MutationObserver`.
- Keep the v0.15.79 updater/runtime safety lineage intact.
- Do not duplicate Match Lab's LCU history parser or queue classification.
- Result sync is current-account + standard-ARAM only for this IN GAME surface.

## Regression rules

- `tools/ingame-results-v01595-audit.js` validates the historical Result dashboard contract and is forward-compatible with a newer active manifest.
- `tools/ingame-results-sync-v01596-audit.js` validates the post-game refresh, bounded retry, current-account/standard-ARAM forcing, stale-result guard, no-new-timer/observer policy and inherited scoring behavior.
- Both audits must run in Full Regression Audit.

## Scoring

`score_logic_changed:false`.

No draft, pick, ban, composition, champion or matchup scoring changes are part of v0.15.96. Existing item recommendation behavior is inherited from v0.15.95.

## Real-session validation target

After updater installation on Windows, play one standard ARAM game and verify:

- LIVE view works normally during the match.
- On game end, IN GAME moves to `결과`.
- The screen may briefly show `방금 경기 결과 동기화 중` while League Client publishes the match.
- The completed match replaces that state automatically without needing Match Lab to be opened manually.
- K/D/A, result, build and recent-match panels refer to the just-finished match.
- If League Client publication is delayed beyond the retry window, old match data is not mislabeled as the new result; the explicit retry state is shown instead.
