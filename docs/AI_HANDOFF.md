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

- Active updater version: **v0.15.125**
- Balance/data patch tracked by project: **26.18**
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
- installed item-catalog filename remains `item-catalog-v01527.js`; as of v0.15.60 the active manifest source is `update/v0.15.60/item-catalog-v01527.js`
- Data Dragon still supplies `ko_KR` item names, ARAM map 12 availability, purchasable state, `from`, `into`, `gold.base`, and `gold.total`
- recipe tree recursively consumes already-owned components when observable
- planner searches the affordable recipe frontier and chooses a spend-efficient set of independent components
- if a real LIVE state does not expose owned components reliably, exact component-buy advice is intentionally hidden to avoid duplicate-purchase guidance
- preview may show the planner with an explicit no-owned-items assumption
- scoring remains unchanged (`score_logic_changed:false`)

### v0.15.55 — Random Practice pick density

The user's real pick screenshot showed that TOP5 comparison still required too much scrolling. v0.15.55 keeps rank 1 as the visual hero while compressing ranks 2–5 and the external-pick status area. It also rewrites the focus summary into a more human-readable `추천 방향` sentence. Scoring remains unchanged.

### v0.15.56 — Item icons in the current in-game coach

Goal: make item decisions recognizable before the text is fully read.

Implementation:

- active frontend layer: `update/v0.15.56/random-item-icons-v01556.js`
- reuses `window.aramDesktop.getItemCatalog()` and the catalog's Data Dragon version
- historical renderer builds versioned Data Dragon image URLs
- decorates LIVE `다음 구매`, death `지금 살 것`, `이번 판 최적화`, final core target, and the statistical base tree
- icons supplement rather than replace text and price
- broken image loading is hidden so text-only UI remains usable
- v0.15.60 refreshes these existing image elements to latest Riot-client artwork without changing this historical layer
- `score_logic_changed:false`

### v0.15.57 — Full item-menu visual audit

The user requested a review of **every menu that uses items**, not just the current coach. We re-inspected the verified installed baseline and found several item-bearing user-facing surfaces that v0.15.56 did not decorate.

Active layer: `update/v0.15.57/item-icons-global-v01557.js`.

Verified coverage added:

- Live draft `#liveBuilds`: champion core build tree and assigned team-utility item
- Live draft `#liveUtils`: utility/counter recommendation item column
- Random Practice legacy/live surfaces: `#randomLiveTopbar`, `#randomLiveSummary`, `#randomLiveBuildAdvice`, `#randomBuilds`, `#randomUtils`
- Random Practice `#randomThreatList`: observed enemy inventory names receive compact item artwork
- Champion DB `#dataCard`: Primary Build and alternate representative build lines
- Match Lab `#historyMatchDetail`: recommended build direction

Match Lab `.matchItems` already renders actual final items in the base application, so v0.15.57 intentionally does not add a second icon layer there.

Global icon rules:

- exact known selectors only; do not discover panels by broad title/body text heuristics
- keep the existing text; artwork is supplementary
- cap icon strips (normally six or fewer) to avoid clutter
- hide failed images but retain text
- no recommendation, purchase, threat, or scoring math changes (`score_logic_changed:false`)

Do not treat item icons as proof that live inventory extraction or recipe math is correct; real-match validation is still required.

### v0.15.58 — Random Practice party picks + composition status

The user asked for current party-held champions to be visible without turning them into forced manual locks, and for the cramped composition-status cards to be cleaned up.

Active layer: `update/v0.15.58/random-party-picks-v01558.js`.

Rules:

- uses exact `#manualPartyInputs`, `#poolInputs`, and `#externalCheck` selectors
- reads current party champions from observable champ-select AutoSync state (`party`, with local-champion fallback)
- current party picks appear in the manual-party rows as **display-only current picks**; they are not written into `randomState.manual`
- users may still explicitly lock only the party picks they want to preserve; leaving a current pick unlocked keeps swap recommendations possible
- a party-held champion in the candidate pool receives `팀원픽` and remains a recommendation candidate
- `외부픽` remains an exclusion and takes precedence over `팀원픽`
- v0.15.55 had placed a three-column grid on `#externalCheck` even though its only child `.randomCheckGrid` was itself a three-column grid; v0.15.58 makes the parent full-width and lets `.randomCheckGrid` own the actual columns
- status copy is `현재 조합 체크`, `조합 보완`, `실질 딜 밸런스 · AD / AP`, and `추천 계산`
- missing functions render as compact chips instead of narrow vertical text
- `score_logic_changed:false`

