# v0.16.0 CLEAN BASELINE — DURABLE PROGRESS / NEW-CHAT HANDOFF

> Fresh sessions must restore state from the repository, not chat memory. If this file conflicts with current HEAD, manifests, owners, or CI, repository evidence wins.

## Restore order in a new chat

1. `AGENTS.md`
2. `docs/CURRENT_STATE.md`
3. `update/current-state.json`
4. `update/manifest.json`
5. `docs/KNOWN_ISSUES.md`
6. `docs/V0160_CLEAN_BASELINE_PROGRESS.md`
7. `docs/V0160_CUTOVER_ELIGIBILITY.md`
8. Issue #83
9. Draft PR #84
10. latest PR HEAD + Stability Foundation / Installed Windows / Installed Persistence / AutoSync-Updater Soak / Full Regression / AI Continuity runs

## Non-negotiable safety boundary

- Production application-code Golden Baseline remains **v0.15.135** at `2048d56ceec2317b4cef225f284443521005994d`.
- `main` currently points to `29d2e172e8a2a4eecde2210e34f29dea4b632acc`, which is only the later automated `data: refresh ARAM build cache` child of the Golden commit. No canonical v0.16 owner code has been cut over to production.
- Migration branch: `stability/v0160-clean-baseline-phaseb`.
- Tracking issue: #83. Draft consolidation PR: #84.
- Canonical `src/` code remains production inactive until explicit cutover approval.
- Preserve userData identity `aram-fearless-draft`.
- Preserve Research DB/checkpoint `aram-rating-research-v03` / `checkpoint-v03`.
- Preserve v0.15.79 updater safety, v0.15.117 state semantics, v0.15.118 lifecycle semantics, v0.15.119 AutoSync concurrency semantics.
- No intended Draft/RANDOM/ROLE/item scoring change during stabilization.
- B2 Research collection remains manual-only; no automatic network collection.
- GitHub-hosted Windows acceptance is not a physical-user-PC or real League Client test.

## Latest fully green automated checkpoint

Code checkpoint **`ce40427e80e6bfcb9289dbb981503654e34a8c9e`** is fully green at the same SHA:

- `v0.16.0 Stability Foundation` **#574 — SUCCESS**
  - Linux foundation: SUCCESS
  - Windows Electron synthetic: SUCCESS
- `v0.16.0 Installed Windows Acceptance` **#54 — SUCCESS**
- `v0.16.0 Installed Persistence Acceptance` **#18 — SUCCESS**
- `v0.16.0 AutoSync Updater Soak` **#8 — SUCCESS**
- `Full Regression Audit` **#1014 — SUCCESS**
- `AI Continuity Audit` **#429 — SUCCESS**

If a newer docs-only HEAD exists, keep `ce40427e...` as the fully-green code checkpoint until all release gates are rerun on newer code.

## Canonical migration state

The targeted Step-13 canonical migration is complete in **shadow / production-inactive** form for:

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

All canonical owners remain `shadow`; `production_active:false`. There has been **no production owner cutover**.

## Installed Windows acceptance — green

The Windows gate reconstructs a validated real v0.15.49 installed baseline before materializing Golden v0.15.135.

- public v0.14.2 app bundle SHA-256: `2e076de26edb8f20a54bf0e07cfce9b6102f5f97617d8c5a3f65a03cb5671d04`
- v0.14.2 `index.html` SHA-256: `4a6cc26334e2dd7dd4aaf7ce5bd15315e47ad173baeb134ac40019d2e4906f32`
- real v0.15.49 installed `index.html` SHA-256: `8de7a8eb03e363b808439d48673a4808809d82db67bc1b7955e80414a8782906`
- compact zstd index delta SHA-256: `194d5ec7ed88418a468f9da1a5b04b0f5d604564813fae271cf30864b9582c24`
- real v0.15.49 `autosync-core.js` SHA-256: `a9f206df445d06eefc99ae55f1ceb3a7a5ff108a40a8393fa75ec413d2c4aba6`
- pinned Electron 38.7.2 Windows x64 SHA-256: `0401b898a8d83523694bd0afa6dc3035a54c57404a914725baa621c3378b5885`

