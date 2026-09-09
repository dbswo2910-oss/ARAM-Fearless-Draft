# ARAM Fearless Draft

League of Legends ARAM draft / practice / Match Lab / live in-game analysis / player coaching desktop app.

Current app/update version: **v0.15.50**  
Current balance/data patch: **26.17**

This repository is used for source control, automated regression validation, incremental in-app updates, Windows x64 distribution work, and durable AI/coding-agent handoff.

## AI / coding-agent entry point

If ChatGPT, Codex, Claude, Gemini, or another coding agent is continuing this project, read these first:

1. **`AGENTS.md`** — source-of-truth rules and current engineering constraints
2. **`docs/AI_HANDOFF.md`** — architecture, recent design decisions, and workflow
3. **`docs/INSTALLED_BASELINE_v0.15.49.md`** — verified real Windows installation baseline
4. **`reference/installed-v0.15.49/random-practice-pick-fragment.html`** — exact installed Random Practice pick DOM fragment
5. **`reference/installed-v0.15.49/random-practice-ingame-fragment.html`** — exact installed Random Practice in-game DOM fragment
6. **`update/manifest.json`** — active in-app updater channel

Do not infer Random Practice DOM from screenshots or broad Korean-title matching while exact baseline fragments are available.

## Current in-game direction

v0.15.50 starts the compact **In-game Coach HUD** redesign:

- alive → compact LIVE decisions
- dead → automatic Build/analysis view
- respawn <= 7s → compact LIVE preparation view
- 3 visible tabs: `LIVE / 빌드 / 상세`
- program-internal `인게임 미리보기` so the real HUD can be reviewed without starting a match
- statistical baseline item tree vs current-match optimized item recommendation

See `docs/CHANGELOG_v0.15.50.txt` and `docs/AUDIT_v0.15.50.txt`.

## New-PC distribution

The representative Windows x64 bootstrap is distributed as **`ARAM_Fearless_Draft.exe`** with the ARAM app icon and a version-independent filename. Historical bootstrap/Release assets may lag behind the active manifest; the active in-app updater manifest is the authoritative distribution channel for current incremental runtime files.

See:
- `docs/README_FIRST_RUN_v0.15.33.txt` for the original clean-install bootstrap behavior
- `docs/AUDIT_CLEAN_INSTALL_v0.15.33.txt` for the clean-install foundation audit
- `docs/AI_HANDOFF.md` for current project context
- `docs/INSTALLED_BASELINE_v0.15.49.md` for the verified installed-app baseline