### v0.15.59 — Visible party-state labels

The first post-v0.15.58 Windows screenshot showed that the narrow slot-side lock badge was not visually obvious.

Active layer: `update/v0.15.59/random-party-labels-v01559.js`.

Historical v0.15.59 behavior:

- consume `rpPartySyncedV01558` and `rpManualLockedV01558` instead of reimplementing AutoSync logic
- AutoSync current pick → blue `팀원픽`
- explicit program/manual lock → green `수동고정`
- render the state pill inside the row's `.searchWrap`
- hide old narrow slot badges
- `score_logic_changed:false`

v0.15.60 intentionally overrides only the **visible wording/style** of the manual pill. Do not delete v0.15.59's internal distinction without redesigning the lock semantics.

### v0.15.60 — Unified party wording + latest item artwork

The user decided that manual-vs-AutoSync origin does not need to be visible: both represent a champion being used by the party. They also noticed that the versioned Data Dragon images looked older than current client item artwork.

Active visual layer: `update/v0.15.60/ui-refresh-v01560.js`.
Updated stable catalog source: `update/v0.15.60/item-catalog-v01527.js`.

Party-label rules:

- AutoSync-held and manually locked party rows both **display `팀원픽`**
- the underlying states remain different: manual input still locks recommendation state; AutoSync current-pick display alone does not
- v0.15.60 achieves this as a visual override on the existing v0.15.59 pill, not by rewriting `randomState.manual`
- candidate-pool `팀원픽` behavior remains owned by v0.15.58
- `score_logic_changed:false`

Latest-item-art rules:

- Data Dragon remains the source of recipe/price/ARAM-map metadata used by the shop planner
- the catalog additionally fetches CommunityDragon `latest` Riot-client `lol-game-data` item metadata and maps current `iconPath` to an `iconUrl`
- CommunityDragon is **not** an official Riot service; describe it accurately as a mirror of Riot-client assets
- v0.15.60 refreshes the image elements already created by v0.15.56 and v0.15.57 rather than duplicating them
- it also refreshes the existing Match Lab final-item images in `#historyMatchDetail .matchItems img`
- if the latest mirrored image fails, fall back once to the versioned Data Dragon image; if that also fails, hide only the image and retain the surrounding text/ID fallback
- failed latest-art requests are marked so MutationObserver/interval refresh cannot create a retry loop
- no recommendation, purchase, threat, or composition scoring changes

CI/source auditing validates wiring and fallbacks only. Real Windows rendering and remote image network behavior still require a real post-update screenshot.

### v0.15.61 — Real-Windows party-label follow-up

The user's real v0.15.60 Windows screenshot showed a manually entered party champion in `#manualPartyInputs` with **no visible `팀원픽` pill**. v0.15.61 therefore directly created that pill from active party-row state instead of relying on a pre-existing v0.15.59 pill. Internal manual-lock semantics and scoring were preserved.

### v0.15.62 — Correct `팀원픽` display location

The next real Windows screenshot clarified that the user's intended location was **not inside the left `우리 파티 챔피언` input**. The desired location is the right-side `남은 랜덤 챔피언` candidate slot, matching where `외부픽` is shown.

New active layer: `update/v0.15.62/random-party-pool-labels-v01562.js`.

Rules:

- hide the v0.15.61 inline `.rpPartyLabelV01561` in `#manualPartyInputs`
- keep the left area focused on which champions the party currently has and which are manually locked
- build the visual team-pick set from both explicit `randomState.manual` locks and v0.15.58 AutoSync-displayed rows (`rpPartySyncedV01558`)
- in `#poolInputs`, show `팀원픽` in the candidate `.slot` beneath/beside its number, visually matching the existing `외부픽` position
- do not duplicate the historical v0.15.58 pool badge if it already exists for an AutoSync-held champion
- if `.randomPoolTakenBadge` is present, `외부픽` wins and no `팀원픽` badge is added
- party-marked candidates remain eligible for recommendation unless excluded by another rule
- `score_logic_changed:false`

