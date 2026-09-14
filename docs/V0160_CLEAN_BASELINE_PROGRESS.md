# v0.16.0 CLEAN BASELINE — DURABLE PROGRESS / NEW-CHAT HANDOFF

> This file exists so a fresh ChatGPT/Codex session can continue the v0.16.0 stabilization program without relying on chat memory. Repository evidence wins over this file if anything conflicts.

## Read first in a fresh session

1. `AGENTS.md`
2. `docs/CURRENT_STATE.md`
3. `update/current-state.json`
4. `update/manifest.json`
5. `docs/KNOWN_ISSUES.md`
6. **this file**
7. Issue **#83** and Draft PR **#84**
8. latest PR head + `v0.16.0 Stability Foundation`, `Full Regression Audit`, `AI Continuity Audit`

## Safety boundary

- Production `main` remains the real-Windows-verified **v0.15.135 Golden Baseline**.
- Golden commit: `2048d56ceec2317b4cef225f284443521005994d`.
- Stabilization branch: `stability/v0160-clean-baseline-phaseb`.
- Tracking issue: `#83`.
- Draft consolidation PR: `#84`.
- Do **not** merge/cut over canonical owners merely because synthetic CI is green.
- Preserve `aram-fearless-draft` userData identity, `aram-rating-research-v03`, `checkpoint-v03`, v0.15.79 updater safety, v0.15.117 state semantics, v0.15.118 lifecycle semantics, and v0.15.119 AutoSync concurrency semantics.
- No intended Draft/RANDOM/ROLE/item scoring changes during stabilization.

## Last fully verified checkpoint

PR #84 head **`f9e9fd2d6e12bf2bfcc9b97bdb30f7bf952e33ff`** was fully green for:

- `v0.16.0 Stability Foundation` **run #304** — SUCCESS, including Windows Electron synthetic E2E
- `Full Regression Audit` **run #879** — SUCCESS
- `AI Continuity Audit` **run #294** — SUCCESS

The immediately preceding code checkpoint `a9a58619e7ec0208295824a428e73a3009519876` introduced the latest Item catalog-service gate; `f9e9fd2...` only updates durable project handoff documentation and confirms the complete suite remains green.

The verified suite includes:

- Item identity/recommendation parity
- Item art resolver/catalog bridge parity
- lifecycle-safe canonical Item DOM art runtime
- active v0.15.64 Item catalog service parity, including single `desktop:get-item-catalog` IPC registration and main-process eager-prefetch intent
- Profile/Results parser parity
- read-only Research storage parity
- final assembled runtime, Golden fingerprints, behavioral differential fixtures, state/Research compatibility, diagnostics contracts

If the branch HEAD is newer than this SHA, read the latest Actions results before calling the newer HEAD verified.

## Current canonical work state

### Item subsystem

Canonical shadow components now exist for:

- `src/items/identity.js`
- `src/items/recommendation.js`
- `src/items/art-resolver.js`
- `src/items/art-runtime.js`
- `src/items/catalog-contract.js`
- `src/items/catalog-service.js`

Important preserved behavior:

- v0.15.80 standard-live item ID preference when localized names collide
- v0.15.81 owned-item/recommendation gate semantics
- v0.15.66 image ID resolution and primary/fallback art behavior
- one lifecycle-safe MutationObserver owner, no interval polling, idempotent start/stop
- active manifest Item catalog source is `update/v0.15.64/item-catalog-v01527.js`; canonical service differentially preserves its Data Dragon/CommunityDragon compacting, art fields, host policy, single IPC registration, and eager-prefetch intent
- all canonical Item code remains `production_active:false`; production main integration has **not** been cut over

### Diagnostics subsystem

Canonical shadow diagnostics now include:

- existing privacy-safe/read-only collector `stability/diagnostics/runtime-diagnostics.js`
- `src/diagnostics/panel.js` with stable `data-ui-role` identifiers
- refresh / close / privacy-safe `진단 JSON 복사` UX
- app/view/DOM/Research/AutoSync summary
- no recurring polling or MutationObserver repair loop

The final production menu/navigation entry remains planned. v0.15.135 UI is untouched.

## 20-step program status

Legend: `DONE`, `ACTIVE`, `PARTIAL`, `BLOCKED-LATER`.

1. **DONE** — v0.15.135 Golden Baseline frozen.
2. **DONE** — repository inventory + runtime dependency/owner map.
3. **DONE/MAINTAIN** — historical automatic version-pinned workflows removed from active workflow set; functional suites are maintained as migration grows.
4. **PARTIAL** — semantic UI role registry exists; permanent roles are being added with canonical UI owners. Complete only when production canonical UI is fully role-addressable.
5. **DONE** — final assembled-runtime gate exists.
6. **PARTIAL** — Windows Electron synthetic DOM E2E is green; installed production-app E2E/real-Windows acceptance still required.
7. **PARTIAL** — synthetic Windows screenshots + semantic geometry baseline exist; installed-app visual baseline remains required.
8. **PARTIAL** — synthetic rerender/duplicate-resource soak exists; prolonged real League/AutoSync soak remains required.
9. **PARTIAL** — privacy-safe diagnostics collector **and canonical panel/copy UX** are shadow-ready; final production navigation/menu integration remains pending.
10. **PARTIAL** — stable app/state/Research identity guards + synthetic 159-match checkpoint persistence exist; complete installed-app migration fixture remains required.
11. **DONE/MAINTAIN** — Golden runtime fingerprints + deterministic behavioral differential fixture suite are active; extend for every migrated domain.
12. **DONE** — canonical `src/` tree and owner registry exist.
13. **ACTIVE** — subsystem migration in shadow mode; see matrix below.
14. **ACTIVE** — hotfix **intent** is reimplemented in canonical modules instead of carrying patch-of-patch files forward.
15. **ACTIVE** — legacy-vs-canonical differential/shadow gates run in CI.
16. **BLOCKED-LATER** — remove legacy runtime chain only after full owner parity + installed acceptance.
17. **BLOCKED-LATER** — minimize manifest/package after legacy chain removal plan is proven.
18. **BLOCKED-LATER** — v0.16.0 RC after canonical owners + installed/real-League acceptance gates.
19. **BLOCKED-LATER** — production CLEAN BASELINE promotion.
20. **PARTIAL** — single-owner/canonical rules exist; final AGENTS/CI enforcement must be completed before promotion.