The gate verifies Golden v0.15.135 raw-blob materialization, 236 manifest files/deletions, launcher promote-only behavior, actual Electron cold-start, stable Roaming userData identity, storage-root logging, absence of fatal load/index-contract errors, and canonical shadow payload presence without production activation.

## Installed persistence acceptance — green

`v0.16.0 Installed Persistence Acceptance` now proves the actual Chromium storage path, not merely static identity strings.

The deterministic privacy-safe fixture seeds a reconstructed v0.15.49 installation with:

- localStorage fixture/settings/history keys,
- IndexedDB database `aram-rating-research-v03`, store `kv`,
- checkpoint key `checkpoint-v03`,
- exactly **159 synthetic matches**,
- derived `rating-ui-latest-run-v01` state.

It then applies Golden v0.15.135 **in place**, boots the Golden app twice, and verifies after each restart that localStorage, the exact Research checkpoint, 159-match count, checkpoint stamp/hash, and derived latest-run data remain unchanged. The v0.15.117 state-integrity mirror is also verified at the actual Golden preload fallback root `%APPDATA%\ARAM Fearless Draft` while the real Chromium userData identity remains `%APPDATA%\aram-fearless-draft`.

No personal user data is contained in this fixture.

## AutoSync / updater / lifecycle deterministic soak — green

`tools/stability/autosync-updater-lifecycle-soak-audit.js` and its dedicated workflow are green and are also gated by Stability Foundation.

Current deterministic scope:

- AutoSync: 300 coordinator cycles, single-flight coalescing, cache caps, history dedupe/row caps, reset/no-inflight checks.
- Updater: 90 transaction cycles, including probation commits and forced rollback/snapshot-restore cycles.
- Lifecycle: 600 create/dispose cycles, duplicate-dispose rejection and beforeunload idempotence.
- Network requests: 0.
- League Client requests: 0.
- Research collection requests: 0.
- Automatic B2 collection: false.

This proves deterministic owner behavior but does **not** replace a real League/LCU timing test.

## Cutover readiness matrix

`tools/stability/cutover-readiness-audit.js` and `docs/V0160_CUTOVER_ELIGIBILITY.md` now enumerate:

- every canonical owner and its shadow/inactive state,
- Golden manifest/runtime dependencies,
- preserved storage/fallback identities,
- installed Windows and persistence evidence,
- remaining external/manual blockers.

Current result intentionally remains:

- `legacy_runtime_removal_eligible:false`
- `production_cutover_eligible:false`

Reason: the automated refactor proof is green, but canonical owners have not yet been activated in an isolated RC and real League/LCU + physical-PC acceptance has not been completed. Do not delete the Golden legacy runtime from the stabilization branch just to make the tree look cleaner.

## 20-step program status

