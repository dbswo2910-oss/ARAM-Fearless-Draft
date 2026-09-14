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
9. latest PR HEAD + Stability Foundation / Installed Windows / Full Regression / AI Continuity runs

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
- GitHub-hosted Windows acceptance is stronger than synthetic E2E but is still **not** a physical-user-PC or real League Client test.

## Last fully verified code checkpoint

Code checkpoint **`ad7f847197c126fb32177f712a7c44051aa7d772`** is fully green at the same SHA:

- `v0.16.0 Stability Foundation` **#550 — SUCCESS**
  - Linux foundation: SUCCESS
  - Windows Electron synthetic: SUCCESS
- `v0.16.0 Installed Windows Acceptance` **#30 — SUCCESS**
- `Full Regression Audit` **#1002 — SUCCESS**
- `AI Continuity Audit` **#417 — SUCCESS**

A newer docs-only HEAD may exist after this checkpoint. Do not replace the fully-green code checkpoint with a docs-only SHA unless all release gates are rechecked there.

## Canonical migration state

The targeted Step-13 canonical migration is now complete in **shadow / production-inactive** form for:

- main/bootstrap
- preload/IPC
- state/persistence
- resource lifecycle
- updater transaction + boot/probation guard
- AutoSync concurrency/history helpers
- shared Riot grade/data helpers
- Draft risk engine
- RANDOM IN GAME semantic signature / HUD / coordinator / shop / coach / scheduler
- RANDOM PICK scoring, selection, TOP5, Candidate DNA, final presentation/render owner
- DATA workspace/mode/navigation, tier/detail layout and Patch Notes structural render owner
- Item identity/recommendation/art/catalog/runtime
- Profile + Results normalizer/history/metrics/Riot linkage and final render owner
- Research storage/sampling/rating engine/current useful UI; B2 remains manual-only
- diagnostics collector/panel and canonical diagnostics shell owner

All of the above remain shadow-only. There has been **no production owner cutover**.

## Installed Windows acceptance — now green

The installed-like Windows gate now reconstructs a validated real v0.15.49 installed baseline before materializing Golden v0.15.135.

### Reconstructed installed baseline

- pinned public v0.14.2 app bundle SHA-256: `2e076de26edb8f20a54bf0e07cfce9b6102f5f97617d8c5a3f65a03cb5671d04`
- v0.14.2 `index.html` SHA-256: `4a6cc26334e2dd7dd4aaf7ce5bd15315e47ad173baeb134ac40019d2e4906f32`
- preserved real v0.15.49 installed `index.html` SHA-256: `8de7a8eb03e363b808439d48673a4808809d82db67bc1b7955e80414a8782906`
- compact zstd index delta SHA-256: `194d5ec7ed88418a468f9da1a5b04b0f5d604564813fae271cf30864b9582c24`
- preserved real v0.15.49 `autosync-core.js` SHA-256: `a9f206df445d06eefc99ae55f1ceb3a7a5ff108a40a8393fa75ec413d2c4aba6`

The v0.15.49 AutoSync base is required because the Golden manifest assumes installed-base helpers such as `normalizeAramHistoryGame` already exist; using the older v0.14.2 core created a false acceptance failure.

### Golden materialization / boot checks

The gate now verifies:

1. exact real v0.15.49 index + AutoSync base reconstruction,
2. Golden v0.15.135 manifest materialization using raw Git blob bytes so Windows CRLF conversion cannot corrupt pinned hashes,
3. 236 Golden manifest files plus manifest deletions,
4. stable-v203 launcher tests/build and `--promote-only --expected-version 0.15.135`,
5. official Electron **38.7.2** Windows x64 archive with pinned SHA-256 `0401b898a8d83523694bd0afa6dc3035a54c57404a914725baa621c3378b5885` and download retries,
6. actual Electron cold-start on a GitHub Windows runner,
7. stable Windows Roaming userData identity `aram-fearless-draft`,
8. Golden storage-root log presence,
9. no fatal `App threw an error` / `index contract mismatch`,
10. canonical shadow payload presence without production activation.

The Stability Foundation Windows synthetic job uses the same pinned Electron runtime path instead of fragile npm postinstall downloading.

## 20-step program status

