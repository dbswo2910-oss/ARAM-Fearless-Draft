# ARAM Fearless Draft — AI / Coding Agent Entry Point

Read this file before editing the repository.

## Mandatory cold-start / new-chat protocol

**Repository state wins over conversational memory.** A prior chat summary, remembered version number, or old screenshot is never authoritative over the current repository.

Before changing code in a fresh session, read in this order:

1. `docs/CURRENT_STATE.md` — compact human-readable current state and unresolved acceptance checks.
2. `update/current-state.json` — machine-readable active owners/version/safety lineage.
3. `update/manifest.json` — authoritative active in-app distribution.
4. `docs/KNOWN_ISSUES.md` — active verification work and historical regression signatures.
5. `docs/AI_HANDOFF.md` — long-form architecture/history/product decisions.
6. `docs/NEW_CHAT_BOOTSTRAP.md` — reusable fresh-chat prompt and restore procedure.
7. Latest `main` commit, latest merged PR, and relevant GitHub Actions results.

Before editing, give a short internal/pre-work checkpoint: active version, active subsystem owners, unresolved real-Windows/real-match validation, planned next work, and whether the requested change touches scoring/UI/state/AutoSync.

If the compact state files disagree with `update/manifest.json`, **the manifest wins for active distribution** and the continuity snapshot must be regenerated with:

```bash
node tools/sync-current-state.js
```

Do not patch through a state conflict without resolving it first.

## Source-of-truth hierarchy

When sources disagree:

1. A newly supplied real installed-app snapshot from the user for facts about that specific installation.
2. `update/manifest.json` for the current distributed runtime.
3. `update/current-state.json` / `docs/CURRENT_STATE.md` for generated cold-start ownership/version state.
4. Current active source files referenced by the manifest.
5. `docs/KNOWN_ISSUES.md` for acceptance state and regression warnings.
6. `docs/AI_HANDOFF.md` for architecture/history/product direction.
7. Historical `update/v*/`, old changelogs, old screenshots, and conversation memory.

The user's installed `appfiles/manifest.json` may be stale. Verify installed runtime from `main.js` / `package.json`; verify active distribution from repository `update/manifest.json`.

## Critical engineering rules

- **Accuracy over speed.** Inspect the active owner/source and relevant regression history before patching. Do not create a quick overlay just because it is faster.
- Never infer installed UI structure from screenshots alone when a verified baseline/DOM map is available.
- Prefer exact IDs/classes from the installed baseline. Avoid broad text/regex DOM discovery that can capture parent panels.
- Preserve recommendation/balance logic for UI/infrastructure-only requests and explicitly document whether scoring changed.
- Do not declare a visual/runtime issue fully fixed from CI alone when real-Windows evidence is still pending.
- Before reporting a GitHub update complete, verify the intended changes are on `main`, the active manifest/package are consistent, the new audit is green, and Full Regression Audit is green.
- If a newer real installed-app ZIP is supplied, preserve it as a new baseline rather than silently replacing historical baseline documentation.

## Current active ownership baseline

Always verify against `docs/CURRENT_STATE.md` and `update/current-state.json`; the names below describe the current architecture contract.

- RANDOM PICK DOM/state owner: `runtime-v015100` lineage under the **v0.15.115 single-owner baseline**.
- DATA boundary/presentation owner: `ui-stability-v015115`.
- Persistent-state integrity owner: `state-integrity-v015117`.
- Renderer resource lifecycle owner: `resource-lifecycle-v015118`.
- AutoSync main-process concurrency owner: `autosync-concurrency-v015119`.
- AutoSync renderer owner: `runtime-live-autosync-v01571+v015119` under the v0.15.118 lifecycle contract.
- Permanent runtime/update safety root: **v0.15.79**.

Do not add another module that competes for one of these ownership domains. Extend the owner or intentionally and atomically replace it with matching audits/documentation.

## Retired RANDOM/DATA overlay lineage

The v0.15.103–v0.15.114 late UI overlay stack is historical and must not be restored as independent active owners. In particular, do not reintroduce click/change/input handlers plus delayed `setTimeout` / `requestAnimationFrame` DOM repair passes that move the same RANDOM containers after interaction.

The retired installed overlay names are tracked in `docs/KNOWN_ISSUES.md` and `update/current-state.json` and are guarded as deleted by the active manifest.

## Verified installed baseline

Latest preserved real installed-app snapshot supplied by the user: **v0.15.49**.