This is a screenshot-driven display-location correction only. It does not change candidate eligibility, TOP5 scoring, composition scoring, manual-lock semantics, or item logic.

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
- For item decisions, prefer `current Riot-client icon art + short text` over icon-only or text-only presentation.
- Never duplicate existing artwork just to make a newer runtime own the rendering.

## Exact installed Random Practice contract

Baseline references:

- `reference/installed-v0.15.49/random-practice-pick-fragment.html`
- `reference/installed-v0.15.49/random-practice-ingame-fragment.html`

Important pick IDs:

- `#random`
- `#externalInputs`
- `#externalCheck`
- `#manualPartyInputs`
- `#poolInputs`
- `#comboResults`

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
3. `random-party-picks-v01558.js`
4. `random-party-labels-v01559.js`
5. `random-ingame-coach-v01550.js`
6. `random-ingame-ux-v01551.js`
7. `random-ingame-ux-v01552.js`
8. `random-ingame-shop-v01553.js`
9. `random-ingame-shop-polish-v01554.js`
10. `random-item-icons-v01556.js`
11. `item-icons-global-v01557.js`
12. `ui-refresh-v01560.js`
13. `random-party-label-fix-v01561.js`
14. `random-party-pool-labels-v01562.js`

Do not remove earlier layers without intentionally consolidating and regression-testing their behavior.

## Next in-game phase

First priority is **real Windows/League Client validation**:

- confirm the left `우리 파티 챔피언` input no longer shows the redundant inline `팀원픽` pill
- confirm a manually locked champion such as the screenshot's 마오카이 shows `팀원픽` in its right-side `남은 랜덤 챔피언` slot
- confirm AutoSync-held party champions receive the same right-side pool badge
- confirm an existing `외부픽` takes precedence without duplicate labels
- confirm manual inputs remain true locks while AutoSync current picks remain display-only/swappable
- confirm the full-width composition-status strip remains visually clean at the user's actual DPI/window width
- confirm latest item artwork appears on the v0.15.56/v0.15.57 surfaces and Match Lab final-item row
- confirm Data Dragon fallback still renders if the latest mirror is unavailable
- in an actual game, confirm owned-item extraction shape and death-shop recipe behavior
- confirm no duplicate component recommendation
- verify the displayed remaining-core gold against the actual shop recipe

After that, the leading feature candidate remains **patch-level cached LOL.PS ARAM statistics**:

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
6. For layout/live-state/remote-art changes, request a real Windows preview/screenshot; CI does not reproduce every DPI/font/Live Client/network condition.

## When another AI takes over

Start with:

1. `AGENTS.md`
2. `update/manifest.json`
3. this file
4. `docs/INSTALLED_BASELINE_v0.15.49.md`
5. both exact Random Practice DOM fragments under `reference/installed-v0.15.49/`
6. `update/v0.15.55/random-pick-density-v01555.js`
7. `update/v0.15.58/random-party-picks-v01558.js`
8. `update/v0.15.59/random-party-labels-v01559.js`
9. `update/v0.15.60/ui-refresh-v01560.js`
10. `update/v0.15.61/random-party-label-fix-v01561.js`
11. `update/v0.15.62/random-party-pool-labels-v01562.js`
12. `update/v0.15.50/random-ingame-coach-v01550.js`
13. `update/v0.15.51/random-ingame-ux-v01551.js`
14. `update/v0.15.52/random-ingame-ux-v01552.js`
15. `update/v0.15.53/random-ingame-shop-v01553.js`
16. `update/v0.15.60/item-catalog-v01527.js`
17. `update/v0.15.54/random-ingame-shop-polish-v01554.js`
18. `update/v0.15.56/random-item-icons-v01556.js`
19. `update/v0.15.57/item-icons-global-v01557.js`
20. `tools/v01560-audit.js`
21. `tools/v01561-audit.js`
22. `tools/v01562-audit.js`

