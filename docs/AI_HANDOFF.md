# AI Handoff — ARAM Fearless Draft

Durable project handoff for ChatGPT/Codex/Claude/Gemini/other coding agents.

## Product

Windows Electron desktop app for League of Legends ARAM:

- Fearless draft / ban-pick assistant
- Random Practice for solo/party random-bench decisions
- Match Lab and player profiling
- Riot/League Client read-only AutoSync
- Live in-game analysis and item guidance

Repository: `dbswo2910-oss/ARAM-Fearless-Draft`

## Current versions

- Active updater version: **v0.15.57**
- Balance/data patch tracked by project: **26.17**
- Latest real installed snapshot supplied by the user: **v0.15.49** AutoUpdate/appfiles
- Installed baseline `index.html`: 35,359,059 bytes, SHA-256 `8de7a8eb03e363b808439d48673a4808809d82db67bc1b7955e80414a8782906`

The full installed `index.html` is large and not stored directly. Exact pick/in-game DOM fragments and baseline inventory are under `reference/installed-v0.15.49/` and `docs/INSTALLED_BASELINE_v0.15.49.md`.

## Source-of-truth hierarchy

When sources disagree:

1. A newly supplied real installed-app snapshot from the user.
2. `update/manifest.json` for current in-app distribution.
3. `main.js` / `package.json` from the real installed snapshot for installed runtime version.
4. Versioned files under `update/v*/`.
5. README/changelogs/audits.

Do not rely on installed `appfiles/manifest.json` for runtime version; it was stale in the captured v0.15.49 install.

## Architecture

The app loads a large monolithic `index.html`; newer features are injected as runtime JS patches by `main.js` on `dom-ready`.

For a new version:

- create patch under `update/vX.Y.Z/`
- add installed filename mapping to `update/manifest.json`
- inject it in `main.js` in deterministic order
- add readiness marker (`window.__ARAM_...__`)
- add/update audit script
- update Full Regression Audit workflow
- synchronize README/changelog/audit/agent docs
- wait for CI before declaring completion

`autosync-core.js` is a local read-only League Client bridge. Standard ARAM is queue 450; Mayhem/아수라장 is separate.

## Critical historical decisions

### v0.15.48 failure → v0.15.49 correction

v0.15.48 discovered Random Practice panels heuristically from Korean headings/regex and rearranged wrong parent containers. Result: near-zero-width columns and Korean text wrapping vertically.

Do not repeat this approach. Use exact DOM IDs from the user's installed baseline.

### v0.15.50 — In-game Coach HUD + Preview

Goal: transform the feature-rich in-game dashboard into a **one-glance operational coach**, not a report page.

Existing embedded live engines are preserved and reused, including:

- `randomLiveContext`
- `randomLiveThreatRows`
- `randomLiveNextItems`
- `randomLivePowerSnapshot`
- `randomLiveAliveSnapshot`
- `randomLiveFightPlan`
- `randomLiveLocalJob`

Visible coach is reduced to `LIVE / 빌드 / 상세`.

AUTO behavior:

- alive → LIVE combat mode
- dead with respawn > 7s → Build/analysis mode
- dead with respawn <= 7s → LIVE respawn-prep mode
- AUTO can be disabled by the user

Program-internal `🎮 인게임 미리보기` uses the same coach renderer with synthetic data and must clearly show `PREVIEW · 실제 게임 데이터 아님`.

### v0.15.51–v0.15.54 — screenshot-driven HUD stabilization

- hide pick-stage UI while in in-game mode
- compress preview controls
- support cards become `최고 위협 / 내 역할 / 다음 구매`
- current-match optimized death recommendation is primary; statistical build is secondary
- helper/duplicate text is removed
- death header is simplified
- current gold duplication and nested Source footer noise are removed
- recommendation/threat/item/composition scoring remains unchanged

Treat the v0.15.52+ overall HUD layout as largely locked unless the user explicitly requests a redesign.

### v0.15.53 — Death-time shop planner

The Build death view separates **final core recommendation** from **what to buy right now**.

Flow:

`현재 골드 → 이번 죽음에 살 부품 → 구매 후 잔여 골드 → 최종 코어 목표 → 코어까지 남은 골드`

Implementation:

- active frontend layer: `update/v0.15.53/random-ingame-shop-v01553.js`
- installed item-catalog filename remains `item-catalog-v01527.js`, but active manifest source is `update/v0.15.53/item-catalog-v01527.js`
- item catalog prefers Data Dragon `ko_KR` and keeps ARAM map 12 availability, purchasable state, `from`, `into`, `gold.base`, and `gold.total`
- recipe tree recursively consumes already-owned components when observable
- planner searches the affordable recipe frontier and chooses a spend-efficient set of independent components
- if a real LIVE state does not expose owned components reliably, exact component-buy advice is intentionally hidden to avoid duplicate-purchase guidance
- preview may show the planner with an explicit no-owned-items assumption
- scoring remains unchanged (`score_logic_changed:false`)

### v0.15.55 — Random Practice pick density

The user's real pick screenshot showed that TOP5 comparison still required too much scrolling. v0.15.55 keeps rank 1 as the visual hero while compressing ranks 2–5 and the external-pick status area. It also rewrites the focus summary into a more human-readable `추천 방향` sentence. Scoring remains unchanged.

### v0.15.56 — Official item icons in the current in-game coach

Goal: make item decisions recognizable before the text is fully read.

Implementation:

