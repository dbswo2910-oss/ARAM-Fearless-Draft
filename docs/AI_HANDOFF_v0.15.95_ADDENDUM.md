# AI HANDOFF · v0.15.95 IN GAME RESULTS

## Product contract

`RANDOM > 인게임` keeps the existing `LIVE` and `빌드` behavior, but the low-value `상세` tab is replaced by `결과`.

The result dashboard follows the approved post-match reference hierarchy:

1. game-end result hero (`승리 / 패배 / 결과 확인 중`)
2. local-player match summary
3. evidence-based result analysis
4. final item build
5. recent five ARAM matches
6. recent trend using up to twenty available matches
7. next-game improvement cards

## Data contract

- Reuse the existing Match Lab state (`aramHistoryState`) and participant helpers where available.
- Do not invent Riot match values. Missing KDA/damage/taken/CC/vision/items/result values render as `-` or a synchronization-waiting state.
- The dashboard can tolerate known historical field aliases because Match Lab data has evolved across versions.
- Current-match transition is conservative: only a coach session that actually observed `source === 'live'` may auto-switch to `결과` after the live source disappears.
- Result-history arrival is part of the coach render signature so the result view refreshes when Match Lab finishes synchronizing the completed match.

## Runtime / stability contract

- v0.15.95 adds no `setInterval` and no `MutationObserver`.
- It reuses the v0.15.70 single-owner in-game heartbeat and semantic refresh gate.
- LIVE and build recommendation behavior are not changed.
- `score_logic_changed:false`.
- Preserve v0.15.94 selected-candidate DNA preview, v0.15.92 Poro-Snax filtering, v0.15.87 route adoption, and the v0.15.79 transactional safety baseline.

## Files

- `update/v0.15.95/runtime-source-stability-v01595.js`
- `update/v0.15.95/main-v01595.js`
- `update/v0.15.95/package.json`
- `tools/ingame-results-v01595-audit.js`
- `.github/workflows/v01595-ingame-results-audit.yml`
- `docs/CHANGELOG_v0.15.95.txt`
