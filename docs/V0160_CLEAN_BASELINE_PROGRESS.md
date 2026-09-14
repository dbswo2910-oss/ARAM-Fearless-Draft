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
- Tracking issue: #83. Draft consolidation PR: #84.
- Canonical `src/` code remains production inactive until explicit cutover gates pass.
- Preserve userData identity `aram-fearless-draft`.
- Preserve Research DB/checkpoint `aram-rating-research-v03` / `checkpoint-v03`.
- Preserve v0.15.79 updater safety, v0.15.117 state semantics, v0.15.118 lifecycle semantics, v0.15.119 AutoSync concurrency semantics.
- No intended Draft/RANDOM/ROLE/item scoring change during stabilization.
- B2 Research collection remains manual-only; no automatic network collection.
- Synthetic Windows CI is not installed-app or real-League acceptance.

## Last fully verified code checkpoint

Code checkpoint **`06f6e63b5e4e95b78a9bf6d72fae14c1ec5f1ed4`** is fully green:

- `v0.16.0 Stability Foundation` **#414 — SUCCESS**
  - Linux foundation job: SUCCESS
  - Windows Electron synthetic job: SUCCESS
- `Full Regression Audit` **#934 — SUCCESS**
- `AI Continuity Audit` **#349 — SUCCESS**

This checkpoint includes all prior foundation gates plus the recovered RANDOM PICK `teamScore` source/math differential described below. CI success is not real-Windows/real-League acceptance.

## Latest migration slice — RANDOM PICK teamScore blocker resolved

The previous blocker was that the exact base `teamScore(names,modes={})` scoring math was not present as a normal repository source file. It has now been recovered from the preserved real Windows v0.15.49 installed `index.html`, whose SHA-256 is:

`8de7a8eb03e363b808439d48673a4808809d82db67bc1b7955e80414a8782906`

Recovered `teamScore` source SHA-256:

`6b1c791d915eb11c2f84310001f8a639b21bef21f15aed0096e6318cd5fcac01`

Important root cause discovered during recovery: the old source extractor used the first `{` after the function name and therefore mistook the default parameter brace in `modes={}` for the function-body opening brace. The extractor now anchors the body to the final `{` in the matched declaration and has a regression fixture for default-parameter braces.

Canonical shadow work now includes:

- `src/random/pick/team-score.js`
  - exact recovered base scoring math
  - returned `teamScore` function source is byte-hash locked to the installed v0.15.49 source
  - scoring flags remain unchanged (`score_logic_changed:false`, `random_scoring_changed:false`)
- `src/random/pick/team-survival.js`
  - canonical port of the active v0.15.40 catch-survival metadata layer
- `tools/stability/random-team-score-canonical-differential-audit.js`
  - verifies source hash lineage
  - compares legacy v0.15.40 catch-survival output vs canonical output
  - compares active wrapped final teamScore vs canonical decorated teamScore on deterministic fixtures
  - compares TOP5 result/order when canonical teamScore replaces the legacy score delegate
- existing RANDOM teamScore boundary gate now invokes the canonical differential, so Stability Foundation enforces it.

The overall RANDOM PICK owner is **not** production-ready yet. `team_score_math` and `catch_survival` are shadow-complete, but the final canonical render/interaction owner and permanent semantic-role binding still remain. Production continues to use the legacy RANDOM owner.

## Current subsystem migration matrix

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
- shadow: candidate DNA
- shadow: selected-candidate state
- shadow: exhaustive TOP5 enumeration/order
- shadow: recovered base `teamScore` scoring math
- shadow: v0.15.40 catch-survival metadata layer
- planned: final canonical TOP5/detail/team render owner + stable semantic UI roles
- production owner remains `runtime-v015100` under the v0.15.115 single-owner baseline

**DATA**
- shadow: Patch Notes generic-shell intent, workspace topology, mode/navigation behavior
- remaining: final tier/detail layout + Patch Notes render owner; replace temporary semantic-sweep fallback with structural canonical layout

**Profile / Results**
- shadow: result normalizer, history service, profile metrics, authoritative Riot Grade exact-link
- remaining: profile render, results render, permanent semantic roles

**Research**
- shadow: read-only storage/checkpoint + v0.3.1 active-sampling policy
- remaining: rating engine + current useful Research UI
- network collection remains disabled/manual-only

## 20-step program status

Legend: DONE / ACTIVE / PARTIAL / BLOCKED-LATER.

