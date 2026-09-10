# ARAM Fearless Draft

League of Legends ARAM draft / practice / Match Lab / live in-game analysis / player coaching desktop app.

Current app/update version: **v0.15.72**  
Current balance/data patch: **26.17**

This repository is the source of truth for incremental in-app updates, regression validation, Windows distribution work, and coding-agent handoff.

## Engineering entry point

Read these first when continuing development:

1. `AGENTS.md` — engineering rules and invariants
2. `docs/AI_HANDOFF.md` — architecture and product direction
3. `docs/AI_HANDOFF_v0.15.72_ADDENDUM.md` — global UI/maximized-window freeze diagnosis and cross-view performance governor
4. `docs/AI_HANDOFF_v0.15.71_ADDENDUM.md` — real-game-only AutoSync transport governor
5. `docs/AI_HANDOFF_v0.15.70_ADDENDUM.md` — Random In-game single-owner runtime
6. `docs/AI_HANDOFF_v0.15.69_ADDENDUM.md` — historical Golden Guard autorun diagnosis
7. `docs/INSTALLED_BASELINE_v0.15.49.md` — verified installed base UI/core
8. `reference/installed-v0.15.49/` — exact installed Random Practice DOM fragments
9. `update/manifest.json` — active update payload and current version

## Current runtime direction

v0.15.50–v0.15.72 establish the compact Random Practice in-game coach, unified current item art, denser pick workflow, event-driven compatibility owners, AutoSync throttling, and global Windows responsiveness safeguards. The HUD is considered largely stabilized; new work should improve decision quality rather than restart a broad layout redesign unless explicitly requested.

Important recent stability changes:

- **v0.15.66**: replaced stacked historical item-art polling with a single active item-art owner.
- **v0.15.67**: first move/resize responsiveness attempt. Its software-rendering strategy is historical.
- **v0.15.68**: restored normal GPU compositing, removed continuous native `move`/`resize` work, moved the performance governor to the front of runtime injection, and reduces expensive visual effects only during native move/resize.
- **v0.15.69**: disabled the installed base UI's automatic 271-check Golden Guard at production startup and first Data-tab entry while retaining the manual regression button.
- **v0.15.70**: consolidated the heavily layered Random In-game runtime into one active-view owner while preserving the historical UI feature modules.
- **v0.15.71**: stabilized the real-game AutoSync path with single-flight renderer polling, once-per-game Match Lab persistence, stable UI dedupe and throttled LCU/Live Client reads.
- **v0.15.72**: treats the remaining freeze as a global renderer/compositor problem. Every injected overlay is tagged by source; feature-owned timers, MutationObservers and document-level interaction listeners sleep while their view is inactive; observer bursts are coalesced; overlapping Random Pick v0.15.49/55/58/68 watchers are consolidated; and large/maximized viewports automatically use a reduced-effects rendering mode with no backdrop blur, broad container shadows or transitions.

Recommendation, ban, team-score, item, threat, and purchase algorithms are unchanged by v0.15.66–v0.15.72 responsiveness work.

See `docs/CHANGELOG_v0.15.50.txt` through `docs/CHANGELOG_v0.15.72.txt` for release history.

## Distribution

The Windows bootstrap is distributed as `ARAM_Fearless_Draft.exe`. Historical bootstrap assets may lag behind the active runtime; `update/manifest.json` is authoritative for incremental application updates.