Do not restart established design decisions from scratch unless the user asks to change direction.

### v0.15.107 — DATA/RANDOM view boundary repair

The v0.15.103 Data layout helper used a document-wide `.panel` + Korean-title search. v0.15.107 supersedes that ownership with view-scoped discovery rooted at exact `#dataCard`, removes legacy cross-view layout classes, makes Patch Notes own the Data workspace, and rebuilds Random Practice pick layout only from exact installed IDs (`#externalInputs`, `#poolInputs`, `#comboResults`, `#comboDetail`, `#rpPickIntelV01589`). Do not reintroduce document-wide panel discovery. Scoring remains unchanged.

### v0.15.108 — DATA Patch Mode hardfix

The screenshot-confirmed v0.15.107 failure was caused by relying on a direct-child layout assumption and a single patch-mode signal. v0.15.108 detects Patch Notes from visible and hidden tabs, the v0.15.99 card class, and actual patch-note visibility, then marks and hides the real tier branch using descendant-safe selectors. Random Practice also hides foreign Data nodes and their empty branches. `score_logic_changed:false`.

### v0.15.109 — Screenshot UI polish

The v0.15.108 screenshots confirm that DATA/RANDOM view ownership is fixed. v0.15.109 only cleans remaining visual artifacts: the Patch Notes outer header no longer says `챔피언 상세`, the visible Patch Companion label no longer exposes the old v0.15.99 module version, and RANDOM candidate DNA bars / AD-AP split / compact intel typography are restored with exact scoped selectors. `score_logic_changed:false`.

### v0.15.110 — Patch Notes champion density

Screenshot-confirmed hotfix for oversized Patch Notes champion portraits. The repair is strictly scoped to `#dataPatchNotesV01599 #dh99ChampionGrid`, force-locks portraits to 46×46 px, uses a denser responsive grid, and preserves DATA tier cards, RANDOM Practice, recommendation/scoring/item logic, v0.15.109 polish, and the v0.15.79 safety lineage. `score_logic_changed:false`.

### v0.15.111 — RANDOM DNA right-rail repair

Screenshot-confirmed fix for the selected-composition detail + Combination DNA rail being squeezed into tiny side-by-side columns. The rail now uses width-aware `auto-fit/minmax(260px, 1fr)` so a narrow third column stacks vertically while a genuinely wide row can use two columns. Korean detail text wrapping is restored. Recommendation/scoring/item logic is unchanged and v0.15.79 safety lineage is preserved. `score_logic_changed:false`.

### v0.15.112 — RANDOM workspace stability

Screenshot + video confirmed three related defects: PICK surfaces could remain visible in IN GAME because later `display:grid!important` layout rules outranked the base mode hide; v0.15.107/v0.15.111 repaired the PICK DOM after first paint, causing a visible two-column-to-stacked jump; and the intended PICK redesign was not materially visible. v0.15.112 fixes all three using only verified exact IDs. It hard-isolates `.randomPickOnly` from `data-random-mode="ingame"`, pre-assembles `#externalInputs`, `#poolInputs`, `#comboResults`, `#comboDetail`, and `#rpPickIntelV01589` into stable legacy-compatible wrappers before paint, and locks the decision rail to one readable column. Recommendation/scoring/item logic and DATA are unchanged. `score_logic_changed:false`.

### v0.15.113 — RANDOM readability hotfix

Screenshot after v0.15.112 proved that the three-column PICK layout still allowed the decision rail to become microscopic in the real Electron viewport. v0.15.113 removes that failure mode instead of trying another narrow-rail tweak: the outer PICK workbench is always two columns on desktop (team input + main work area), and Combination DNA / selected-composition detail live below the main column with full usable width. The v0.15.111 rail CSS is explicitly neutralized while its compatibility classes are retained. PICK/IN GAME isolation and v0.15.79 safety lineage remain intact. Recommendation/scoring logic is unchanged. `score_logic_changed:false`.

### v0.15.114 — RANDOM PICK integrity repair

