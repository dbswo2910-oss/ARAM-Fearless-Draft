# v0.16.0 CLEAN BASELINE — DURABLE PROGRESS / NEW-CHAT HANDOFF

> Fresh sessions must restore state from the repository, not chat memory. If this file conflicts with current HEAD, manifests, owners, or CI, repository evidence wins.

## Restore order in a new chat

1. `AGENTS.md`
2. `docs/CURRENT_STATE.md`
3. `update/current-state.json`
4. `update/manifest.json`
5. `docs/KNOWN_ISSUES.md`
6. `docs/V0160_CLEAN_BASELINE_PROGRESS.md`
7. Issue #83
8. Draft PR #84
9. latest PR HEAD + Stability Foundation / Full Regression / AI Continuity runs

## Non-negotiable safety boundary

- Production `main` remains **v0.15.135 Golden Baseline**.
- Golden commit: `2048d56ceec2317b4cef225f284443521005994d`.
- Migration branch: `stability/v0160-clean-baseline-phaseb`.
- Tracking issue: #83.
- Draft consolidation PR: #84.
- Do not promote canonical owners from synthetic CI alone.
- Preserve userData identity `aram-fearless-draft`.
- Preserve Research DB/checkpoint `aram-rating-research-v03` / `checkpoint-v03`.
- Preserve v0.15.79 updater safety, v0.15.117 state semantics, v0.15.118 lifecycle semantics, v0.15.119 AutoSync concurrency semantics.
- No intended Draft/RANDOM/ROLE/item scoring change during stabilization.
- B2 Research collection remains manual-only; no automatic network collection.

## Last fully verified code checkpoint

Code checkpoint **`5e69d769c762d7bfbc1beb82ae85f8458669d69b`** is fully green:

- `v0.16.0 Stability Foundation` **#392 — SUCCESS**
  - Linux foundation job: SUCCESS
  - Windows Electron synthetic job: SUCCESS
- `Full Regression Audit` **#923 — SUCCESS**
- `AI Continuity Audit` **#338 — SUCCESS**

The Foundation run at this checkpoint includes successful gates through:

- Golden baseline / inventory / UI contract / owner registry
- state / lifecycle / updater / boot guard
- AutoSync / Riot / Draft
- RANDOM PICK DNA / selection / TOP5 / teamScore boundary / installed-source extractor
- RANDOM IN GAME semantic / volatile HUD / coordinator / shop / coach render / scheduler
- DATA Patch Notes / workspace / mode-navigation
- Item identity / recommendation / art / lifecycle / catalog service
- Profile results parser / metrics / history service / Riot Grade exact-link
- Research storage / v0.3.1 sampling policy
- final assembled runtime / runtime fingerprints / behavioral differential
- state + Research compatibility / diagnostics / Full Regression / AI continuity

Important: the code checkpoint above is synthetic/CI verified. It is **not** equivalent to installed-app real-Windows or real-League acceptance.

## What changed in the latest migration slice

### RANDOM IN GAME

Canonical shadow coverage is now broad enough to classify the subsystem as a complete shadow owner candidate:

- semantic signature
- volatile HUD clock/respawn/gold
- tick coordinator
- shop/build pipeline
- coach render
- lifecycle-safe single scheduler

`src/random/ingame/contract.js` is `status:'shadow'`. Production remains inactive. Real installed/League acceptance is still required before cutover.

### Item

Canonical shadow coverage is complete enough to classify Item as a complete shadow owner candidate:

- canonical item identity/name-collision handling
- recommendation gate / owned-item semantics
- art resolver
- lifecycle-safe DOM art runtime
- catalog IPC contract
- active v0.15.64 catalog service behavior / single IPC owner semantics

`src/items/contract.js` is `status:'shadow'`. Production integration is still disabled.

### Profile / Results

Canonical shadow pieces now include:

- v0.15.97-compatible result normalizer
- history fetch/cache/latency owner
- v0.15.19-compatible profile metrics
- exact authoritative Riot Grade linkage

Riot Grade linkage is fail-closed and non-scoring:

- trusted `riot-primary-update` records only
- exact gameId + championId
- PUUID match when available
- legacy/unverified records rejected
- searched-player missing Grade is explained rather than substituted with local-player Grade

Remaining Profile work: profile/result render owners and final UI role integration.

### Research

Canonical Research now includes:

- read-only existing IndexedDB/checkpoint access
- memory-only rebuild/cache selection
- v0.3.1 active-sampling policy port
- 159-match resume fixture
- saturation/headroom/duplicate guards
- Phase-B singleton exclusion
- B2 manual-only / automatic collection disabled

Remaining Research work: rating engine + current useful Research UI integration. Do not resurrect obsolete v0.15.129 patch ownership or auto-run B2.

### CI cleanup

Repository inventory currently reports **0 historical automatic workflows**. Historical version-pinned workflows are no longer active automatic gates.

## 20-step program status

Legend: DONE / ACTIVE / PARTIAL / BLOCKED-LATER.

