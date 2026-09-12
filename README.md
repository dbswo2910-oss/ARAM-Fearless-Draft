# ARAM Fearless Draft

League of Legends ARAM draft / practice / Match Lab / live in-game analysis / player coaching desktop app.

Current app/update version: **v0.15.96**  
Current balance/data patch: **26.17**

This repository is the source of truth for incremental in-app updates, regression validation, Windows distribution work, and coding-agent handoff.

## Engineering entry point

Read these first when continuing development:

1. `AGENTS.md` — engineering rules and invariants
2. `docs/AI_HANDOFF.md` — architecture and product direction
3. `docs/AI_HANDOFF_v0.15.96_ADDENDUM.md` — IN GAME post-match result refresh, bounded retry, and stale-result protection
4. `docs/AI_HANDOFF_v0.15.91_ADDENDUM.md` — RANDOM pick window/queue/TOP5 stability and approved reference-layout contract
5. `docs/AI_HANDOFF_v0.15.89_ADDENDUM.md` — RANDOM pick command center, composition intel rail, responsive hierarchy, and regression contract
6. `docs/AI_HANDOFF_v0.15.83_ADDENDUM.md` — IN GAME champion portraits, visual target cues, roster strip, and preview behavior
7. `docs/AI_HANDOFF_v0.15.79_ADDENDUM.md` — permanent safety baseline: transactional updater rollback, stable heartbeat, renderer circuit breakers, CI safety policy
8. `docs/AI_HANDOFF_v0.15.78_ADDENDUM.md` — BLACKBOX evidence-driven user-state fix + independent dual heartbeat watchdog
9. `docs/AI_HANDOFF_v0.15.77_ADDENDUM.md` — renderer blackbox, CDP freeze stack capture, fault-isolated runtime loader
10. `docs/STABILITY_AUDIT_v0.15.77.md` — full freeze-risk audit and remaining instrumented risks
11. `docs/AI_HANDOFF_v0.15.75_ADDENDUM.md` — freeze-log-grounded IN GAME transition isolation + durable stage codes
12. `docs/AI_HANDOFF_v0.15.74_ADDENDUM.md` — remaining item-catalog retry freeze guard + main-process watchdog
13. `docs/AI_HANDOFF_v0.15.73_ADDENDUM.md` — reproduced item-catalog hard-freeze diagnosis and first fix
14. `docs/AI_HANDOFF_v0.15.72_ADDENDUM.md` — Random Practice stability consolidation and UI responsiveness work
15. `docs/AI_HANDOFF_v0.15.71_ADDENDUM.md` — real-game AutoSync transport governor
16. `docs/AI_HANDOFF_v0.15.70_ADDENDUM.md` — Random In-game single-owner runtime
17. `docs/AI_HANDOFF_v0.15.69_ADDENDUM.md` — historical Golden Guard autorun diagnosis
18. `docs/INSTALLED_BASELINE_v0.15.49.md` — verified installed base UI/core
19. `reference/installed-v0.15.49/` — exact installed Random Practice DOM fragments
20. `update/manifest.json` — active update payload and current version

## Current runtime direction

v0.15.50–v0.15.79 establish the compact Random Practice in-game coach, unified current item art, denser pick workflow, event-driven compatibility owners, Windows responsiveness safeguards, and a permanent update/runtime safety baseline. v0.15.80–v0.15.96 build on that baseline with current-only item visuals, role/core-stage aware item recommendations, the IN GAME command center, champion-portrait guidance, build-route adoption, a premium RANDOM pick command center, and a post-match Result dashboard with active Match Lab synchronization. Future work should improve decision quality while preserving the v0.15.79 safety baseline.

Important recent stability and feature changes:

