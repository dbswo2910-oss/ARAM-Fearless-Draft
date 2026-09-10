# ARAM Fearless Draft

League of Legends ARAM draft / practice / Match Lab / live in-game analysis / player coaching desktop app.

Current app/update version: **v0.15.73**  
Current balance/data patch: **26.17**

This repository is the source of truth for incremental in-app updates, regression validation, Windows distribution work, and coding-agent handoff.

## Engineering entry point

Read these first when continuing development:

1. `AGENTS.md` — engineering rules and invariants
2. `docs/AI_HANDOFF.md` — architecture and product direction
3. `docs/AI_HANDOFF_v0.15.73_ADDENDUM.md` — reproduced item-catalog hard-freeze diagnosis and fix
4. `docs/AI_HANDOFF_v0.15.72_ADDENDUM.md` — Random Practice stability consolidation and UI responsiveness work
5. `docs/AI_HANDOFF_v0.15.71_ADDENDUM.md` — real-game AutoSync transport governor
6. `docs/AI_HANDOFF_v0.15.70_ADDENDUM.md` — Random In-game single-owner runtime
7. `docs/AI_HANDOFF_v0.15.69_ADDENDUM.md` — historical Golden Guard autorun diagnosis
8. `docs/INSTALLED_BASELINE_v0.15.49.md` — verified installed base UI/core
9. `reference/installed-v0.15.49/` — exact installed Random Practice DOM fragments
10. `update/manifest.json` — active update payload and current version

## Current runtime direction

v0.15.50–v0.15.73 establish the compact Random Practice in-game coach, unified current item art, denser pick workflow, event-driven compatibility owners, and Windows responsiveness safeguards. The HUD is considered largely stabilized; new work should improve decision quality rather than restart a broad layout redesign unless explicitly requested.

Important recent stability changes:

- **v0.15.66**: replaced stacked historical item-art polling with a single active item-art owner.
- **v0.15.67**: first move/resize responsiveness attempt. Its software-rendering strategy is historical.
- **v0.15.68**: restored normal GPU compositing, removed continuous native `move`/`resize` work, moved the performance governor to the front of runtime injection, and reduces expensive visual effects only during native move/resize.
- **v0.15.69**: disabled the installed base UI's automatic 271-check Golden Guard at production startup and first Data-tab entry while retaining the manual regression button.
- **v0.15.70**: consolidates the heavily layered Random In-game runtime. Historical v0.15.50–v0.15.57 UI modules still provide their UI/features, but their recurring timers/observer/random-wide click scheduler are suppressed during bootstrap and replaced by one active-view heartbeat. The hidden legacy `renderRandomDetails()` and `renderRandomAnalysis()` paths are bypassed while Random In-game owns the screen. Exact clock/gold/respawn seconds update without rebuilding the whole coach, and the death-shop planner is throttled to the visible Build view.
- **v0.15.71**: follows the real-game-only freeze signal into AutoSync. Renderer polling is single-flight at 1250 ms, Match Lab live linkage writes once per complete game, stable AutoSync/account UI paints are deduped, and the main Core runs at 1200 ms with live identity/gameflow/event request throttles.
- **v0.15.72**: consolidates Random Practice pick maintenance, removes overlapping v49/v55/v58/v68 recurring observers/listeners, scopes unrelated updater/Data observers away from Random Practice, changes exhaustive TOP5 enumeration to cooperative time-sliced execution, and restores AutoSync party/current-pick visual state without changing score math.
- **v0.15.73**: fixes the first independently reproduced hard-freeze. `random-item-icons-v01556.js` could enter an unbounded Promise retry loop whenever the desktop item catalog returned `{ok:false}`. Failed catalog requests now fall back to text-only UI and retry slowly instead of monopolizing the renderer.

Recommendation, ban, team-score, item, threat, and purchase algorithms are unchanged by v0.15.66–v0.15.73 responsiveness work.

See `docs/CHANGELOG_v0.15.50.txt` through `docs/CHANGELOG_v0.15.73.txt` for release history.

## Distribution

The Windows bootstrap is distributed as `ARAM_Fearless_Draft.exe`. Historical bootstrap assets may lag behind the active runtime; `update/manifest.json` is authoritative for incremental application updates.