1. **DONE** — v0.15.135 Golden Baseline frozen.
2. **DONE** — repository inventory + runtime dependency/owner map.
3. **DONE/MAINTAIN** — historical automatic CI cleaned; feature-oriented gates maintained.
4. **PARTIAL** — semantic UI role registry exists; production canonical UI still needs full role coverage.
5. **DONE** — final assembled-runtime test.
6. **PARTIAL** — Windows Electron synthetic E2E green; installed-app/real-Windows acceptance pending.
7. **PARTIAL** — screenshot + semantic geometry artifacts exist; installed-app visual baseline pending.
8. **PARTIAL** — synthetic rerender/resource soak exists; prolonged real League/AutoSync soak pending.
9. **PARTIAL** — privacy-safe DIAG collector + canonical panel/copy UX exist; production navigation entry pending.
10. **PARTIAL** — stable state/Research identities and synthetic 159-checkpoint persistence covered; installed migration fixture pending.
11. **DONE/MAINTAIN** — Golden fingerprints + deterministic behavioral differential fixtures active.
12. **DONE** — canonical `src/` tree + owner registry.
13. **ACTIVE** — subsystem canonical migration/shadow parity; foundations plus RANDOM IN GAME/Item are broad shadow candidates, RANDOM PICK scoring math is now recovered and verified.
14. **ACTIVE** — hotfix intent is absorbed without preserving patch-of-patch ownership.
15. **ACTIVE** — legacy-vs-canonical shadow/differential comparison.
16. **BLOCKED-LATER** — legacy active runtime removal only after full parity + installed acceptance.
17. **BLOCKED-LATER** — manifest/package minimization after Step 16 proof.
18. **BLOCKED-LATER** — v0.16 RC after all release gates.
19. **BLOCKED-LATER** — production CLEAN BASELINE promotion.
20. **PARTIAL** — single-owner/canonical rules exist; final AGENTS/CI enforcement before promotion.

## Exact next-work order

1. **Finish RANDOM PICK final render/interaction owner** using exact verified base IDs and stable `data-ui-role` contracts. Do not add another runtime overlay.
2. **DATA final layout/render owner** and permanent structural Patch Notes rule.
3. **Profile + Results render owners** with stable semantic roles.
4. **Research rating engine + current useful Research UI**, preserving storage identity and manual-only B2.
5. Wire DIAG into the future canonical shell.
6. Strengthen installed-app migration / real Windows / real League AutoSync soak acceptance.
7. Only after all above: Steps 16–20 (legacy active-chain removal → minimal package → RC → production).

## Known facts / remaining acceptance boundary

- The RANDOM `teamScore` source-discovery blocker is resolved; do not re-derive or redesign the formula.
- The canonical scoring math is intentionally a parity port, not a balance change.
- The active production RANDOM owner has **not** been cut over; current canonical code is shadow-only.
- Exact base RANDOM DOM anchors from the real installed baseline remain the migration anchors: `#random`, `#randomInputAnchor`, `#poolInputs`, `#comboResults`, `#comboDetail`, `#randomOurFive`, `#randomOurSummary`, `#randomEnemySummary`, `#randomRoles`.
- Synthetic Windows CI is a strong regression gate but cannot prove exact installed Electron DPI/font/layout or real League timing.

## Fresh-chat continuation prompt

```text
칼바람 프로그램 v0.16.0 CLEAN BASELINE 계속.
기억으로 추측하지 말고 dbswo2910-oss/ARAM-Fearless-Draft 저장소를 source of truth로 사용해.
AGENTS.md → docs/CURRENT_STATE.md → update/current-state.json → update/manifest.json → docs/KNOWN_ISSUES.md → docs/V0160_CLEAN_BASELINE_PROGRESS.md → Issue #83 → Draft PR #84 → 최신 CI 순서로 복원해.
production main v0.15.135 Golden Baseline은 건드리지 말고 stability/v0160-clean-baseline-phaseb에서 진행해.
progress 문서의 Exact next-work order에서 아직 끝나지 않은 첫 항목부터 실제 GitHub 패치를 진행해.
RANDOM teamScore 수학은 이미 검증된 설치본에서 복구되어 canonical shadow parity가 green이므로 재설계하지 말고 final render owner부터 이어가.
CI 실패는 프로그램 로직 문제인지 audit fixture 문제인지 구분해서 root cause를 수정하고 다시 검증해.
작업 종료 때 이 progress 문서와 PR #84 또는 Issue #83에 current HEAD, last fully-green SHA/CI, 완료/미완료 범위, 다음 정확한 작업을 남겨 새 채팅에서도 바로 이어지게 해.
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