1. **DONE** — v0.15.135 Golden Baseline frozen.
2. **DONE** — repository inventory + runtime dependency/owner map.
3. **DONE/MAINTAIN** — historical automatic CI cleanup and feature-oriented gates.
4. **DONE/MAINTAIN** — canonical owners use stable semantic UI roles; keep enforcing uniqueness/visibility contracts.
5. **DONE** — final assembled-runtime verification.
6. **DONE for CI scope** — Windows Electron synthetic + installed-like Windows cold-start are green. Physical user PC / real League Client remains an external acceptance boundary.
7. **PARTIAL** — synthetic screenshot/semantic geometry regression exists; installed physical-PC visual/DPI/font acceptance remains external.
8. **PARTIAL** — synthetic rerender/resource soak exists; prolonged installed-like AutoSync/updater soak and real League timing remain.
9. **DONE in shadow** — privacy-safe diagnostics collector/panel + canonical shell owner. Production navigation is deferred to cutover.
10. **PARTIAL** — state/Research identities and synthetic checkpoint persistence are guarded; deeper installed-state migration fixtures for settings/localStorage/IndexedDB/match cache/Research DB must be proven before cutover.
11. **DONE/MAINTAIN** — Golden fingerprints + deterministic behavioral differential fixtures.
12. **DONE** — canonical `src/` tree + owner registry.
13. **DONE in shadow** — targeted subsystem canonical migration/owner consolidation.
14. **DONE/MAINTAIN** — hotfix intent absorbed into canonical owners rather than preserving patch-of-patch ownership.
15. **DONE/MAINTAIN** — legacy-vs-canonical shadow/differential gates are active.
16. **NEXT / BLOCKED BY CUTOVER PROOF** — remove legacy active runtime only after persistence/soak/cutover eligibility proof.
17. **PENDING AFTER 16** — minimal manifest/release package and reproducibility proof.
18. **PENDING** — v0.16.0 RC release gates.
19. **PENDING** — production CLEAN BASELINE promotion.
20. **PARTIAL/MAINTAIN** — single-owner/canonical rules exist; final enforcement remains part of RC/cutover.

## Exact next-work order

1. **Deep installed-state migration fixture**: preserve settings/localStorage, IndexedDB/match cache, Research DB `aram-rating-research-v03`, checkpoint key `checkpoint-v03`, and the existing 159-match checkpoint fixture across installed-like restart/migration.
2. **Installed-like AutoSync/updater soak**: repeated startup/restart, queue/concurrency/resource-lifecycle checks, no automatic Research network collection.
3. **Cutover eligibility matrix**: prove every canonical owner is green and list every remaining dependency on legacy fallback/runtime files.
4. Only after that proof, remove the legacy active runtime chain on the branch and rerun all differential/Windows/persistence gates.
5. Build a minimal reproducible v0.16 package/manifest.
6. Run v0.16 RC gates and physical-Windows/real-League manual acceptance where CI cannot represent the environment.
7. Production promotion only after explicit approval; do not merge/cut over automatically.

## Known facts / acceptance boundary

- RANDOM `teamScore` was recovered from the verified installed v0.15.49 baseline. Do not redesign the formula during stabilization.
- Canonical RANDOM/DATA/Profile/Research/DIAG owners are complete in shadow but **not active production owners**.
- Do not reintroduce the retired v0.15.103-v0.15.114 DOM-repair overlay stack.
- Installed Windows CI proves a reconstructed installed-baseline → Golden materialization → launcher → Electron cold-start path on GitHub-hosted Windows.
- It does **not** prove physical-machine DPI/font behavior, a real running League Client, live LCU timing, or real user network conditions.

## Fresh-chat continuation prompt

```text
칼바람 프로그램 v0.16.0 CLEAN BASELINE 계속.
기억으로 추측하지 말고 dbswo2910-oss/ARAM-Fearless-Draft 저장소를 source of truth로 사용해.
AGENTS.md → docs/CURRENT_STATE.md → update/current-state.json → update/manifest.json → docs/KNOWN_ISSUES.md → docs/V0160_CLEAN_BASELINE_PROGRESS.md → Issue #83 → Draft PR #84 → 최신 CI 순서로 복원해.
production main v0.15.135 Golden Baseline은 건드리지 말고 stability/v0160-clean-baseline-phaseb에서 진행해.
last fully-green code checkpoint는 ad7f847197c126fb32177f712a7c44051aa7d772이며 Foundation #550, Installed Windows #30, Full Regression #1002, AI Continuity #417이 같은 SHA에서 SUCCESS였다.
canonical owner migration은 RANDOM/DATA/Profile/Results/Research/DIAG 포함 shadow 단계까지 완료됐다. production cutover는 하지 않았다.
Exact next-work order의 첫 항목인 installed-state migration fixture부터 실제 GitHub 패치를 진행해.
CI 실패는 로직 문제/fixture 문제/외부 다운로드 문제를 구분해 root cause를 수정하고 gate를 약화시키지 마라.
작업 종료 때 current HEAD, last fully-green code SHA/CI, 완료/미완료 범위, 다음 작업, production main 변경 여부를 저장소 문서와 PR/Issue에 남겨라.
```

## End-of-session continuity rule

Every substantial session must leave durable repository evidence containing current branch HEAD, last fully green code checkpoint + CI run numbers, newly migrated scope, remaining legacy/planned scope, exact next task and whether production `main` changed. Chat memory is never the source of truth.
