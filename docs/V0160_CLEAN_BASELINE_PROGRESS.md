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

## Last fully verified checkpoint before the current work batch

PR #84 head `55a7b577dc6d7fe5078a8be32e34785af0ee9be7` was verified green for:

- `v0.16.0 Stability Foundation` run #252, including Windows Electron synthetic E2E
- `Full Regression Audit` run #853
- `AI Continuity Audit` run #268

At that checkpoint the canonical shadow/differential suite covered main, preload, state, lifecycle, updater, AutoSync, Riot helpers, Draft, partial RANDOM PICK/IN GAME, partial DATA, Item identity/recommendation, Profile Results parsing, and read-only Research storage.

## Current work batch after that green checkpoint

The branch is being advanced beyond `55a7b577...` with **Item art/catalog shadow canonicalization**:

- `src/items/art-resolver.js`
  - v0.15.80 canonical duplicate-name preference
  - v0.15.66 item image ID resolution order
  - primary/fallback art candidate dedupe
  - asset URL equivalence helpers
- `src/items/catalog-contract.js`
  - canonical `getItemCatalog` / `desktop:get-item-catalog` bridge contract
  - catalog shape validation
- `tools/stability/item-art-catalog-canonical-differential-audit.js`
  - directly compares canonical resolver semantics with the patched v0.15.80/v0.15.66 legacy art owner
  - verifies v0.15.117 preload bridge/channel parity
- Stability Foundation workflow now includes this new Item art/catalog differential gate.
- Item DOM MutationObserver runtime and main-process catalog handler are **not** claimed migrated yet.

The exact current branch HEAD and CI result must be re-read from GitHub at the start of every new session. Never assume the work batch above is green until the latest Actions run confirms it.

## 20-step program status

Legend: `DONE`, `ACTIVE`, `PARTIAL`, `BLOCKED-LATER`.

1. **DONE** — v0.15.135 Golden Baseline frozen.
2. **DONE** — repository inventory + runtime dependency/owner map.
3. **DONE/MAINTAIN** — historical automatic version-pinned workflows removed from the active workflow set; inventory previously reported `historical_workflow: 0`. Functional suites remain maintained as migration grows.
4. **PARTIAL** — semantic UI role registry exists; permanent roles are applied as canonical UI owners are migrated. Do not mark complete until production canonical UI is fully role-addressable.
5. **DONE** — final assembled-runtime gate exists.
6. **PARTIAL** — Windows Electron synthetic DOM E2E is green; installed production-app E2E/real-Windows acceptance still required.
7. **PARTIAL** — six Windows synthetic screenshot artifacts + semantic geometry baseline exist; installed-app visual baseline remains required.
8. **PARTIAL** — synthetic rerender/duplicate-resource soak exists; prolonged real League/AutoSync soak remains required.
9. **PARTIAL** — privacy-safe read-only diagnostics collector/contract exists; final in-app diagnostics panel/copy UX is not production-active yet.
10. **PARTIAL** — stable app/state/Research identity guards + synthetic 159-match checkpoint persistence exist; complete installed-app migration fixture remains required.
11. **DONE/MAINTAIN** — Golden runtime fingerprints + deterministic behavioral differential fixture suite are active; extend whenever a new canonical domain is migrated.
12. **DONE** — canonical `src/` tree and owner registry exist.
13. **ACTIVE** — subsystem migration in shadow mode; see table below.
14. **ACTIVE** — hotfix **intent** is being reimplemented in canonical modules rather than carrying patch-of-patch files forward.
15. **ACTIVE** — legacy-vs-canonical differential/shadow gates run in CI.
16. **BLOCKED-LATER** — remove legacy runtime chain only after full owner parity + installed acceptance.
17. **BLOCKED-LATER** — minimize manifest/package after legacy chain removal plan is proven.
18. **BLOCKED-LATER** — v0.16.0 RC after canonical owners + installed/real-League acceptance gates.
19. **BLOCKED-LATER** — production CLEAN BASELINE promotion.
20. **PARTIAL** — single-owner/canonical rules already exist; final AGENTS/CI enforcement must be completed before promotion.

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

### Partial shadow coverage

- **RANDOM PICK**
  - shadow: candidate DNA, selected-candidate state, exhaustive TOP5 enumeration/order
  - remaining: legacy `teamScore`, final render owner
- **RANDOM IN GAME**
  - shadow: semantic signature, volatile HUD, tick coordinator, shop/build pipeline
  - remaining: runtime scheduler, final coach render
- **DATA**
  - shadow: Patch Notes generic-shell intent, workspace topology/mode detection
  - remaining: final mode owner, tier/detail layout, Patch Notes render owner
- **Item**
  - shadow: catalog identity, recommendation gate, art resolver, catalog IPC contract
  - remaining: DOM art MutationObserver/runtime owner, main-process catalog IPC handler
- **Profile/Results**
  - shadow: v0.15.97-compatible result normalizer/local participant/game-key parser
  - remaining: history fetch owner, profile metrics, result/profile render, Riot-grade linkage
- **Research**
  - shadow: read-only existing IndexedDB/checkpoint storage and memory rebuild/cache selection
  - remaining: rating engine, UI, active-sampling/B2 migration
  - automatic network collection remains disabled/manual-only

## Exact next-work order

Continue in small independently verifiable slices. Preferred order:

1. Verify latest Item art/catalog differential CI; fix only the failing fixture/root cause if red.
2. Finish **Item DOM art runtime + main catalog IPC owner** shadow migration, preserving v0.15.118 lifecycle ownership and no recurring full-document scan regression.
3. Finish **RANDOM PICK teamScore/final render** with deterministic differential parity. Do not change scoring math.
4. Finish **RANDOM IN GAME scheduler/coach render** under lifecycle single-owner rules.
5. Finish **DATA mode/layout/render** using stable semantic roles; preserve v0.15.135 Patch Notes intent without semantic sweep being the permanent architecture.
6. Finish **Profile history/metrics/render/Riot-grade link**.
7. Finish **Research rating engine/UI/active sampling** by porting current useful research behavior only; do not revive obsolete v0.15.129 storage/UI or auto-trigger B2 collection.
8. Add/finish in-app **DIAG panel + privacy-safe JSON copy** in canonical UI.
9. Run installed-app compatibility + real Windows/League acceptance before any cutover.
10. Only then plan Steps 16–20.

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

Every substantial stabilization session should leave durable repository evidence containing:

- current branch HEAD
- last fully green CI run(s)
- what was newly migrated
- what remains legacy/planned
- exact next task
- explicit statement that production `main` was or was not changed

Preferred durable locations: this file + Issue #83 progress comment + PR #84 body. Chat memory is not a substitute.
