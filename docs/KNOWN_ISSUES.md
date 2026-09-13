# KNOWN ISSUES / REGRESSION REGISTER

This file is a **handoff guardrail**, not a bug graveyard. A new AI/session must read it before changing runtime/UI code.

Status vocabulary:

- `OPEN` — known active defect.
- `VERIFY_REAL_WINDOWS` — code/CI is green, but the actual Electron screen still needs user evidence.
- `VERIFY_REAL_MATCH` — code/CI is green, but real League/LCU behavior still needs user evidence.
- `REGRESSION_GUARD` — historical defect is considered structurally addressed; do not reintroduce the old cause.
- `KNOWN_LIMITATION` — intentional limitation or stale baseline that must not be mistaken for current truth.

## KI-001 — RANDOM PICK visual/selection acceptance after single-owner reset

**Status:** `VERIFY_REAL_WINDOWS`

The v0.15.111–v0.15.114 sequence repeatedly changed RANDOM PICK layout/selection behavior and produced screenshot-confirmed failures: microscopic right rail, clipped grades, repeated champion names, DNA values that did not follow the clicked candidate, and content jumping/reparenting after click.

v0.15.115 intentionally retired that late overlay stack and restored a single-owner architecture. v0.15.121 then restores RANDOM entry/render/input/TOP5-result coordination inside the existing owners and makes the interaction listener set explicitly disposable. The code ownership and refresh-loop contracts are guarded by CI, but there is not yet a recorded final real-Windows acceptance screenshot/video after v0.15.121.

Do not claim this visual acceptance is complete until the user verifies:

- PICK and IN GAME remain isolated.
- grade labels are visible and not clipped.
- champion labels do not duplicate/concatenate.
- clicking different TOP5 candidates changes the selected name **and** DNA/AD-AP values.
- DNA/detail panels stay in one stable parent/position across repeated clicks.

## KI-002 — retired v0.15.103–v0.15.114 UI overlay stack

**Status:** `REGRESSION_GUARD`

Do not reactivate the following installed overlay owners as an independent UI stack:

`ui-layout-restore-v015103.js`, `random-data-ui-hotfix-v015105.js`, `random-data-ui-hotfix-v015106.js`, `view-boundary-repair-v015107.js`, `data-random-hardfix-v015108.js`, `ui-screenshot-polish-v015109.js`, `patch-notes-density-v015110.js`, `random-dna-rail-v015111.js`, `random-workspace-stability-v015112.js`, `random-workspace-readable-v015113.js`, `random-pick-integrity-v015114.js`.

The failure mode was multiple generations of click/change/input/timer repairs moving the same DOM. A future fix should extend the active owner or atomically replace it, not add another delayed repair owner.

## KI-003 — AutoSync/LCU/Live Client real-session soak after v0.15.119

**Status:** `VERIFY_REAL_MATCH`

v0.15.119 has code-level simulations for overlapping core ticks, duplicate endpoint coalescing, credential-epoch stale completion, and post-dispose renderer completion. CI passed.

Still verify in real repeated League sessions:

- reconnect does not create request storms.
- a stale response cannot replace a newer champ-select/in-game state.
- repeated champ-select → game → post-game transitions stay responsive.
- AutoSync remains usable after League Client reconnect/restart.

## KI-004 — real installed-app baseline is historical

**Status:** `KNOWN_LIMITATION`

The latest preserved real Windows installation snapshot is v0.15.49. The active updater is newer. Use `update/manifest.json` for the distributed runtime and use the v0.15.49 snapshot only for verified historical base DOM/installation facts.

If the user supplies a newer installed-app ZIP, preserve it as a new baseline; do not silently overwrite the historical baseline.

## KI-005 — CI is not visual proof

**Status:** `REGRESSION_GUARD`

A successful audit proves source contracts, ownership rules, simulations, and regression checks. It does **not** prove exact Windows Electron rendering, DPI/font behavior, real League Client timing, or remote asset availability.

For screenshot-driven UI defects, report CI success separately from real-Windows visual acceptance.

## KI-006 — context-loss / new-chat continuity

**Status:** `REGRESSION_GUARD`

Do not use prior conversation memory as the source of truth after a chat reset. Cold-start from `AGENTS.md` → `docs/CURRENT_STATE.md` → `update/current-state.json` → `update/manifest.json` → this file → `docs/AI_HANDOFF.md`, then inspect latest main/PR/CI.

If `docs/CURRENT_STATE.md` or `update/current-state.json` disagrees with `update/manifest.json`, the manifest wins for active distribution and the continuity snapshot must be regenerated with `node tools/sync-current-state.js` before development continues.

## Riot Grade mismatch before v0.15.122

Before v0.15.122 the collector recursively traversed the ChampionMasteryUpdate payload, so nested `memberGrades` could be stored under the local account and the match-detail card could choose a same-game row without requiring the played champion. v0.15.122 changes collection to primary-only and requires exact gameId + championId linkage. Historical rows from v0.15.121 and earlier are intentionally treated as unverified; a new real-game comparison is still required before marking the user-reported mismatch fully accepted.

## Startup Patch Notes notice v0.15.123 real-Windows acceptance

The v0.15.123 startup notice is structurally audited for per-patch persistence and routing through the existing DATA owner, but final Electron acceptance still requires confirming the popup visually and checking that `패치노트 보러가기` lands on DATA > 패치노트 in the installed Windows app.

## v0.15.123 main-process successor-route crash

Observed on real Windows after v0.15.123 activation: `main-v015123.js` threw `v0.15.123 main successor contract mismatch: v0.15.122 route missing` before UI creation. Root cause was brittle exact matching of an escaped nested route string; CI had only parsed the wrapper. v0.15.124 replaces that boot path with a tested predecessor-route transform. Real-Windows relaunch is still required to close acceptance.
