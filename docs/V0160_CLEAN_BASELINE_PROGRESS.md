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

- Production `main` remains **v0.15.135 Golden Baseline** at `2048d56ceec2317b4cef225f284443521005994d`.
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

Code checkpoint **`a83de8a20dffa32e7d0abcb19fb6b3008e42eaf2`** is fully green:

- `v0.16.0 Stability Foundation` **#428 — SUCCESS**
  - Linux foundation: SUCCESS
  - Windows Electron synthetic: SUCCESS
- `Full Regression Audit` **#941 — SUCCESS**
- `AI Continuity Audit` **#356 — SUCCESS**

A newer docs-only HEAD may exist after this checkpoint. Always inspect current Actions before calling that newer HEAD fully verified.

## Latest migration slice — RANDOM PICK scoring blocker closed + render core started

### Recovered scoring math

The exact base `teamScore(names,modes={})` scoring math was recovered from the preserved real Windows v0.15.49 installed `index.html`.

- installed `index.html` SHA-256: `8de7a8eb03e363b808439d48673a4808809d82db67bc1b7955e80414a8782906`
- recovered `teamScore` source SHA-256: `6b1c791d915eb11c2f84310001f8a639b21bef21f15aed0096e6318cd5fcac01`

The old extractor bug was also fixed: it previously mistook the `{}` in default parameter `modes={}` for the function body. The extractor now anchors the body to the final `{` of the matched declaration and has a regression fixture for this exact case.

Canonical shadow coverage now includes:

- `src/random/pick/team-score.js` — recovered base scoring math, source-hash locked to the verified installed baseline.
- `src/random/pick/team-survival.js` — canonical port of the active v0.15.40 catch-survival metadata wrapper.
- `random-team-score-canonical-differential-audit.js` — source lineage, catch-survival parity, final wrapped teamScore parity and TOP5 parity.

This is a **parity port**, not a balance change. `score_logic_changed:false` and `random_scoring_changed:false` remain enforced.

### Canonical RANDOM PICK render core

A production-inactive canonical render core now exists at `src/random/pick/render-core.js`.

It currently owns in shadow mode:

- exact-ID binding to permanent semantic roles for `#random`, input/pool anchors, `#comboResults`, `#comboDetail`, `#randomOurFive`, summaries.
- TOP5 base result rendering.
- selected-combo detail rendering.
- one delegated selection listener rather than per-row listener accumulation.
- explicit listener disposal.
- selected-combo rerender/persist/analysis routing.

`random-render-core-canonical-audit.js` verifies role binding, TOP5/detail semantic output, idempotent single listener, selection rerender and cleanup. It is chained into the existing RANDOM teamScore Stability Foundation gate.

The final v0.15.90-v0.15.100 candidate-preview presentation layer is **not yet claimed migrated**. The overall RANDOM PICK owner remains planned/production-inactive until that final presentation/interaction parity is absorbed.

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
- shadow: recovered base `teamScore` math
- shadow: v0.15.40 catch-survival metadata
- shadow: base TOP5/detail render core + exact-ID semantic-role binding + disposable selection listener
- remaining: absorb the final v0.15.90-v0.15.100 candidate-preview/TOP5 presentation behavior into the canonical renderer; then owner-level shadow comparison
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