## Step 13 subsystem migration matrix

### Full shadow coverage (production inactive)

- `main/bootstrap`
- `preload/IPC`
- `state/persistence`
- `resource lifecycle`
- `updater transaction + boot/probation guard`
- `AutoSync concurrency/history helpers`
- `shared Riot grade/data helpers`
- `Draft risk engine`

### Broad/partial shadow coverage

- **RANDOM PICK**
  - shadow: candidate DNA, selected-candidate state, exhaustive TOP5 enumeration/order
  - remaining: exact legacy `teamScore`, final render owner
- **RANDOM IN GAME**
  - shadow: semantic signature, volatile HUD, tick coordinator, shop/build pipeline
  - remaining: runtime scheduler, final coach render
- **DATA**
  - shadow: Patch Notes generic-shell intent, workspace topology/mode detection
  - remaining: final mode owner, tier/detail layout, Patch Notes render owner
- **Item**
  - shadow: catalog identity, recommendation gate, art resolver, lifecycle-safe DOM art runtime, catalog IPC contract, active v0.15.64 catalog service/IPC owner semantics
  - remaining: production main/renderer integration and installed-app acceptance; do not cut over independently
- **Profile/Results**
  - shadow: v0.15.97-compatible result normalizer/local participant/game-key parser
  - remaining: history fetch owner, profile metrics, result/profile render, Riot-grade linkage
- **Research**
  - shadow: read-only existing IndexedDB/checkpoint storage and memory rebuild/cache selection
  - remaining: rating engine, UI, active-sampling/B2 migration
  - automatic network collection remains disabled/manual-only
- **Diagnostics**
  - shadow: collector, stable-role panel, JSON copy UX
  - remaining: final production navigation/menu entry and installed-app verification

## Exact next-work order

Continue in small independently verifiable slices:

1. **RANDOM PICK `teamScore` + final render owner** — first locate the exact active scoring source from repository/runtime assembly. Do not reconstruct scoring from memory and do not change scoring math.
2. **RANDOM IN GAME scheduler + coach render** — move final ownership under lifecycle single-owner rules.
3. **DATA mode/layout/render** — use permanent semantic roles; preserve v0.15.135 Patch Notes behavior without keeping semantic sweep as the permanent architecture.
4. **Profile history/metrics/render/Riot-grade link**.
5. **Research rating engine/UI/active sampling** — port only current useful behavior; do not revive obsolete v0.15.129 storage/UI and never auto-trigger B2 collection.
6. Wire the canonical **DIAG panel** into the future canonical navigation only after the owning UI shell is migrated.
7. Run installed-app compatibility + real Windows/League acceptance before any cutover.
8. Only then plan Steps 16–20.

### Known discovery for the next session

- Active RANDOM runtime owner remains `runtime-v015100` under v0.15.115 single-owner baseline.
- `update/v0.15.100/runtime-source-stability-v015100.js` controls selected-candidate preview locks but does **not** itself define the core `teamScore` scoring function.
- `reference/installed-v0.15.49/random-practice-pick-fragment.html` is an exact real-installed DOM reference, but it contains markup rather than the scoring engine.
- Therefore the next session must locate `teamScore` in the actual assembled/base runtime before writing canonical scoring code. A missing GitHub code-search hit is **not** permission to guess.

## Fresh-chat continuation prompt

```text
칼바람 프로그램 v0.16.0 CLEAN BASELINE 작업 계속.
기억으로 추측하지 말고 dbswo2910-oss/ARAM-Fearless-Draft 저장소를 source of truth로 사용해.
AGENTS.md → docs/CURRENT_STATE.md → update/current-state.json → update/manifest.json → docs/KNOWN_ISSUES.md → docs/V0160_CLEAN_BASELINE_PROGRESS.md → Issue #83 → Draft PR #84 → 최신 CI 순서로 복원해.
production main v0.15.135 Golden Baseline은 건드리지 말고 stability/v0160-clean-baseline-phaseb에서 계속 작업해.
먼저 최신 PR HEAD와 Stability Foundation / Full Regression / AI Continuity 결과를 확인하고, progress 문서의 'Exact next-work order'에서 아직 끝나지 않은 첫 항목부터 실제 GitHub 패치를 진행해.
CI 실패 시 프로그램 문제인지 audit fixture 문제인지 구분해서 root cause를 수정하고 재검증해.
작업을 마칠 때 이 progress 문서와 Issue #83/PR #84 중 최소 하나에 현재 HEAD, green CI, 완료 범위, 다음 정확한 작업을 남겨서 다음 새 채팅이 이어받을 수 있게 해.
```

## End-of-session continuity rule

Every substantial stabilization session must leave durable repository evidence containing:

- current branch HEAD
- last fully green code checkpoint and CI run numbers
- newly migrated scope
- remaining legacy/planned scope
- exact next task
- explicit statement that production `main` was or was not changed

Preferred durable locations: **this file + Issue #83 progress comment + PR #84 body**. Chat memory is not a substitute.
