# AI Handoff — ARAM Fearless Draft

This document is the durable project handoff for ChatGPT/Codex/other coding agents.

## Product

Windows Electron desktop app for League of Legends ARAM:

- Fearless draft / ban-pick assistant
- Random Practice for solo/party random-bench decisions
- Match Lab and player profiling
- Riot/League Client read-only AutoSync
- Live in-game analysis and item guidance

Repository: `dbswo2910-oss/ARAM-Fearless-Draft`

## Current verified baseline

- Active updater version at handoff: **v0.15.49**
- Balance/data patch tracked by project: **26.17**
- Real installed app snapshot supplied by the user from the AutoUpdate installation and verified on 2026-09-10.
- Installed runtime `main.js`: v0.15.49
- Installed runtime `package.json`: v0.15.49
- Installed `index.html`: 35,359,059 bytes, SHA-256 `8de7a8eb03e363b808439d48673a4808809d82db67bc1b7955e80414a8782906`

The full installed `index.html` is large and not stored directly in this repository. Exact important DOM fragments and a baseline inventory are preserved under `reference/installed-v0.15.49/`.

## Source-of-truth hierarchy

When sources disagree, use this order:

1. A newly supplied real installed-app snapshot from the user.
2. `update/manifest.json` for current in-app distribution.
3. `main.js` / `package.json` from the real installed snapshot for runtime version.
4. Versioned files under `update/v*/`.
5. README/changelogs/audits (documentation can lag).

Do **not** rely on the local installed `appfiles/manifest.json` for runtime version. In the captured install it is stale while `main.js` and `package.json` are current.

## Architecture

### Base UI

The application loads a large monolithic `index.html`. Much of the historical app logic/styles live there. Newer features are injected as runtime JS patches from `main.js` on `dom-ready`.

### Runtime patches

`main.js` loads a sequence of `*.js` feature patches. For a new version:

- create the new patch under `update/vX.Y.Z/`
- add it to the installed filename mapping in `update/manifest.json`
- inject it in `main.js` in a deterministic order
- add a readiness marker, usually `window.__ARAM_...__`
- add/update an audit script
- update the Full Regression Audit workflow
- wait for CI before declaring completion

### League Client bridge

`autosync-core.js` is the local read-only League Client bridge. Important behavior includes:

- League Client credential/lockfile discovery
- current summoner / Riot ID identity
- ARAM queue discrimination
- ChampSelect party/bench state
- in-game 10-player state and observable stats
- ARAM match history

Standard ARAM is queue 450. Mayhem/아수라장 is separated from standard ARAM for runtime draft/random analysis.

## Recent design/balance decisions

### v0.15.43 — synergy concentration damping

Problem: champions such as Yasuo, Orianna, Rumble and other highly connected synergy champions appeared too often because large duo bonuses stacked with route/structure bonuses.

Direction:

- do not hardcode only example champions
- damp excessive duo contribution globally
- reduce overlap when duo + 41-route/structure reward essentially the same teamfight property
- retain genuinely strong synergy, but prevent a few champions from monopolizing TOP recommendations

### v0.15.45 — stable Draft layout

Earlier incremental DOM moving created large blank areas and mismatched widths. The stable direction is independent left/right vertical flows rather than row height coupling.

### v0.15.46–47 — Pick Judgment

Pick Judgment was converted to a compact tabbed information area.

Tabs/concepts:

- Summary / quick judgment
- Risk detection
- Composition matchup/counter relationship

Risk categories:

- Value / scaling risk
- Poke risk
- Dive risk
- Strong engage risk
- Catch/CC risk
- Frontline/tank handling risk
- Sustain risk
- AoE/teamfight-chain risk

Important distinction: `high enemy risk` is not automatically `enemy composition counter`. Matchup analysis should be bidirectional: enemy threat vs our answer, and our threat vs enemy answer.

### v0.15.48 failure and v0.15.49 correction

v0.15.48 attempted to discover Random Practice panels heuristically by Korean titles/regex and then rearrange them. It captured incorrect parent containers. Result: extremely narrow columns and Korean text wrapping one character per line.

**Do not repeat this approach.**

v0.15.49 is based on the user's real installed `index.html` and exact IDs. For Random Practice UI work, use the exact DOM map in `reference/installed-v0.15.49/random-practice-pick-fragment.html`.

## UI philosophy

The user strongly prefers an operational dashboard, not a long report page.

- Show the most important decision first.
- Do not stack every detail vertically.
- Put secondary information behind tabs/collapse/detail buttons.
- Keep input blocks visually stable.
- Keep widths consistent between equivalent pick/ban/input sections.
- Recommendation reason text should be short in the default view; detailed scoring belongs behind a detail action.
- Use strong visual warnings only for genuinely high-priority risk, so red alert styling keeps meaning.

## Random Practice intended information hierarchy

1. Queue size / current party context
2. External fixed picks + manual party fixed picks
3. Remaining candidate pool (up to 15)
4. One-line `이번 선택의 핵심`
5. Completion recommendation TOP5
6. Lower analysis in tabs/collapsible views rather than long vertical stacking

Useful exact IDs are documented in `AGENTS.md` and the reference fragment.

## Verification workflow

Before saying a change is done:

1. Verify repository changes are on `main`.
2. Verify `update/manifest.json` points at the intended version/files.
3. Verify main/package version consistency.
4. Run Full Regression Audit.
5. Confirm the new feature-specific audit step succeeds.
6. For layout changes, request one real Windows screenshot after update because CI cannot reproduce every DPI/font/layout condition.

## When another AI takes over

Start with:

1. `AGENTS.md`
2. `update/manifest.json`
3. this file
4. `docs/INSTALLED_BASELINE_v0.15.49.md`
5. the version-specific patch involved in the user's request
6. the exact DOM reference if UI work is involved

Do not restart design decisions from scratch unless the user asks to change direction.
