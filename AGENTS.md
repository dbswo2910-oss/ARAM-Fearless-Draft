# ARAM Fearless Draft — AI / Coding Agent Entry Point

Read this file before editing the repository.

## Current source of truth

1. `update/manifest.json` — active in-app update channel and current distributed runtime files.
2. `docs/INSTALLED_BASELINE_v0.15.49.md` — verified real Windows installation snapshot captured from `ARAM Fearless Draft AutoUpdate/appfiles`.
3. `reference/installed-v0.15.49/random-practice-pick-fragment.html` — exact installed DOM fragment for Random Practice pick mode.
4. `reference/installed-v0.15.49/random-practice-ingame-fragment.html` — exact installed DOM fragment for Random Practice in-game mode.
5. `docs/AI_HANDOFF.md` — architecture, recent decisions, UI philosophy, and next planned work.
6. `update/v*/` — versioned patch sources. Older versions are historical; do not treat an old update directory as current just because it exists.

## Critical rules

- Never infer installed UI structure from screenshots alone when a baseline/DOM map is available.
- Prefer exact IDs/classes from the installed baseline. Avoid broad text/regex DOM discovery that can capture parent panels. This caused the v0.15.48 Random Practice layout collapse.
- Captured baseline `index.html`: 35,359,059 bytes, SHA-256 `8de7a8eb03e363b808439d48673a4808809d82db67bc1b7955e80414a8782906`.
- The user's installed `appfiles/manifest.json` may be stale. Verify installed runtime from `main.js` / `package.json`; verify active distribution from repository `update/manifest.json`.
- Keep app version, manifest, package metadata, README/changelog/audit, workflow, and AI handoff notes synchronized when releasing.
- Preserve recommendation/balance logic for UI-only requests and explicitly document whether scoring changed.
- Before reporting a GitHub update complete, wait for Full Regression Audit and verify the relevant new audit plus historical forward-compatible audits are `success`.
- If a newer real installed-app ZIP is supplied, preserve it as a new baseline rather than silently replacing historical baseline documentation.

## Current product/UI direction

The product is being simplified around fast decisions rather than vertically stacking every detail.

- Draft: compact two-column workflow; pick judgment uses tabs.
- Pick judgment: summary / risk detection / composition matchup.
- Random Practice pick: inputs first, recommendations prioritized, detail behind tabs/collapse.
- Random Practice in-game: **one-glance coach HUD**; alive state should be readable in roughly 1–2 seconds.
- Recommendation engines should not repeatedly overreward a small set of champions through duplicated synergy signals.
- Item-bearing UI should use **official icon + short existing text**, never icon-only, and should avoid duplicating artwork already present in the base UI.

## Random Practice exact installed IDs — v0.15.49 baseline

Pick mode:

- `#random`
- `#queueSize`
- `#lolAutoSyncPanel`
- `#randomInputAnchor`
- `#externalInputs`
- `#externalCheck`
- `#manualPartyInputs`
- `#poolInputs`
- `#randomRecommendAnchor`
- `#comboResults`
- `#comboDetail`
- `#randomOurFive`
- `#randomOurSummary`
- `#randomEnemySummary`
- `#randomRoles`

In-game base shell:

- `#randomIngameShell`
- `#randomLiveTopbar`
- `#randomIngameSubnav`
- `#randomLiveSummary`
- `#randomLiveBuildAdvice`
- `#randomThreatList`
- `#randomFightGuide`
- `#randomTimingPanel`
- `#randomPowerCurve`

Read both exact DOM fragments under `reference/installed-v0.15.49/` before changing Random Practice layout.

## Current Random Practice / item UI runtime contract — v0.15.59

Pick-side layers:

1. `update/v0.15.49/random-practice-focus-v01549.js`
2. `update/v0.15.55/random-pick-density-v01555.js`
3. `update/v0.15.58/random-party-picks-v01558.js`
4. `update/v0.15.59/random-party-labels-v01559.js`

In-game and item-visual layers:

1. `update/v0.15.50/random-ingame-coach-v01550.js`
2. `update/v0.15.51/random-ingame-ux-v01551.js`
3. `update/v0.15.52/random-ingame-ux-v01552.js`
4. `update/v0.15.53/random-ingame-shop-v01553.js`
5. `update/v0.15.54/random-ingame-shop-polish-v01554.js`
6. `update/v0.15.56/random-item-icons-v01556.js`
7. `update/v0.15.57/item-icons-global-v01557.js`

`v0.15.55` keeps rank 1 large while compacting ranks 2–5. `v0.15.56` adds official Data Dragon item icons to the current coach. `v0.15.57` audits and extends the same visual language to every verified item-bearing user-facing menu from the installed baseline without changing recommendation logic. `v0.15.58` adds AutoSync party-current-pick visibility and corrects the cramped Random Practice composition-status layout. `v0.15.59` makes manual-vs-AutoSync state labels visible inside the champion input row.

