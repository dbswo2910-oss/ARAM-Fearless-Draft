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

- Active updater version: **v0.15.50**
- Balance/data patch tracked by project: **26.17**
- Latest real installed snapshot supplied by the user: **v0.15.49** AutoUpdate/appfiles
- Installed baseline `index.html`: 35,359,059 bytes, SHA-256 `8de7a8eb03e363b808439d48673a4808809d82db67bc1b7955e80414a8782906`

The full installed `index.html` is large and not stored directly. Exact pick/in-game DOM fragments and baseline inventory are under `reference/installed-v0.15.49/` and `docs/INSTALLED_BASELINE_v0.15.49.md`.

## Source-of-truth hierarchy

When sources disagree:

1. A newly supplied real installed-app snapshot from the user.
2. `update/manifest.json` for current in-app distribution.
3. `main.js` / `package.json` from the real installed snapshot for the installed runtime version.
4. Versioned files under `update/v*/`.
5. README/changelogs/audits.

Do not rely on installed `appfiles/manifest.json` for runtime version; it was stale in the v0.15.49 captured install.

## Architecture

### Base UI

The app loads a large monolithic `index.html`. Historical UI/logic live there. Newer features are injected as runtime JS patches from `main.js` on `dom-ready`.

### Runtime patches

For a new version:

- create patch under `update/vX.Y.Z/`
- add installed filename mapping to `update/manifest.json`
- inject it in `main.js` in deterministic order
- add a readiness marker (`window.__ARAM_...__`)
- add/update an audit script
- update Full Regression Audit workflow
- synchronize README/changelog/audit/agent docs
- wait for CI before declaring completion

### League Client bridge

`autosync-core.js` is a local read-only League Client bridge. Important behavior:

- credential/lockfile discovery
- current summoner / Riot ID identity
- ARAM queue discrimination
- ChampSelect party/bench state
- in-game 10-player state and observable stats
- ARAM match history

Standard ARAM is queue 450. Mayhem/아수라장 is separated from standard ARAM.

## Recent design/balance decisions

### v0.15.43 — synergy concentration damping

Highly connected synergy champions could appear too often because large duo bonuses stacked with route/structure bonuses. Direction: global diminishing/overlap control, not champion-specific hardcoding.

### v0.15.45 — stable Draft layout

Independent left/right vertical flows are preferred. Avoid row-height coupling and aggressive DOM moving.

### v0.15.46–47 — Pick Judgment

Compact tabbed information area: Summary / Risk detection / Composition matchup. High enemy risk is not automatically enemy composition counter; matchup analysis is bidirectional.

### v0.15.48 failure and v0.15.49 correction

v0.15.48 discovered Random Practice panels heuristically from Korean headings/regex and rearranged wrong parent containers. Result: narrow columns and Korean text wrapping one character per line.

Do not repeat this approach. v0.15.49 uses exact DOM IDs from the user's real installed `index.html`.

### v0.15.50 — In-game Coach HUD + Preview (Phase 1)

Goal: turn the existing feature-rich in-game dashboard into a **one-glance operational coach**, not a report page.

Existing embedded live engines are preserved and reused:

- `randomLiveContext`
- `randomLiveThreatRows`
- `randomLiveNextItems`
- `randomLivePowerSnapshot`
- `randomLiveAliveSnapshot`
- `randomLiveFightPlan`
- `randomLiveLocalJob`

The old visible dashboard had 5 tabs (`라이브 요약 / 아이템 / 위협 분석 / 한타 가이드 / 파워·타이밍`) plus duplicated topbar metrics. v0.15.50 hides that legacy shell visually and presents 3 tabs:

- `LIVE`
- `빌드`
- `상세`

AUTO life-state behavior:

- alive → LIVE combat mode
- dead with respawn > 7s → Build/analysis mode
- dead with respawn <= 7s → LIVE respawn-prep mode
- user can turn AUTO off and manually stay on a tab

LIVE default information budget:

1. NOW CALL / current fight decision
2. highest threat
3. local role/action in one short line
4. next purchase TOP1
5. current matchup + at most one critical warning

Secondary numbers such as average item value/average level are not shown in the combat default view. They remain under Detail.

### Preview design rule

Random Practice now gets `🎮 인게임 미리보기`.

Preview state/scenario controls:

- alive / dead 23s / respawn 5s
- even / numbers advantage / numbers disadvantage / enemy carry fed
- tank / ADC / mage / support / bruiser

Important: preview uses the **same coach renderer** as actual LIVE. It must always show `PREVIEW · 실제 게임 데이터 아님`. If a real ARAM live context appears while preview is active, preview yields to real LIVE data.

### Item presentation in v0.15.50

The item view compares:

- **통계 기본트리**: embedded champion DB `기본 트리` + `통계 기준`
- **이번 판 최적화**: existing LIVE item engine TOP1 + alternatives

The embedded DB already contains source metadata such as `26.17 ARAM · MetaSRC + LOL.PS 교차` for many champions. v0.15.50 may display this metadata, but it does **not** crawl/fetch LOL.PS live during a match.

Future item-statistics phase can automate a cached external-statistics refresh separately. Do not make in-game rendering depend on fragile live website scraping.

## UI philosophy

The user strongly prefers an operational dashboard, not a long report page.

- Show the most important decision first.
- Living/active combat state should be readable in about 1–2 seconds.
- Do not stack every detail vertically.
- Secondary information belongs behind tabs/collapse/detail actions.
- Same information should not be repeated in multiple cards.
- Red styling is reserved for genuinely high-priority danger.
- Explanation text defaults to one line, at most two where unavoidable.
- Calculations may stay detailed internally while display is concise.
- Dead time can expose more analysis because the user has time to read.

## Random Practice intended hierarchy

### Pick mode

1. Queue size / party context
2. External fixed picks + manual party fixed picks
3. Candidate pool up to 15
4. `이번 선택의 핵심`
5. Completion recommendation TOP5
6. Lower analysis behind tabs/collapse

### In-game mode

Alive:

1. NOW CALL
2. highest threat
3. my action/role
4. next purchase
5. one important warning if needed

Dead:

1. respawn time + current gold
2. statistical base build vs current-match optimized build
3. TOP1 + alternatives
4. next-fight action line
5. more detail only on request

Respawn <= 7s:

1. respawn countdown
2. next-fight action
3. highest threat / one warning

## Verification workflow

Before saying a change is done:

1. Verify changes are on `main`.
2. Verify `update/manifest.json` points at intended version/files.
3. Verify main/package version consistency.
4. Run Full Regression Audit.
5. Confirm the new feature-specific audit step succeeds.
6. For layout changes, request one real Windows preview/screenshot after update; CI cannot reproduce every DPI/font/layout condition.

## When another AI takes over

Start with:

1. `AGENTS.md`
2. `update/manifest.json`
3. this file
4. `docs/INSTALLED_BASELINE_v0.15.49.md`
5. `reference/installed-v0.15.49/random-practice-pick-fragment.html`
6. `reference/installed-v0.15.49/random-practice-ingame-fragment.html`
7. current version-specific patch (`update/v0.15.50/random-ingame-coach-v01550.js` for current in-game work)

Do not restart design decisions from scratch unless the user asks to change direction.