- **v0.15.66**: replaced stacked historical item-art polling with a single active item-art owner.
- **v0.15.67**: first move/resize responsiveness attempt. Its software-rendering strategy is historical.
- **v0.15.68**: restored normal GPU compositing, removed continuous native `move`/`resize` work, moved the performance governor to the front of runtime injection, and reduces expensive visual effects only during native move/resize.
- **v0.15.69**: disabled the installed base UI's automatic 271-check Golden Guard at production startup and first Data-tab entry while retaining the manual regression button.
- **v0.15.70**: consolidates the heavily layered Random In-game runtime. Historical v0.15.50–v0.15.57 UI modules still provide their UI/features, but their recurring timers/observer/random-wide click scheduler are suppressed during bootstrap and replaced by one active-view heartbeat.
- **v0.15.71**: follows the real-game-only freeze signal into AutoSync. Renderer polling is single-flight at 1250 ms, Match Lab live linkage writes once per complete game, stable AutoSync/account UI paints are deduped, and the main Core runs at 1200 ms with live identity/gameflow/event request throttles.
- **v0.15.72**: consolidates Random Practice pick maintenance, removes overlapping v49/v55/v58/v68 recurring observers/listeners, scopes unrelated updater/Data observers away from Random Practice, changes exhaustive TOP5 enumeration to cooperative time-sliced execution, and restores AutoSync party/current-pick visual state without changing score math.
- **v0.15.73**: fixes the first independently reproduced hard-freeze. `random-item-icons-v01556.js` could enter an unbounded Promise retry loop whenever the desktop item catalog returned `{ok:false}`.
- **v0.15.74**: fixes the remaining active unconditional catalog retry in the v0.15.53 death-shop layer, throttles failed catalog re-entry in v0.15.57/v0.15.66, and adds a main-process freeze watchdog.
- **v0.15.75**: uses the v0.15.74 freeze log to isolate the `champ_select → in_game` transition. Once a live game begins, AutoSync no longer synchronously re-enters Random Practice TOP5, analysis, or legacy detail rendering while the v0.15.70 in-game owner is active.
- **v0.15.77**: after freezes persisted even with live analysis hard-disabled, moves from speculative subsystem fixes to structural diagnosis. Runtime overlays are injected independently with deterministic `RTI-###` codes, cleanup/finalization is mandatory, document-wide item/profile MutationObservers are scoped, renderer heartbeat is single-flight, and Chromium Debugger is armed while healthy so `FRZ-003` can persist the exact running JavaScript call stack on a freeze.
- **v0.15.78**: uses the first actionable v0.15.77 BLACKBOX error. `lolAutoSyncPoll → aramTrackLinkedGame → activateOwner → applyUserState → renderAll` was restoring per-user state through the monolithic full-app renderer after some legacy counters had already been removed from the DOM. Owner activation is now deferred out of the linked-game call stack, user-state UI restoration is staged without `renderAll()`/TOP5 re-entry, legacy counters are null-safe, and a separate watchdog process classifies main-only, renderer-only, or whole-app heartbeat stalls.
- **v0.15.79**: freezes v0.15.78 behavior as the safety baseline for future feature work. Updates become transactional: before future patch files are written, the current installation is persistently snapshotted; a new version must survive a dual-heartbeat probation window, and an abnormal boot or watchdog hang can restore the previous snapshot on the next launch. Heavy renderer entry points also gain non-reentry, slow-call telemetry, and repeated-error/critical-block circuit breakers. CI now rejects regressions that remove this safety layer or reintroduce forbidden live `renderAll()`/new document-wide observer paths.
- **v0.15.80**: forces current item artwork in the active IN GAME item surfaces, removes legacy visual fallback paths, and fixes item ID/name/art mismatches and duplicate core display.
- **v0.15.81**: introduces the role/core-stage aware Item Recommendation Engine v2 so early cores preserve champion build identity while later situational defensive items remain available when justified.
- **v0.15.82**: rebuilds IN GAME into a command center centered on current judgment, player action, Threat TOP3, live build direction, and death-return planning.
- **v0.15.83**: adds champion portraits to the local-player card, Threat TOP3, inline named targets, death-return guidance, and ally/enemy team-composition strips. Preview and live use the same renderer.
- **v0.15.84–v0.15.86**: align the IN GAME reference layout, enlarge the fight-status board, and introduce a dedicated build-analysis tab that separates statistical baseline from current-match optimization.
- **v0.15.87**: makes valid completed user purchases a new build anchor so a deliberate B-route choice stops the app from repeatedly forcing the original A route.
- **v0.15.88**: removes duplicated champion labels in RANDOM quick judgment without changing scoring.
- **v0.15.89**: redesigns RANDOM > 픽창 as a command center with a factual composition-intel rail, stronger party/pool hierarchy, clearer TOP5 ranking, responsive desktop layouts, and the existing scoring/AutoSync/manual-lock contracts preserved.
- **v0.15.90**: realigns RANDOM > 픽창 to the approved reference hierarchy: left team state, center remaining-candidate + compact TOP5 stack, right composition DNA, and six-card selection judgment; canonical champion labels prevent overlapped names such as `오리아나오오리아나`.
- **v0.15.91**: fixes the real Windows follow-up: queue selector clipping, window-mode reference-layout collapse, oversized TOP5 rows, TOP5 champion click bubbling, and queue-change errors while keeping scoring unchanged.
- **v0.15.95**: replaces the old IN GAME detail tab with a post-match Result dashboard that reuses Match Lab history for the latest result, final build, recent games, trend, and improvement guidance.
- **v0.15.96**: fixes the missing post-game data refresh in v0.15.95. Game end now actively refreshes current-account standard-ARAM Match Lab history with bounded retries, checks the returned game id against the just-finished session when available, and blocks a stale previous match from being presented as the new result.

Draft/pick/ban/team scoring is unchanged by v0.15.80–v0.15.96 except where explicitly documented for item recommendations; v0.15.95–v0.15.96 only change IN GAME result presentation/synchronization and do not alter scoring.

See `docs/CHANGELOG_v0.15.50.txt` through `docs/CHANGELOG_v0.15.96.txt` for release history.

## Distribution

The Windows bootstrap is distributed as `ARAM_Fearless_Draft.exe`. Historical bootstrap assets may lag behind the active runtime; `update/manifest.json` is authoritative for incremental application updates.