v0.15.58–0.15.59 Random Practice pick rules:

- read party-held champions from observable AutoSync champ-select state (`party`, plus local-champion fallback)
- display current party champions in `#manualPartyInputs` as **display-only current picks**, but do not write them into `randomState.manual`
- manual locks remain an explicit user choice; current party picks are display-only so the recommendation engine can still suggest swaps from the bench/candidate pool
- mark party-held candidates in `#poolInputs` with `팀원픽`; they remain recommendation candidates
- an existing `외부픽` remains excluded and takes precedence over `팀원픽`
- `#externalCheck` remains the full-width host; its child `.randomCheckGrid` owns the actual three-card desktop grid
- visible status copy is shortened to `현재 조합 체크` with `조합 보완 / 실질 딜 밸런스 · AD / AP / 추천 계산`
- v0.15.59 consumes the v0.15.58 row-state classes instead of reimplementing AutoSync logic
- AutoSync-held row → blue `팀원픽` pill inside `.searchWrap`
- explicit manual lock → green `수동고정` pill inside `.searchWrap`
- old narrow slot badges are hidden to avoid duplicate or clipped labels
- exact selectors only: `#manualPartyInputs`, `#poolInputs`, `#externalCheck`
- `score_logic_changed:false`

Visible in-game hierarchy:

- 3 tabs: `LIVE / 빌드 / 상세`
- AUTO:
  - alive → LIVE combat mode
  - dead with meaningful respawn time → Build/analysis
  - respawn <= 7 seconds → LIVE preparation
- LIVE information budget:
  - NOW CALL
  - highest threat
  - local role/action
  - next purchase
  - at most one critical warning
- Build death view:
  - respawn countdown + current gold
  - `지금 구매` recipe/component planner
  - current-match optimized build primary
  - statistical base build secondary
  - next-fight action line
- Preview uses the same coach renderer and clearly marks synthetic data.

v0.15.53 purchase-planner rules:

- completed-core recommendation and immediate component purchase are separate concepts
- use current gold plus actual Data Dragon recipe metadata (`from`, `into`, `gold.base`, `gold.total`)
- account for already-owned components when they are observable from Live Context
- if real owned-component state cannot be confirmed, hide exact component-buy advice instead of risking duplicate purchases
- display immediate buy(s), purchase cost, leftover gold, final core target, and remaining core cost
- use `ko_KR` item catalog where available
- `score_logic_changed:false`; this layer does not alter recommendation/threat/item scoring

v0.15.56 item-icon rules:

- use item IDs/name mapping and Data Dragon version from the existing desktop item catalog
- decorate `LIVE 다음 구매`, death `지금 살 것`, optimized core, final core target, and statistical base tree
- keep item names/prices visible; icons supplement rather than replace text
- if an image fails to load, hide the broken image and retain text-only UI
- `score_logic_changed:false`

v0.15.57 global item-icon rules:

- exact verified surfaces: `#liveBuilds`, `#liveUtils`, `#randomLiveTopbar`, `#randomLiveSummary`, `#randomLiveBuildAdvice`, `#randomBuilds`, `#randomUtils`, `#randomThreatList`, `#dataCard`, `#historyMatchDetail`
- Live draft: core build tree, assigned utility item, and counter/utility recommendation column receive icons
- Random Practice legacy/live: next-item surfaces, owned items, full build/utility recommendations, and observed enemy inventory receive icons; current coach remains handled by v0.15.56
- Champion DB: Primary Build and alternate representative build lines receive compact icon strips
- Match Lab: recommended build direction receives icons; `.matchItems` actual final-item row already has Riot artwork and must not be duplicated
- cap recognized icon strips (normally <=6) to avoid clutter
- use exact known selectors and known item text surfaces; do not scan page-wide titles/body text heuristically
- image failure must retain existing text
- `score_logic_changed:false`

**The overall HUD layout is considered largely stabilized. Do not begin another major layout redesign unless the user explicitly asks.**

## Next planned phase

First validate v0.15.59 party-state labels in a real League champ-select session and validate purchase math/owned-item extraction in a real Live Client match before changing scoring or shop calculations.

After live validation, primary candidate: strengthen the statistical baseline with patch-level cached LOL.PS ARAM data.

Requirements:

- do not scrape LOL.PS repeatedly during a live match
- refresh/cache external statistics by patch or controlled update job
- show source and freshness clearly
- keep `통계 빌드` as reference and `이번 판 최적화` as the actionable recommendation
- only change purchase math after verifying real live inventory/recipe behavior

See `docs/AI_HANDOFF.md` and the latest changelogs before starting this phase.
