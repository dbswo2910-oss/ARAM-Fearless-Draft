# ARAM Fearless Draft

League of Legends ARAM draft / practice / Match Lab / live in-game analysis / player coaching desktop app.

Current app/update version: **v0.15.79**  
Current balance/data patch: **26.17**

This repository is the source of truth for incremental in-app updates, regression validation, Windows distribution work, and coding-agent handoff.

## Engineering entry point

Read these first when continuing development:

1. `AGENTS.md` — engineering rules and invariants
2. `docs/AI_HANDOFF.md` — architecture and product direction
3. `docs/AI_HANDOFF_v0.15.79_ADDENDUM.md` — permanent safety baseline: transactional updater rollback, stable heartbeat, renderer circuit breakers, CI safety policy
4. `docs/AI_HANDOFF_v0.15.78_ADDENDUM.md` — BLACKBOX evidence-driven user-state fix + independent dual heartbeat watchdog
5. `docs/AI_HANDOFF_v0.15.77_ADDENDUM.md` — renderer blackbox, CDP freeze stack capture, fault-isolated runtime loader
6. `docs/STABILITY_AUDIT_v0.15.77.md` — full freeze-risk audit and remaining instrumented risks
7. `docs/AI_HANDOFF_v0.15.75_ADDENDUM.md` — freeze-log-grounded IN GAME transition isolation + durable stage codes
8. `docs/AI_HANDOFF_v0.15.74_ADDENDUM.md` — remaining item-catalog retry freeze guard + main-process watchdog
9. `docs/AI_HANDOFF_v0.15.73_ADDENDUM.md` — reproduced item-catalog hard-freeze diagnosis and first fix
10. `docs/AI_HANDOFF_v0.15.72_ADDENDUM.md` — Random Practice stability consolidation and UI responsiveness work
11. `docs/AI_HANDOFF_v0.15.71_ADDENDUM.md` — real-game AutoSync transport governor
12. `docs/AI_HANDOFF_v0.15.70_ADDENDUM.md` — Random In-game single-owner runtime
13. `docs/AI_HANDOFF_v0.15.69_ADDENDUM.md` — historical Golden Guard autorun diagnosis
14. `docs/INSTALLED_BASELINE_v0.15.49.md` — verified installed base UI/core
15. `reference/installed-v0.15.49/` — exact installed Random Practice DOM fragments
16. `update/manifest.json` — active update payload and current version

## Current runtime direction

v0.15.50–v0.15.79 establish the compact Random Practice in-game coach, unified current item art, denser pick workflow, event-driven compatibility owners, Windows responsiveness safeguards, and a permanent update/runtime safety baseline. The HUD is considered largely stabilized; new work should improve decision quality rather than restart a broad layout redesign unless explicitly requested.

Important recent stability changes:

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

Recommendation, ban, team-score, item, threat, and purchase algorithms are unchanged by v0.15.66–v0.15.79 responsiveness/safety work.

See `docs/CHANGELOG_v0.15.50.txt` through `docs/CHANGELOG_v0.15.79.txt` for release history.

## Distribution

The Windows bootstrap is distributed as `ARAM_Fearless_Draft.exe`. Historical bootstrap assets may lag behind the active runtime; `update/manifest.json` is authoritative for incremental application updates.