- active frontend layer: `update/v0.15.56/random-item-icons-v01556.js`
- reuses `window.aramDesktop.getItemCatalog()` and the catalog's exact Data Dragon version
- uses official Data Dragon item image path: `/cdn/<version>/img/item/<itemId>.png`
- decorates LIVE `다음 구매`, death `지금 살 것`, `이번 판 최적화`, final core target, and the statistical base tree
- icons supplement rather than replace text and price
- broken image loading is hidden so text-only UI remains usable
- `score_logic_changed:false`

### v0.15.57 — Full item-menu visual audit

The user requested a review of **every menu that uses items**, not just the current coach. We re-inspected the verified installed baseline and found several item-bearing user-facing surfaces that v0.15.56 did not decorate.

New active layer: `update/v0.15.57/item-icons-global-v01557.js`.

Verified coverage added:

- Live draft `#liveBuilds`: champion core build tree and assigned team-utility item
- Live draft `#liveUtils`: utility/counter recommendation item column
- Random Practice legacy/live surfaces: `#randomLiveTopbar`, `#randomLiveSummary`, `#randomLiveBuildAdvice`, `#randomBuilds`, `#randomUtils`
- Random Practice `#randomThreatList`: observed enemy inventory names receive compact item artwork
- Champion DB `#dataCard`: Primary Build and alternate representative build lines
- Match Lab `#historyMatchDetail`: recommended build direction

Match Lab `.matchItems` already renders actual final items with Riot/Data Dragon artwork in the base application, so v0.15.57 intentionally does not add a second icon layer there.

Global icon rules:

- exact known selectors only; do not discover panels by broad title/body text heuristics
- keep the existing text; artwork is supplementary
- cap icon strips (normally six or fewer) to avoid visual clutter
- hide failed images but retain text
- reuse v0.15.56 catalog when possible, otherwise the existing desktop item catalog
- no recommendation, purchase, threat, or scoring math changes (`score_logic_changed:false`)

Do not treat item icons as proof that live inventory extraction or recipe math is correct; real-match validation is still required.

## UI philosophy

The user strongly prefers an operational dashboard, not a long report page.

- Show the most important decision first.
- Living/active combat state should be readable in about 1–2 seconds.
- Do not stack every detail vertically.
- Secondary information belongs behind tabs/collapse/detail actions.
- Same information should not be repeated in multiple cards.
- Red styling is reserved for genuinely high-priority danger.
- Explanation text defaults to one line, at most two where unavoidable.
- Calculations can remain detailed internally while display stays concise.
- Dead time can expose more analysis because the user has time to read.
- For item decisions, prefer `official icon + short text` over icon-only or text-only presentation.
- Never duplicate existing artwork just to make a newer runtime own the rendering.

## Exact installed Random Practice contract

Baseline references:

- `reference/installed-v0.15.49/random-practice-pick-fragment.html`
- `reference/installed-v0.15.49/random-practice-ingame-fragment.html`

Important in-game base IDs:

- `#randomIngameShell`
- `#randomLiveTopbar`
- `#randomIngameSubnav`
- `#randomLiveSummary`
- `#randomLiveBuildAdvice`
- `#randomThreatList`
- `#randomFightGuide`
- `#randomTimingPanel`
- `#randomPowerCurve`

Current relevant runtime order:

1. `random-practice-focus-v01549.js`
2. `random-pick-density-v01555.js`
3. `random-ingame-coach-v01550.js`
4. `random-ingame-ux-v01551.js`
5. `random-ingame-ux-v01552.js`
6. `random-ingame-shop-v01553.js`
7. `random-ingame-shop-polish-v01554.js`
8. `random-item-icons-v01556.js`
9. `item-icons-global-v01557.js`

Do not remove earlier layers without intentionally consolidating and regression-testing their behavior.

## Next in-game phase

First priority is **real Windows/Live Client validation of the purchase planner**:

- confirm owned-item extraction shape in an actual game
- confirm no duplicate component recommendation
- verify the displayed remaining-core gold against the actual shop recipe
- verify official item icons load correctly in all newly decorated Electron surfaces
- add extractor aliases or recipe fixes only if live data proves they are needed

After that, the leading feature candidate is **patch-level cached LOL.PS ARAM statistics**:

- do not live-scrape the website every match
- collect/refresh by patch or controlled update job
- keep `통계 빌드` as the baseline/reference
- keep `이번 판 최적화` as the actionable live recommendation
- display source/freshness clearly

## Verification workflow

Before saying a change is done:

1. Verify changes are on `main`.
2. Verify `update/manifest.json` points at intended version/files.
3. Verify main/package version consistency.
4. Run Full Regression Audit.
5. Confirm all historical forward-compatible audits and the new feature audit succeed.
6. For layout/live-state changes, request a real Windows preview/screenshot; CI does not reproduce every DPI/font/Live Client condition.

## When another AI takes over

Start with:

1. `AGENTS.md`
2. `update/manifest.json`
3. this file
4. `docs/INSTALLED_BASELINE_v0.15.49.md`
5. both exact Random Practice DOM fragments under `reference/installed-v0.15.49/`
6. `update/v0.15.55/random-pick-density-v01555.js`
7. `update/v0.15.50/random-ingame-coach-v01550.js`
8. `update/v0.15.51/random-ingame-ux-v01551.js`
9. `update/v0.15.52/random-ingame-ux-v01552.js`
10. `update/v0.15.53/random-ingame-shop-v01553.js`
11. `update/v0.15.53/item-catalog-v01527.js`
12. `update/v0.15.54/random-ingame-shop-polish-v01554.js`
13. `update/v0.15.56/random-item-icons-v01556.js`
14. `update/v0.15.57/item-icons-global-v01557.js`

Do not restart established design decisions from scratch unless the user asks to change direction.