- `docs/INSTALLED_BASELINE_v0.15.49.md`
- `reference/installed-v0.15.49/random-practice-pick-fragment.html`
- `reference/installed-v0.15.49/random-practice-ingame-fragment.html`
- Baseline `index.html`: 35,359,059 bytes
- SHA-256: `8de7a8eb03e363b808439d48673a4808809d82db67bc1b7955e80414a8782906`

Important Random Practice pick IDs:

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

Important Random Practice in-game IDs:

- `#randomIngameShell`
- `#randomLiveTopbar`
- `#randomIngameSubnav`
- `#randomLiveSummary`
- `#randomLiveBuildAdvice`
- `#randomThreatList`
- `#randomFightGuide`
- `#randomTimingPanel`
- `#randomPowerCurve`

Read both exact DOM fragments before changing Random Practice layout.

## Product/UI direction

The product is an operational decision dashboard, not a vertically stacked report.

- Draft: compact two-column workflow; pick judgment uses tabs.
- Random Practice PICK: team state + candidate pool + TOP5 first; detail should not compete with primary decisions.
- Random Practice IN GAME: one-glance coach HUD; alive state should be readable in roughly 1–2 seconds.
- Secondary information belongs behind tabs/collapse/detail actions.
- Avoid duplicate information/artwork.
- Red styling is reserved for genuinely high-priority danger.
- Item UI uses current Riot-client art plus short text; image failure must not destroy the text fallback.
- Do not begin another major HUD/layout redesign unless the user explicitly asks.

## v0.15.79 permanent safety baseline

- Updates are transactional and snapshot the previous installation before patching.
- New versions must survive the dual-heartbeat probation window.
- A safety failure during probation must block commit and preserve next-boot rollback ability.
- Renderer/runtime patches are injected independently; one optional patch failure must not automatically crash the whole process.
- Do not remove or bypass the safety root when adding successors.

## v0.15.115 single-owner UI baseline

- RANDOM PICK layout/selection/DNA ownership is single-owner. Do not layer a second RANDOM DOM repair system on top.
- DATA boundary/presentation ownership belongs to `ui-stability-baseline-v015115.js`.
- Do not reparent `#randomInputAnchor`, `#poolInputs`, `#comboResults`, `#comboDetail`, or `#rpPickIntelV01589` from a new competing click/timer repair layer.
- A future architecture change must atomically replace the owner and update `tools/v015115-single-owner-stability-audit.js`.
- `score_logic_changed:false`, `random_scoring_changed:false` unless the user explicitly requests scoring changes.

## v0.15.116 runtime/update integrity baseline

- Critical renderer readiness failures must be persisted through the update-safety channel, not only logged.
- Probation must re-check current-boot safety failure before `PROBATION_COMMIT`.
- Updater manifests reject duplicate targets, install/delete overlap, unsafe sources, malformed optional SHA-256 values, duplicate deletes, and critical runtime-file deletion.
- Changes require updating `tools/v015116-runtime-update-stability-audit.js`.

## v0.15.117 persistent-state integrity baseline

- A malformed JSON read must not silently replace persisted state with empty/default data when a validated last-known-good copy exists.
- Intentional removals remain tombstoned; recovery must not resurrect deliberately deleted state.
- Main-process state writes use atomic write + validation + LKG/quarantine behavior.
- State integrity is not a UI owner and must not reparent DOM or start unrelated polling.
- Changes require updating `tools/v015117-state-integrity-audit.js`.

## v0.15.118 resource lifecycle baseline

- Recurring renderer work has one clear owner and an idempotent cleanup path.
- Repeated one-shot refreshes are coalesced rather than stacked.
- Inactive/background views do not run full-speed UI heartbeats.
- Long-lived MutationObserver/PerformanceObserver instances must be disconnectable.
- `resource-lifecycle-v015118.js` is infrastructure only: no DOM reparenting, no scoring changes.
- Changes require updating `tools/v015118-resource-lifecycle-audit.js`.

## v0.15.119 AutoSync concurrency baseline

- Main-process AutoSync ticks are single-flight.
- Equivalent in-flight identity/party, credential, gameflow, and Live Client GET requests are coalesced.
- Credential rotation is a connection-epoch boundary; old-epoch endpoint completion is not trusted as current state without retry.
- Reconnect/network failures use bounded backoff; no retry storms.
- Renderer poll completion from a disposed/replaced lifecycle epoch is dropped before downstream Random Practice fan-out.
- v0.15.119 is infrastructure-only: no RANDOM/DATA DOM ownership and no scoring changes.
- Changes require updating `tools/v015119-autosync-concurrency-audit.js`.

## Real-world acceptance boundary

Consult `docs/KNOWN_ISSUES.md` before claiming completion.

