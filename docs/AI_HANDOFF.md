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

- Active updater version: **v0.15.54**
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

### v0.15.51 — Screenshot-driven hierarchy polish

Based on the user's real Windows preview screenshots:

- hide pick-stage UI while in in-game mode
- compress preview controls into a desktop one-row toolbar
- remove duplicate current-situation card because NOW CALL already covers it
- support cards become `최고 위협 / 내 역할 / 다음 구매`
- give role/action the largest width
- make current-match optimized death recommendation primary and statistical build secondary

### v0.15.52 — HUD micro-polish / layout stabilization

Based on the second set of real Windows screenshots:

- hide helper microcopy that does not change action
- interpret raw threat score into danger labels in the default HUD
- death header becomes simply `사망 분석`
- redundant respawn explanatory copy is hidden
- global Source footer is intended to be hidden only in Random Practice in-game mode
- recommendation/Threat/item/composition scoring remains unchanged

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

### v0.15.54 — Real-screenshot shop cleanup

The first v0.15.53 Windows preview confirmed the overall shop hierarchy works, but exposed three display issues:

- current gold was shown twice: once in the death strip and again in the `지금 구매` card header
- the global Source footer was still visible because v0.15.52 only targeted a direct-child `.footer`, while the actual footer is nested
- two helper labels were longer than needed for a time-critical shop screen

v0.15.54 fixes those without changing any recommendation or purchase calculation:

- top death strip remains the single gold display
- shop header duplicate gold hidden
- `이번 죽음에 바로 살 것` → `지금 살 것`
- preview assumption shortened to `보유템 없음 가정`
- nested `.footer` hidden while Random Practice is in in-game mode
- `score_logic_changed:false`

Do not interpret this screenshot-only phase as proof that live inventory extraction or recipe cost math is correct. Those still need one real match validation.

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

## Exact installed Random Practice in-game contract

Baseline reference: `reference/installed-v0.15.49/random-practice-ingame-fragment.html`

Important base IDs:

- `#randomIngameShell`
- `#randomLiveTopbar`
- `#randomIngameSubnav`
- `#randomLiveSummary`
- `#randomLiveBuildAdvice`
- `#randomThreatList`
- `#randomFightGuide`
- `#randomTimingPanel`
- `#randomPowerCurve`

Current layered runtime order:

1. `random-practice-focus-v01549.js`
2. `random-ingame-coach-v01550.js`
3. `random-ingame-ux-v01551.js`
4. `random-ingame-ux-v01552.js`
5. `random-ingame-shop-v01553.js`
6. `random-ingame-shop-polish-v01554.js`

Do not remove earlier layers without intentionally consolidating and regression-testing their behavior.

## Next in-game phase

First priority is **real Windows/Live Client validation of the purchase planner**:

- confirm owned-item extraction shape in an actual game
- confirm no duplicate component recommendation
- verify the displayed remaining-core gold against the actual shop recipe
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
5. Confirm all historical forward-compatible in-game audits and the new feature audit succeed.
6. For layout/live-state changes, request a real Windows preview/screenshot; CI does not reproduce every DPI/font/Live Client condition.

## When another AI takes over

Start with:

1. `AGENTS.md`
2. `update/manifest.json`
3. this file
4. `docs/INSTALLED_BASELINE_v0.15.49.md`
5. both exact Random Practice DOM fragments under `reference/installed-v0.15.49/`
6. `update/v0.15.50/random-ingame-coach-v01550.js`
7. `update/v0.15.51/random-ingame-ux-v01551.js`
8. `update/v0.15.52/random-ingame-ux-v01552.js`
9. `update/v0.15.53/random-ingame-shop-v01553.js`
10. `update/v0.15.53/item-catalog-v01527.js`
11. `update/v0.15.54/random-ingame-shop-polish-v01554.js`

Do not restart established design decisions from scratch unless the user asks to change direction.