1. **DONE** — v0.15.135 Golden Baseline frozen.
2. **DONE** — repository inventory + runtime dependency/owner map.
3. **DONE/MAINTAIN** — historical automatic CI cleaned; feature-oriented gates maintained.
4. **PARTIAL** — semantic UI role registry exists; production canonical UI still needs full role coverage.
5. **DONE** — final assembled-runtime test exists.
6. **PARTIAL** — Windows Electron synthetic E2E green; installed-app/real-Windows acceptance pending.
7. **PARTIAL** — screenshot + semantic geometry artifacts exist; installed-app visual baseline pending.
8. **PARTIAL** — synthetic rerender/resource soak exists; prolonged real League/AutoSync soak pending.
9. **PARTIAL** — privacy-safe DIAG collector + canonical panel/copy UX exist; production navigation entry pending.
10. **PARTIAL** — stable state/Research identities and synthetic 159-checkpoint persistence covered; installed migration fixture pending.
11. **DONE/MAINTAIN** — Golden fingerprints + deterministic differential fixtures active.
12. **DONE** — canonical `src/` tree + owner registry.
13. **ACTIVE** — subsystem canonical migration/shadow parity.
14. **ACTIVE** — hotfix intent is absorbed without preserving patch-of-patch ownership.
15. **ACTIVE** — legacy-vs-canonical shadow/differential comparison.
16. **BLOCKED-LATER** — legacy active runtime removal only after full parity + installed acceptance.
17. **BLOCKED-LATER** — manifest/package minimization after Step 16 proof.
18. **BLOCKED-LATER** — v0.16 RC after all release gates.
19. **BLOCKED-LATER** — production CLEAN BASELINE promotion.
20. **PARTIAL** — single-owner/canonical rules exist; final AGENTS/CI enforcement before promotion.

## Step 13 migration matrix

### Full shadow candidates, production inactive

- main/bootstrap
- preload/IPC
- state/persistence
- resource lifecycle
- updater transaction + boot/probation guard
- AutoSync concurrency/history helpers
- shared Riot grade/data helpers
- Draft risk engine
- RANDOM IN GAME
- Item
- diagnostics core/panel

### Partial shadows still needing owner completion

**RANDOM PICK**
- shadow: candidate DNA, selection state, exhaustive TOP5 enumeration/order
- protected boundary: canonical code still injects legacy `teamScore`
- remaining: locate exact active installed/assembled `teamScore` source and migrate without changing math; final render owner

**DATA**
- shadow: Patch Notes generic-shell intent, workspace topology, mode/navigation behavior
- remaining: final tier/detail layout + Patch Notes render owner; replace temporary semantic sweep architecture with stable-role canonical layout

**Profile / Results**
- shadow: result normalizer, history service, profile metrics, Riot Grade exact-link
- remaining: profile render, results render, permanent semantic roles

**Research**
- shadow: storage + v0.3.1 sampling policy
- remaining: rating engine + useful Research UI
- network collection remains disabled/manual-only

## Exact next-work order

1. **RANDOM PICK `teamScore` source discovery and migration**. Do not guess scoring math. Use actual assembled/installed runtime source or equivalent repository evidence.
2. **RANDOM PICK final render owner** with stable `data-ui-role` contracts.
3. **DATA final layout/render owner** and permanent Patch Notes rule without relying on v0.15.135 semantic-sweep fallback as the final architecture.
4. **Profile + Results render owners** with stable semantic roles.
5. **Research rating engine + current useful Research UI**; keep storage identity and manual-only B2.
6. Wire DIAG into the future canonical shell.
7. Strengthen installed-app migration / real Windows / real League AutoSync soak acceptance.
8. Only after all above: Steps 16–20 (legacy active-chain removal → minimal package → RC → production).

## Known blockers / discoveries

- Active RANDOM owner remains `runtime-v015100` under the v0.15.115 single-owner baseline.
- `update/v0.15.100/runtime-source-stability-v015100.js` controls selection/preview behavior but does not itself define the core `teamScore` math.
- The exact `teamScore` math must be recovered from the real assembled/base runtime before canonical implementation. A missing code-search result is not permission to reconstruct it from memory.
- Synthetic Windows CI is a strong regression gate but is not real installed-app acceptance.

## Fresh-chat continuation prompt

```text
칼바람 프로그램 v0.16.0 CLEAN BASELINE 계속.
기억으로 추측하지 말고 dbswo2910-oss/ARAM-Fearless-Draft 저장소를 source of truth로 사용해.
AGENTS.md → docs/CURRENT_STATE.md → update/current-state.json → update/manifest.json → docs/KNOWN_ISSUES.md → docs/V0160_CLEAN_BASELINE_PROGRESS.md → Issue #83 → Draft PR #84 → 최신 CI 순서로 복원해.
production main v0.15.135 Golden Baseline은 건드리지 말고 stability/v0160-clean-baseline-phaseb에서 진행해.
최신 PR HEAD와 Stability Foundation / Full Regression / AI Continuity를 먼저 확인하고, progress 문서의 Exact next-work order에서 아직 끝나지 않은 첫 항목부터 실제 GitHub 패치를 진행해.
CI 실패는 프로그램 로직 문제인지 audit fixture 문제인지 구분해서 root cause를 수정하고 다시 검증해.
작업 종료 때 이 progress 문서와 PR #84 또는 Issue #83에 현재 HEAD, 마지막 fully-green SHA/CI, 완료 범위, 미완료 범위, 다음 정확한 작업을 남겨 새 채팅에서도 바로 이어지게 해.
```

## End-of-session continuity rule

Every substantial session must leave durable repository evidence containing:

- current branch HEAD
- last fully green code checkpoint + CI run numbers
- newly migrated scope
- remaining legacy/planned scope
- exact next task
- whether production `main` changed

Chat memory is never the source of truth.