Current important rule: CI can prove source contracts and simulations, but it cannot prove exact Electron DPI/font/layout behavior or real League Client timing. Screenshot-driven UI changes and real-client timing changes must keep their real-world validation status explicit until the user verifies them.

## Release / activation continuity contract

For every future app release, especially **v0.15.120+**:

1. Patch from the current active owner/lineage rather than an old directory chosen by version number alone.
2. Add/update the feature/stability audit.
3. Update Full Regression Audit when a new durable contract is introduced.
4. In the activation workflow, mutate `update/manifest.json` and package/runtime sources as needed.
5. **After manifest mutation and before the release metadata commit, run:**

```bash
node tools/sync-current-state.js
node tools/ai-continuity-audit.js
```

6. Commit `docs/CURRENT_STATE.md` and `update/current-state.json` with the release metadata when they changed.
7. Keep `docs/continuity-manual.json` current when real-world validation status or next planned work changes.
8. Run the new audit, predecessor audits, and Full Regression Audit before declaring completion.

`tools/ai-continuity-audit.js` enforces that v0.15.120+ activation workflows include the continuity sync call.

## Long-form historical context

`docs/AI_HANDOFF.md` contains the detailed release history, product decisions, old UI layers, shop/item rules, and prior failure analysis. Use it after the compact cold-start files above; do not rebuild current state by reading the historical document from top to bottom and guessing which old layer is still active.

## v0.15.120 DATA submenu baseline

- DATA presentation is still owned by `ui-stability-v015115`; v0.15.120 is a maintained owner revision, not a competing overlay.
- Discover the role-tier branch only inside exact `#data`, then resolve its nearest common ancestor with exact `#dataCard`. Never restore document-wide panel-title discovery.
- `#dataHubTopNavV015115` belongs inside that common host and spans all host columns. In Patch Notes mode, hide the tier branch and let the detail/Patch Notes branch span the workspace.
- Do not restore `card.closest('.grid2')` as the DATA host shortcut; the Windows screenshot proved it can resolve the right/detail sub-grid and strand the tier browser on the left.
- Do not reactivate v0.15.103-v0.15.114 UI overlays. RANDOM, Riot-grade, history-sync, AutoSync and scoring are outside v0.15.120 scope.
- CI proves structure/regression contracts, not final Electron appearance. Require post-update Windows evidence before visual acceptance.

## v0.15.121 RANDOM Practice restore baseline

- RANDOM PICK DOM/selection ownership remains `runtime-v015100` under the v0.15.115 single-owner boundary.
- Runtime interaction/refresh coordination remains the v0.15.72 coordinator, revised by v0.15.121; do not add a second Random refresh owner.
- Entering RANDOM may restore current inputs/TOP5/detail once, then ordinary interaction uses one coalesced maintenance timer.
- Random click/change/input/focus/visibility listeners must be explicitly disposable through the v0.15.118 lifecycle owner.
- Do not restore subtree MutationObserver repair loops, setInterval refresh loops, or the retired v0.15.103-v0.15.114 DOM reparent overlays.
- The cooperative exhaustive TOP5 calculation and recommendation/Random scoring math are unchanged.
- CI validates source/lifecycle contracts only; final PICK interaction/visual acceptance still requires real-Windows evidence.

## v0.15.122 Riot Grade accuracy baseline

- Treat only the direct LCU ChampionMasteryUpdate grade as the user's actual Riot Grade. `memberGrades` are not local-player truth and must never be recursively collected.
- Authoritative grade rows use `gradeProvenance: riot-primary-update`. v0.15.121-and-earlier rows without that provenance are legacy/unverified and may be retained for diagnostics but must not drive displayed Riot Grade or calibration.
- Link Riot Grade to a match only with local account + canonical gameId + exact championId. If championId is unavailable or no exact authoritative record exists, display no Riot Grade rather than guessing.
- Riot Grade remains an external validation label only. Do not feed it into ROLE, recommendation, champion, item, or RANDOM scoring without a separate explicit request.
- Preserve v0.15.121 RANDOM restore, v0.15.120 DATA owner, v0.15.119 AutoSync concurrency, v0.15.118 lifecycle, v0.15.117 state integrity, and v0.15.79 permanent safety contracts.
- CI proves parser/matching contracts. Final real-world acceptance requires one newly completed League game where the Riot client grade and v0.15.122 card are compared directly.

## v0.15.123 Startup Patch Notes notice baseline

