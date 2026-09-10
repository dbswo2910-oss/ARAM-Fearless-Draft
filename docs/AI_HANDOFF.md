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

- Active updater version: **v0.15.52**
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

- coach eyebrow now follows current version (`INGAME COACH · v0.15.52`)
- hide helper microcopy that does not change action (`행동 한 줄만 표시`, `이번 판 상황 보정`-type captions)
- interpret raw threat display such as `물리 · 84점` as `물리 · 위험 높음`; raw score remains available via tooltip/detail
- death header becomes simply `사망 분석` because the large respawn countdown already exists below
- redundant respawn explanatory middle text is hidden
- global Source footer is hidden only while Random Practice is in in-game mode
- recommendation/Threat/item/composition scoring remains unchanged (`score_logic_changed:false`)

**Treat the v0.15.52 overall HUD layout as largely locked.** Do not restart another large layout redesign unless the user explicitly asks. Future work should improve decision quality and purchase actions inside this hierarchy.

## Next in-game phase

The next planned functional enhancement is **death-time immediate purchase planning**:

`현재 골드 → 지금 구매 가능한 하위템 → 잔여 골드 → 최종 코어 목표`

Important design rules:

- completed-core recommendation and immediate component purchase are separate concepts
- death screen should answer “what do I buy right now?” before deeper analysis
- use the existing item catalog/tree and current gold where observable
- do not guess unavailable Live Client data
- statistical build remains a baseline/reference; current-match optimization remains primary
- later LOL.PS integration should be patch-level cached/refreshable data, not fragile live website scraping during a match

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

Do not remove earlier layers without intentionally consolidating and regression-testing their behavior.

## Verification workflow

Before saying a change is done:

1. Verify changes are on `main`.
2. Verify `update/manifest.json` points at intended version/files.
3. Verify main/package version consistency.
4. Run Full Regression Audit.
5. Confirm all historical forward-compatible in-game audits and the new feature audit succeed.
6. For layout changes, request a real Windows preview/screenshot; CI does not reproduce every DPI/font condition.

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

Do not restart established design decisions from scratch unless the user asks to change direction.