Real Electron verification of v0.15.113 still showed clipped tier grades, polluted repeated candidate names, and a candidate label that changed while the DNA bars remained static. v0.15.114 moves the repair into the actual Random Practice lifecycle owner (`random-practice-focus-v01549.js`) instead of mounting from unrelated shell scripts. TOP5 labels prefer `randomState.combos[index].sel`, DNA prefers the selected engine combo `structure` / `parts`, and old `.rp107Right/.rp112Right` wrappers are retained only as compatibility containers forced below the main column at readable width. Grade tokens are constrained inside their pool items. Ranking/scoring, items, DATA, and PICK/IN GAME logic are unchanged. `score_logic_changed:false`, `random_scoring_changed:false`.

### v0.15.115 — Single-owner UI stability baseline

This release intentionally resets the late UI overlay lineage. Renderer source patching for RANDOM/DATA-sensitive targets branches from `runtime-source-stability-v015100` rather than chaining through v0.15.103-v0.15.114. RANDOM PICK layout + selection/DNA therefore remain owned by the proven v0.15.90/v0.15.100 transformed `random-practice-focus-v01549.js`. The only new global UI layer is `ui-stability-baseline-v015115.js`, injected once through `input-interaction-stability-v01539.js`; it does not reparent RANDOM nodes. DATA boundary, top nav, patch-note density and diagnostics are consolidated there. Retired late repair scripts are removed from the active manifest and deleted on update. Future UI work must extend or atomically replace the active owner; do not add click/change/input delayed reparent loops. `score_logic_changed:false`, `random_scoring_changed:false`.

### v0.15.116 — Runtime / update integrity stability

This release hardens the infrastructure below the UI without adding another renderer owner. The v0.15.79 update transaction/rollback baseline remains the root, but probation now re-checks current-boot safety failures before committing. `runtime-loader-v01579.js` preserves per-script isolation and adds a final critical readiness gate; missing core runtime owners are persisted as `SAFE-RT116` and written to `diagnostics/runtime-readiness-v015116.json`. The updater transform now validates manifest uniqueness, install/delete conflicts, safe sources, optional SHA-256 format, and critical-file deletion before staging. The v0.15.115 RANDOM/DATA single-owner architecture is preserved exactly. `score_logic_changed:false`, `random_scoring_changed:false`.

### v0.15.117 — Persistent state integrity

This release is infrastructure-only. `state-integrity-v015117.js` provides bounded atomic JSON writes, validated backup recovery, quarantine, and last-known-good protection. `state-integrity-renderer-v015117.js` mirrors app-owned `aram_` localStorage keys to the preload-backed state store, validates known schemas, tombstones intentional deletes, and restores malformed/missing state when a valid mirror exists. Riot Grade history is guarded through a wrapper around the unchanged v0.15.32 collector. The v0.15.115 RANDOM/DATA UI owner and v0.15.116 updater/rollback baseline remain intact. `score_logic_changed:false`, `random_scoring_changed:false`.

### v0.15.118 — Resource lifecycle stability

This release is infrastructure-only. Runtime source transformation adds explicit lifecycle disposal to Random Practice, Random IN GAME, and renderer AutoSync without adding another UI owner. Random IN GAME one-shot ticks are coalesced and its permanent 1-second interval is replaced by an adaptive timeout heartbeat that backs off while inactive/hidden. Random Practice owns and disconnects its long-task observer; AutoSync follow-up polls are coalesced. `resource-lifecycle-v015118.js` provides a no-polling aggregate snapshot/dispose surface, and runtime readiness requires the lifecycle owner/disposers. v0.15.115 UI ownership, v0.15.117 state integrity, and scoring remain unchanged.

### v0.15.119 — AutoSync concurrency stability

This release stabilizes asynchronous League/LCU/Live Client work without adding a UI owner. `autosync-concurrency-v015119.js` wraps the existing v0.15.71 main-process AutoSync patch before the historical main chain compiles: core ticks are single-flight, the scheduler is one timeout chain with bounded failure backoff, request-equivalent identity/credential/gameflow/Live Client calls are coalesced, and credential rotation advances a connection epoch and invalidates short caches. The renderer keeps the v0.15.118 lifecycle owner and adds a request/lifecycle epoch guard so a completion after disposal or replacement cannot fan out stale state. Scoring and recommendation logic are unchanged.