1. **DONE** — v0.15.135 application-code Golden Baseline frozen.
2. **DONE** — repository inventory + runtime dependency/owner map.
3. **DONE/MAINTAIN** — functional-domain CI exists; historical release workflows remain historical/manual concerns and are not production owners.
4. **DONE/MAINTAIN** — stable semantic UI roles/contracts on canonical owners.
5. **DONE** — final assembled-runtime verification.
6. **DONE for CI scope** — Windows synthetic + reconstructed installed Windows cold-start green. Physical PC remains external acceptance.
7. **DONE for synthetic scope / MANUAL remaining** — six synthetic screenshot/semantic geometry checks; physical DPI/font/rendering check remains.
8. **DONE for deterministic CI scope / MANUAL LCU remaining** — rerender/resource soak and AutoSync/updater/lifecycle soak green; live LCU timing remains external.
9. **DONE in shadow** — privacy-safe diagnostics collector/panel + canonical shell owner.
10. **DONE for installed CI scope** — real Chromium localStorage + IndexedDB Research 159-checkpoint persistence proven across in-place update and two restarts.
11. **DONE/MAINTAIN** — Golden fingerprints + deterministic behavioral differential fixtures.
12. **DONE** — canonical `src/` tree + owner registry.
13. **DONE in shadow** — targeted subsystem canonical migration/owner consolidation.
14. **DONE/MAINTAIN** — hotfix intent absorbed into canonical owners rather than preserving patch-of-patch ownership.
15. **DONE/MAINTAIN** — legacy-vs-canonical shadow/differential gates active.
16. **BLOCKED BY RC/MANUAL ACCEPTANCE** — do not remove Golden active runtime until an isolated canonical RC is proven on physical Windows + real League/LCU and cutover is explicitly approved.
17. **PENDING RC CUTOVER DESIGN** — minimal reproducible v0.16 manifest/package follows an approved canonical activation design, not the shadow tree alone.
18. **IN PROGRESS** — automated RC prerequisites are green; isolated non-production RC candidate + physical-Windows/real-League acceptance remain.
19. **PENDING EXPLICIT APPROVAL** — production CLEAN BASELINE promotion.
20. **DONE/MAINTAIN** — single-owner/canonical rules and blocking CI gates exist; keep enforcing them after cutover.

## Exact next-work order

1. Freeze `ce40427e80e6bfcb9289dbb981503654e34a8c9e` as the automated-green shadow checkpoint.
2. Inspect/build an **isolated non-production v0.16 RC activation candidate** from that checkpoint. Do not relabel Golden v0.15.135 as v0.16; the RC must actually exercise canonical owners.
3. Run the full automated suite on the RC candidate: Foundation, Installed Windows, Installed Persistence, AutoSync/Updater Soak, Full Regression, AI Continuity, screenshot/rerender contracts.
4. Produce a physical-Windows test artifact/checklist and test real League Client/LCU AutoSync, reconnect/timing, userData persistence, DPI/font/rendering, RANDOM/DATA/Profile/Results/Research/DIAG smoke paths.
5. Only after successful manual evidence and explicit approval, activate canonical production owners/remove obsolete Golden runtime dependencies on an isolated cutover branch and rerun every gate.
6. Generate the minimal reproducible v0.16 package/manifest and final RC.
7. Production promotion only after explicit approval; never merge/cut over automatically.

## Fresh-chat continuation prompt

```text
칼바람 프로그램 v0.16.0 CLEAN BASELINE 계속.
저장소를 source of truth로 사용해.
production application-code Golden은 v0.15.135 commit 2048d56...이고 main HEAD 29d2e17...는 data refresh만 추가된 상태다.
작업 브랜치는 stability/v0160-clean-baseline-phaseb, PR #84, Issue #83.
latest fully-green automated checkpoint는 ce40427e80e6bfcb9289dbb981503654e34a8c9e이며 Foundation #574, Installed Windows #54, Installed Persistence #18, AutoSync Updater Soak #8, Full Regression #1014, AI Continuity #429가 같은 SHA에서 SUCCESS다.
canonical owners는 전부 shadow / production_active:false다.
installed persistence 159-match fixture와 deterministic soak/cutover-readiness matrix까지 완료됐다.
다음은 Golden을 v0.16이라고 이름만 바꾸는 게 아니라 canonical owners를 실제로 exercise하는 isolated non-production RC activation candidate 구조를 확인하고 구축하는 단계다.
main은 건드리지 말고, real League/LCU와 physical Windows acceptance 전에는 legacy active runtime을 삭제하거나 production cutover하지 마라.
```

## End-of-session continuity rule

Every substantial session must leave durable repository evidence containing current branch HEAD, latest fully-green code checkpoint + CI run numbers, newly completed scope, remaining manual/legacy scope, exact next task and whether production `main` changed. Chat memory is never the source of truth.
