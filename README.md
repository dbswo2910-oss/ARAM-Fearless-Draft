# ARAM Fearless Draft

League of Legends ARAM draft / practice / Match Lab / live in-game analysis / player coaching desktop app.

Current app/update version: **v0.15.69**  
Current balance/data patch: **26.17**

This repository is the source of truth for incremental in-app updates, regression validation, Windows distribution work, and coding-agent handoff.

## Engineering entry point

Read these first when continuing development:

1. `AGENTS.md` — engineering rules and invariants
2. `docs/AI_HANDOFF.md` — architecture and product direction
3. `docs/AI_HANDOFF_v0.15.69_ADDENDUM.md` — latest real-Windows freeze diagnosis and fix
4. `docs/INSTALLED_BASELINE_v0.15.49.md` — verified installed base UI/core
5. `reference/installed-v0.15.49/` — exact installed Random Practice DOM fragments
6. `update/manifest.json` — active update payload and current version

## Current runtime direction

v0.15.50–v0.15.69 establish the compact Random Practice in-game coach, unified current item art, denser pick workflow, event-driven compatibility owners, and Windows responsiveness safeguards. The HUD is considered largely stabilized; new work should improve decision quality rather than restart a broad layout redesign unless explicitly requested.

Important recent stability changes:

- **v0.15.66**: replaced stacked historical item-art polling with a single active item-art owner.
- **v0.15.67**: first move/resize responsiveness attempt. Its software-rendering strategy is historical.
- **v0.15.68**: restored normal GPU compositing, removed continuous native `move`/`resize` work, moved the performance governor to the front of runtime injection, and reduces expensive visual effects only during native move/resize.
- **v0.15.69**: real installed diagnostics identified the base UI's 271-check Golden Guard as an unsafe production autorun. Electron no longer executes the synchronous suite 30 ms after startup or automatically on first Data-tab entry. The existing `전체 테스트 다시 실행` button remains available for intentional validation. The installed `index.html` is backed up before two exact autorun markers are patched.

Recommendation, ban, team-score, item, threat, and purchase algorithms are unchanged by v0.15.66–v0.15.69 responsiveness work.

See `docs/CHANGELOG_v0.15.50.txt` through `docs/CHANGELOG_v0.15.69.txt` for release history.

## Distribution

The Windows bootstrap is distributed as `ARAM_Fearless_Draft.exe`. Historical bootstrap assets may lag behind the active runtime; `update/manifest.json` is authoritative for incremental application updates.
