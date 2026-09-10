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
- Item-bearing UI should use **current Riot-client item art + short existing text**, never icon-only, and should avoid duplicating artwork already present in the base UI.

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

## Current Random Practice / item UI runtime contract — v0.15.60

Pick-side layers:

1. `update/v0.15.49/random-practice-focus-v01549.js`
2. `update/v0.15.55/random-pick-density-v01555.js`
3. `update/v0.15.58/random-party-picks-v01558.js`
4. `update/v0.15.59/random-party-labels-v01559.js`
5. `update/v0.15.60/ui-refresh-v01560.js` — final visible label override only; internal state stays distinct

In-game and item-visual layers:

1. `update/v0.15.50/random-ingame-coach-v01550.js`
2. `update/v0.15.51/random-ingame-ux-v01551.js`
3. `update/v0.15.52/random-ingame-ux-v01552.js`
4. `update/v0.15.53/random-ingame-shop-v01553.js`
5. `update/v0.15.54/random-ingame-shop-polish-v01554.js`
6. `update/v0.15.56/random-item-icons-v01556.js`
7. `update/v0.15.57/item-icons-global-v01557.js`
8. `update/v0.15.60/ui-refresh-v01560.js` — refreshes existing image elements to latest Riot-client artwork

Installed item-catalog filename remains `item-catalog-v01527.js`; active source is `update/v0.15.60/item-catalog-v01527.js`.

`v0.15.55` keeps rank 1 large while compacting ranks 2–5. `v0.15.56` adds item icons to the current coach. `v0.15.57` audits and extends the same visual language across verified item-bearing menus. `v0.15.58` adds AutoSync party-current-pick visibility and fixes the cramped composition-status layout. `v0.15.59` made manual-vs-AutoSync state visible. `v0.15.60` deliberately simplifies the visible wording again: both states display as `팀원픽`, while the internal manual-lock distinction remains intact.

v0.15.58–0.15.60 Random Practice pick rules:

- read party-held champions from observable AutoSync champ-select state (`party`, plus local-champion fallback)
- display current party champions in `#manualPartyInputs` as display-only current picks, but do not write them into `randomState.manual`
- explicit manual locks remain an internal user choice; current AutoSync picks stay swappable unless manually locked
- **visible UI wording is unified**: AutoSync-held and manually locked party rows both display `팀원픽`
- do not collapse the underlying distinction: manual locks still affect recommendation state, AutoSync current picks alone do not
- mark party-held candidates in `#poolInputs` with `팀원픽`; they remain recommendation candidates
- an existing `외부픽` remains excluded and takes precedence over `팀원픽`
- `#externalCheck` remains the full-width host; its child `.randomCheckGrid` owns the actual three-card desktop grid
- visible status copy is `현재 조합 체크` with `조합 보완 / 실질 딜 밸런스 · AD / AP / 추천 계산`
- old narrow slot badges remain hidden to avoid duplicate or clipped labels
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
- use current gold plus Data Dragon recipe metadata (`from`, `into`, `gold.base`, `gold.total`)
- account for already-owned components when they are observable from Live Context
- if real owned-component state cannot be confirmed, hide exact component-buy advice instead of risking duplicate purchases
- display immediate buy(s), purchase cost, leftover gold, final core target, and remaining core cost
- use `ko_KR` item catalog where available
- v0.15.60 does **not** replace Data Dragon recipe/price/map metadata with CommunityDragon data
- `score_logic_changed:false`; this layer does not alter recommendation/threat/item scoring

v0.15.56–0.15.57 item-icon rules:

- decorate existing exact item-bearing UI surfaces; keep names/prices visible
- icons supplement rather than replace text
- cap recognized icon strips (normally <=6) to avoid clutter
- no broad page-title/body-text UI discovery
- image failure must retain existing text
- Match Lab `.matchItems` actual final-item row already owns its image element and must not receive duplicate artwork
- `score_logic_changed:false`

v0.15.60 latest-item-art rules:

- recipe/price/ARAM-map metadata stays Data Dragon based
- current artwork metadata is read from CommunityDragon `latest`, which mirrors Riot client `lol-game-data` item metadata and `iconPath`
- do not describe CommunityDragon itself as an official Riot service; it is a mirror of Riot-client assets
- each catalog item exposes `iconUrl`; visual refresh prefers this latest Riot-client artwork
- versioned Data Dragon artwork remains the fallback if the latest mirror image cannot load
- refresh only known image surfaces: v0.15.56 item images, v0.15.57 item images, and existing Match Lab `#historyMatchDetail .matchItems img`
- do not create a second Match Lab final-item image row
- a failed latest-art request must not enter a retry loop; fall back once and retain text if both images fail
- `score_logic_changed:false`

**The overall HUD layout is considered largely stabilized. Do not begin another major layout redesign unless the user explicitly asks.**

## Next planned phase

First validate v0.15.60 in a real Windows/League session:

- confirm both manually entered and AutoSync party picks visibly say `팀원픽`
- confirm internal manual-lock behavior is unchanged
- confirm latest item art appears on actual item-bearing screens and falls back cleanly if the mirror is unavailable
- validate purchase math/owned-item extraction in a real Live Client death/shop state before changing shop calculations

After live validation, primary candidate: strengthen the statistical baseline with patch-level cached LOL.PS ARAM data.

Requirements:

- do not scrape LOL.PS repeatedly during a live match
- refresh/cache external statistics by patch or controlled update job
- show source and freshness clearly
- keep `통계 빌드` as reference and `이번 판 최적화` as the actionable recommendation
- only change purchase math after verifying real live inventory/recipe behavior

See `docs/AI_HANDOFF.md` and the latest changelogs before starting this phase.