1. **DONE** — v0.15.135 Golden Baseline frozen.
2. **DONE** — repository inventory + runtime dependency/owner map.
3. **DONE/MAINTAIN** — historical automatic CI cleaned; feature-oriented gates maintained.
4. **PARTIAL** — semantic UI role registry exists; RANDOM canonical render core now binds key roles, but all production UI is not yet canonical.
5. **DONE** — final assembled-runtime test.
6. **PARTIAL** — Windows Electron synthetic E2E green; installed-app/real-Windows acceptance pending.
7. **PARTIAL** — screenshot + semantic geometry artifacts exist; installed-app visual baseline pending.
8. **PARTIAL** — synthetic rerender/resource soak exists; prolonged real League/AutoSync soak pending.
9. **PARTIAL** — privacy-safe DIAG collector + canonical panel/copy UX exist; production navigation entry pending.
10. **PARTIAL** — stable state/Research identities and synthetic 159-checkpoint persistence covered; installed migration fixture pending.
11. **DONE/MAINTAIN** — Golden fingerprints + deterministic behavioral differential fixtures active.
12. **DONE** — canonical `src/` tree + owner registry.
13. **ACTIVE** — subsystem canonical migration/shadow parity; RANDOM PICK scoring math blocker is closed and renderer migration is active.
14. **ACTIVE** — hotfix intent is absorbed without preserving patch-of-patch ownership.
15. **ACTIVE** — legacy-vs-canonical shadow/differential comparison.
16. **BLOCKED-LATER** — legacy active runtime removal only after full parity + installed acceptance.
17. **BLOCKED-LATER** — manifest/package minimization after Step 16 proof.
18. **BLOCKED-LATER** — v0.16 RC after all release gates.
19. **BLOCKED-LATER** — production CLEAN BASELINE promotion.
20. **PARTIAL** — single-owner/canonical rules exist; final AGENTS/CI enforcement before promotion.

## Exact next-work order

1. **Finish RANDOM PICK candidate-preview/final presentation owner**: absorb current v0.15.90-v0.15.100 visible TOP5/DNA/selected-preview behavior into canonical rendering without reintroducing an overlay.
2. Promote RANDOM PICK to a complete shadow owner only after owner-level differential/interaction gates pass.
3. **DATA final layout/render owner** and permanent structural Patch Notes rule.
4. **Profile + Results render owners** with stable semantic roles.
5. **Research rating engine + current useful Research UI**, preserving storage identity and manual-only B2.
6. Wire DIAG into the future canonical shell.
7. Strengthen installed-app migration / real Windows / real League AutoSync soak acceptance.
8. Only after all above: Steps 16–20 (legacy active-chain removal → minimal package → RC → production).

## Known facts / remaining acceptance boundary

- The RANDOM `teamScore` source-discovery blocker is resolved; do not re-derive or redesign the formula.
- The active production RANDOM owner has **not** been cut over; canonical code is shadow-only.
- Exact base RANDOM DOM anchors from the real installed baseline remain migration anchors: `#random`, `#randomInputAnchor`, `#poolInputs`, `#comboResults`, `#comboDetail`, `#randomOurFive`, `#randomOurSummary`, `#randomEnemySummary`, `#randomRoles`.
- Do not reintroduce the retired v0.15.103-v0.15.114 DOM-repair overlay stack.
- Synthetic Windows CI is a strong regression gate but cannot prove exact installed Electron DPI/font/layout or real League timing.

## Fresh-chat continuation prompt

```text
칼바람 프로그램 v0.16.0 CLEAN BASELINE 계속.
기억으로 추측하지 말고 dbswo2910-oss/ARAM-Fearless-Draft 저장소를 source of truth로 사용해.
AGENTS.md → docs/CURRENT_STATE.md → update/current-state.json → update/manifest.json → docs/KNOWN_ISSUES.md → docs/V0160_CLEAN_BASELINE_PROGRESS.md → Issue #83 → Draft PR #84 → 최신 CI 순서로 복원해.
production main v0.15.135 Golden Baseline은 건드리지 말고 stability/v0160-clean-baseline-phaseb에서 진행해.
progress 문서의 Exact next-work order에서 아직 끝나지 않은 첫 항목부터 실제 GitHub 패치를 진행해.
RANDOM teamScore는 검증된 설치본에서 복구되어 canonical parity가 green이다. 수학식을 재설계하지 말고 candidate-preview/final render owner부터 이어가.
CI 실패는 실제 로직 문제인지 audit fixture 문제인지 구분해서 root cause를 수정하고 다시 검증해.
작업 종료 때 progress 문서와 PR #84 또는 Issue #83에 current HEAD, last fully-green SHA/CI, 완료/미완료 범위, 다음 정확한 작업을 남겨 새 채팅에서도 바로 이어지게 해.
```

## End-of-session continuity rule

Every substantial session must leave durable repository evidence containing current branch HEAD, last fully green code checkpoint + CI run numbers, newly migrated scope, remaining legacy/planned scope, exact next task and whether production `main` changed. Chat memory is never the source of truth.
