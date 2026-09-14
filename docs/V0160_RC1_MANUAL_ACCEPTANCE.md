# v0.16.0 RC1 — Physical Windows / Real League Acceptance

RC1 is an **isolated non-production candidate**. It uses the verified v0.15.135 Golden shell plus selected canonical v0.16 renderer owners. It must not replace the normal installation yet.

## Data safety

- Close the normal ARAM Fearless Draft app before the first RC1 launch.
- RC1 copies `%APPDATA%\aram-fearless-draft` into `%APPDATA%\ARAM Fearless Draft RC1 Sandbox\aram-fearless-draft` on first launch.
- RC1 writes to the sandbox only.
- To recreate the sandbox from the current production state, launch the RC executable once with `--aram-rc1-reset-sandbox`.
- Do not delete the production `%APPDATA%\aram-fearless-draft` folder while testing.

## Required smoke test

1. Launch `START_RC1.cmd`.
2. Confirm the normal app UI opens and a `v0.16 RC1` badge appears at the top-right.
3. Click the RC badge. Confirm the diagnostic popup reports no RC errors and shows canonical DATA/DIAG activation.
4. Open RANDOM PICK. Enter party/pool values, calculate TOP5, click several candidates, and confirm selection/detail/DNA does not jump, duplicate, or freeze.
5. Switch RANDOM PICK ↔ IN GAME at least 10 times. Confirm no progressive slowdown or duplicate refresh behavior.
6. Open DATA. Switch `챔피언 티어리스트` ↔ `패치노트` repeatedly. Confirm only one DATA sub-navigation is visible, the tier browser hides only in Patch Notes mode, and the normal detail layout returns in Tier mode.
7. Open 전적검색 / Player Profile. Confirm recent matches, result cards, profile modal and Research card remain readable. If Research data exists, confirm the previous checkpoint/data is visible from the RC sandbox clone.
8. Open `UI 진단`. Confirm the panel opens, refreshes, and copies privacy-safe JSON without exposing raw PUUID/account identifiers.

## Real League Client / LCU test

1. Start the Riot/League Client and leave RC1 open.
2. Confirm AutoSync connects without repeated reconnect/request storms.
3. Enter champion select and then a standard ARAM game. Confirm RANDOM IN GAME follows the live champion/game state.
4. Finish the game. Confirm the newest match appears without requiring repeated full-history reloads.
5. Repeat at least two gameflow transitions or reconnect the League Client once. Confirm the UI remains responsive and stale state does not overwrite the newest state.
6. If Riot Grade is captured for a newly finished game, compare it directly with the League client grade; mismatches block promotion.

## Visual acceptance

Check Windows display scaling at the setting you normally use. Confirm there is no clipped text, overlapping panels, missing fonts, blank modal, broken item/champion images, or unexpectedly tiny/huge controls in RANDOM, DATA, Profile, Results, Research and diagnostics.

## Pass criteria

RC1 passes manual acceptance only when all core paths above work, no data loss is observed in the RC sandbox, real League/LCU transitions remain stable, and there is no visible regression that would make v0.15.135 safer to use.

If anything fails, keep the production installation unchanged and capture the RC badge state plus a screenshot and the `RC1_PROBE_SUCCESS.json` / diagnostics JSON when available.