### v0.15.120 — DATA Patch Notes submenu restore

The existing `ui-stability-v015115` DATA owner remains authoritative. v0.15.120 is a maintained owner revision, not a new overlay. DATA host discovery resolves the role-tier panel and exact `#dataCard` from their nearest shared ancestor inside exact `#data`; `#dataHubTopNavV015115` lives inside that common host and spans the workspace. Patch Notes hides the tier branch while the detail branch spans the workspace. v0.15.117 state-integrity and v0.15.118 lifecycle payloads are preserved. RANDOM, Riot grades, history sync, AutoSync and scoring are unchanged. Final visual acceptance requires a post-v0.15.120 Windows screenshot.

### v0.15.121 — RANDOM Practice restore

RANDOM Practice keeps the v0.15.100 PICK DOM/selection owner and the v0.15.115 single-owner UI boundary. The v0.15.72 Random Practice coordinator is revised in-place by the v0.15.121 runtime transform: view entry restores the existing input/TOP5/detail output from current state, click/change/input refresh work is coalesced through the existing maintenance timer, event listeners have one explicit owner and are removed by the v0.15.118 disposer, and the cooperative exhaustive TOP5 path remains the only combo calculator. No MutationObserver, interval repair loop, late DOM reparent owner, or scoring change is introduced. Real-Windows acceptance remains required for final visual/interaction sign-off.

### v0.15.122 — Riot Grade accuracy

The Riot Grade collector is authoritative only when the LCU value comes from the direct local-player ChampionMasteryUpdate. The collector must not recursively consume `memberGrades`; those are other members' grade rows. Authoritative records use `gradeProvenance: riot-primary-update`. Match-detail and calibration linkage requires exact local account + gameId + championId. Records captured by v0.15.121 and earlier are migrated to `legacy-unverified-v015121` and excluded from authoritative display/calibration until replaced by a new primary record. Never synthesize or infer a Riot S/A/B grade when no authoritative row exists. ROLE/recommendation/Random scoring is unchanged.

### v0.15.123 — Startup Patch Notes notice

Startup Patch Notes announcement is a one-shot presentation feature injected into the existing input-interaction runtime before the v0.15.117 state-integrity suffix. It reads the registered Patch Notes version from `window.aramDataHubV01599.patch.version`, compares it with the exact version stored in `aram.patchNotes.notice.dismissedVersion.v1`, and shows the modal only when they differ. `패치노트 보러가기` routes through the existing `ui-stability-v015115` DATA owner using `syncData('patch')`; it does not create another DATA owner. Only the explicit `다시 보지 않기` action stores dismissal. A future Patch Notes version therefore becomes eligible automatically. No scoring/RANDOM/Riot Grade/AutoSync logic changes.

### v0.15.124 — Startup successor-route recovery hotfix

v0.15.123 could crash before Electron UI creation because its main successor wrapper exact-matched an escaped nested route string that did not exist in the installed predecessor source. v0.15.124 boots from the known-good `main-v015122.js`, applies a tested unique route-fragment transform to v0.15.124, and keeps the v0.15.123 Patch Notes behavior through `runtime-source-stability-v015124 -> v015123`. The audit executes the exact transform against the real v0.15.122 predecessor source; syntax-only checking is no longer considered sufficient for successor main wrappers.

### v0.15.125 — ARAM statistical build cache

RANDOM in-game `통계 사이트 기본 빌드` no longer trusts the old embedded champion `item[기본 트리]` as its primary source. `tools/aram-build-stats-refresh.js` collects all standard-ARAM champions from the OP.GG structured ARAM endpoint, resolves current item IDs through Riot Data Dragon, and writes `data/aram-builds/current.json`. The initial 26.18 cache contains 173 champions and excludes ARAM Mayhem. At runtime, `random-ingame-coach-v01550.js` is patched only at `statBuildFor`: it uses the bundled cache synchronously and performs at most one non-blocking fetch of the repository cache per app session, then falls back to the historical embedded DB if validation fails. The v0.15.81 current-match item engine still consumes the statistical tree as a baseline, so item recommendations benefit from corrected current ARAM cores without changing RANDOM champion/composition score.