- The startup Patch Notes modal is presentation-only and must not become a second DATA layout owner. Route Patch Notes opening through `window.aramUiStabilityV015115.syncData('patch')`.
- Persist `다시 보지 않기` by exact Patch Notes version, not by app release version. A future Patch Notes version must be eligible to show again automatically.
- Closing the modal or choosing `패치노트 보러가기` must not silently persist do-not-show state; only the explicit do-not-show action may do that.
- Keep the startup notice injection before the v0.15.117 state-integrity suffix and do not add MutationObserver/setInterval repair loops.
- Preserve v0.15.122 Riot Grade accuracy, v0.15.121 RANDOM restore, v0.15.120 DATA owner, v0.15.119 AutoSync concurrency, v0.15.118 lifecycle, v0.15.117 state integrity, and v0.15.79 safety contracts.
- CI can prove storage/routing/injection contracts, but final popup appearance and DATA navigation require real-Windows confirmation.

## v0.15.124 Main successor boot-smoke rule

- Never accept a new `main-v*` successor wrapper from `new Function`/syntax checks alone. Execute the exact successor transform against the real predecessor source and require exactly one route match.
- For recovery from the v0.15.123 crash, `main-v015124.js` intentionally uses `main-v015122.js` as its runtime recovery base while preserving v0.15.123 presentation behavior through the runtime-source-stability chain.
- Do not reintroduce nested escaped-string exact matching for successor routes. Match a small unique semantic route fragment and assert cardinality equals one.

## v0.15.125 ARAM statistical baseline ownership

- `runtime-source-stability-v015125.js` owns only the RANDOM in-game statistical baseline source used by `statBuildFor` in `random-ingame-coach-v01550.js`. Do not move RANDOM composition/champion scoring, ROLE scoring, DATA view ownership, AutoSync ownership, or Riot Grade logic into this layer.
- The primary data artifact is `data/aram-builds/current.json`: standard ARAM only; `ARAM_MAYHEM` must remain explicitly excluded; a publishable cache must cover the full current roster (170+ and 173 at the initial 26.18 release).
- Do not fetch OP.GG or another statistics provider in the live render loop. Use bundled cache synchronously; an external freshness check may run once per app session and must fail closed to the bundled/embedded fallback.
- Provider patch labels may use Riot static-data numbering (for example OP.GG/Data Dragon 16.18) while the public client patch is 26.18. Treat the +10 major alias as equivalent only when the minor version matches.
- New main successors must continue the v0.15.124 boot-smoke rule: transform the known-good v0.15.122 entry and execute the exact successor transform in CI.

- Updater delivery for the ARAM cache must use the mirrored `update/data/aram-builds/current.json` source. Do not point an active manifest source directly at `data/`; the v0.15.116 updater allowlist intentionally rejects non-`update/` sources. Keep the canonical `data/` cache and the `update/data/` distribution mirror byte-identical.

## v0.15.128 Match-history latency baseline

- Match-history latency work extends the existing `autosync-concurrency-v015119` owner; do not create a second main-process AutoSync/history request owner.
- Session-cached history is a display hint, not authority: paint compatible cached rows first, then always perform a fresh bounded interactive lookup.
- The interactive lookup scans only the recent window first; if it does not fill the requested list, deep historical scanning runs as one coalesced background backfill and yields while an interactive history request is in flight.
- RANDOM post-game result synchronization should probe only the newest current-account standard-ARAM match first, merge that result into the cached history, and retain the existing full history loader as fallback.
- Equivalent in-flight history calls must coalesce, stale searched-account completions must not overwrite a newer target, and no new recurring `setInterval` / `MutationObserver` repair loop may be added.
- Expose timing/counter telemetry for diagnosis, but do not feed it into gameplay scoring.
- `score_logic_changed:false`, `random_scoring_changed:false`; item recommendation, Riot Grade, RANDOM composition/champion scoring and DATA ownership remain unchanged.
- CI proves cache/priority/probe/concurrency contracts only. Perceived speed and post-game freshness still require a real League Client session before acceptance.


## v0.15.133 real-Windows Patch Notes shell rule

- Keep DATA ownership in `ui-stability-v015115`; do not create a new Patch Notes overlay owner.
- A shell title may be nested between `#dataCard` and the resolved DATA detail branch. Do not assume it is only a direct child.
- In Patch Notes mode, hide only generic `챔피언 상세 / 닫기` shell titles found on that exact ancestry; do not text-scan the whole document.
- Use an inline `display:none!important` (plus hidden/aria-hidden) for the shell row because the real Windows stylesheet can override the HTML `hidden` attribute with an important display rule.
- Restore the shell title when returning to Champion Tier List.
- Keep scoring, RANDOM scoring, Rating math, AutoSync and item recommendation behavior unchanged.
