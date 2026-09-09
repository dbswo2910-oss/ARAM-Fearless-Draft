# ARAM Fearless Draft — AI / Coding Agent Entry Point

Read this file before editing the repository.

## Current source of truth

1. `update/manifest.json` — active in-app update channel and current distributed runtime files.
2. `docs/INSTALLED_BASELINE_v0.15.49.md` — verified snapshot of the user's real Windows installation captured from `ARAM Fearless Draft AutoUpdate/appfiles`.
3. `reference/installed-v0.15.49/random-practice-pick-fragment.html` — exact installed DOM fragment for Random Practice pick mode.
4. `reference/installed-v0.15.49/random-practice-ingame-fragment.html` — exact installed DOM fragment for Random Practice in-game mode.
5. `docs/AI_HANDOFF.md` — architecture, recent decisions, UI philosophy, and work-in-progress context.
6. `update/v*/` — versioned patch sources. Older versions are historical; do not treat an old update directory as current just because it exists.

## Critical rules

- Never infer installed UI structure from screenshots alone when a baseline/DOM map is available.
- For UI patches, prefer exact IDs/classes from the installed baseline. Avoid broad text/regex DOM discovery that can accidentally capture parent panels. This caused the v0.15.48 Random Practice layout collapse.
- `index.html` is the large embedded base UI. The captured v0.15.49 file is 35,359,059 bytes, SHA-256 `8de7a8eb03e363b808439d48673a4808809d82db67bc1b7955e80414a8782906`. The full file is not committed because of size; exact important DOM fragments and hashes are preserved under `reference/installed-v0.15.49/` and `docs/`.
- The user's installed `appfiles/manifest.json` may be stale. For the captured v0.15.49 install, `main.js` and `package.json` are both v0.15.49 while the local appfiles manifest contains older metadata. Runtime version must be verified from `main.js` / `package.json` and active repository `update/manifest.json`.
- Keep app version, update manifest, package metadata, changelog/audit docs, README version references, and AI handoff notes synchronized when releasing a new version.
- Preserve recommendation/balance logic when a request is UI-only. Explicitly document whether scoring changed.
- Before reporting a GitHub update as complete, wait for Full Regression Audit and verify the relevant feature audit step is `success`.
- If a new real installed-app ZIP is provided, treat it as the newest baseline, create a new `docs/INSTALLED_BASELINE_vX.Y.Z.md` + `reference/installed-vX.Y.Z/` map, and update this file.

## Current product/UI direction

The product is being simplified around fast decisions rather than vertically stacking every detail.

- Draft: compact two-column workflow; pick judgment uses tabs rather than endlessly stacked cards.
- Pick judgment tabs: summary / risk detection / composition matchup.
- Risk system includes value, poke, dive, hard engage, catch/CC, frontline handling, sustain, and AoE teamfight risk.
- Random Practice pick: inputs first, TOP recommendations clearly prioritized, detailed analysis behind tabs/collapse controls.
- Random Practice in-game: **one-glance coach HUD**. During combat the user should need about 1–2 seconds to understand the next action.
- Recommendation engines should not repeatedly overreward a small set of champions through duplicated synergy signals; duo/route/structure overlap is intentionally damped.

## Random Practice exact installed IDs (v0.15.49 baseline)

Pick mode primary root and controls:

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

See both Random Practice fragments under `reference/installed-v0.15.49/` before changing layout.

## v0.15.50 in-game coach contract

`update/v0.15.50/random-ingame-coach-v01550.js` is a UI-only layer over the existing v0.15.9-era live engines embedded in `index.html`.

Visible hierarchy:

- 3 tabs only: `LIVE / 빌드 / 상세`
- AUTO state switch:
  - alive → LIVE
  - dead with meaningful respawn time → Build/analysis
  - respawn <= 7 seconds → LIVE preparation
- LIVE default information budget:
  - NOW CALL
  - highest threat
  - local role/action, one line
  - next purchase TOP1
  - current matchup + at most one critical warning
- Build view compares:
  - embedded champion DB `기본 트리` / `통계 기준`
  - current-match LIVE optimized TOP1 + alternatives
- Detail view contains secondary metrics behind collapsed sections.
- `🎮 인게임 미리보기` uses the same coach renderer with synthetic data. It must always show `PREVIEW · 실제 게임 데이터 아님`.

The v0.15.50 patch does **not** change recommendation scoring and does **not** live-crawl LOL.PS. Where the embedded item DB says `LOL.PS/MetaSRC` cross-validation, that source metadata may be displayed as the statistical baseline. A later source-refresh phase can automate external statistics separately.

## v0.15.51 screenshot-polish contract

`update/v0.15.51/random-ingame-ux-v01551.js` is a UI-only post-processing layer loaded immediately after the v0.15.50 coach renderer. It exists because the first real Windows preview screenshots revealed unnecessary visual competition.

Rules:

- in `data-random-mode="ingame"`, hide pick-stage stage headings/recommendation shells so the coach begins near the top of the page
- keep preview controls on a single desktop toolbar when space allows
- LIVE has three visible support cards only: `최고 위협 / 내 역할 / 다음 구매`
- `현재 구도` belongs to NOW CALL and must not be duplicated as a fourth card
- `내 역할` gets the widest support card because it often contains the longest actionable instruction
- death Build view puts `이번 판 최적화` before and visually above `통계 기본트리`
- statistical build stays visible as reference, not as the primary instruction
- `score_logic_changed:false`; do not change recommendation calculations in this layer

Current in-game work should normally read both v0.15.50 and v0.15.51 files before editing.
