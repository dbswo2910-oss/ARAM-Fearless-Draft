# ARAM Fearless Draft

League of Legends ARAM draft / practice / Match Lab / live in-game analysis / player coaching desktop app.

Current app/update version: **v0.15.62**  
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

## Current UI direction

v0.15.50–0.15.62 establish the compact **In-game Coach HUD**, consistent visual item language, and a denser Random Practice pick workflow:

- alive → compact LIVE decisions
- dead → automatic Build/analysis view
- respawn <= 7s → compact LIVE preparation view
- 3 visible tabs: `LIVE / 빌드 / 상세`
- program-internal `인게임 미리보기` using the same coach renderer as real LIVE
- statistical baseline item tree vs current-match optimized item recommendation
- v0.15.51 removed pick-stage noise and fixed visual hierarchy
- v0.15.52 removed duplicate/helper text and stabilized the HUD layout
- v0.15.53 added the death-time shop planner: `현재 골드 → 지금 살 부품 → 잔여 골드 → 최종 코어 목표`
- v0.15.54 cleaned up duplicate gold/source noise from a real Windows screenshot
- v0.15.55 compacted Random Practice pick TOP5 comparison
- v0.15.56 added official Data Dragon item icons to the Random Practice in-game coach
- v0.15.57 extends official item icons across every verified item-bearing user-facing menu from the installed baseline: live draft build/utility recommendations, Random Practice legacy/live build and observed inventory surfaces, Champion DB primary/alternate builds, and Match Lab recommended build direction
- v0.15.58 shows current party-held champions in the Random Practice manual-party area, labels party-held pool candidates as `팀원픽`, and fixes the cramped nested status-grid layout into a full-width `현재 조합 체크` strip. Current party picks are display-only and are never auto-written into manual locks.
- v0.15.59 makes the party-row state explicit inside the champion input itself: AutoSync-held champions show a blue `팀원픽` pill, while champions explicitly entered by the user show a green `수동고정` pill. This is UI-only and does not change recommendation scoring.
- v0.15.60 simplifies the visible party wording so both AutoSync-held and manually locked party champions display as `팀원픽` while their internal states remain distinct. It also refreshes item artwork from the latest Riot-client lol-game-data assets mirrored by CommunityDragon, with versioned Data Dragon artwork as fallback. Recommendation and shop scoring are unchanged.
- v0.15.61 is the first real-Windows follow-up for the party label: it directly derives the visible state from the actual party row instead of depending on the v0.15.59 pill.
- v0.15.62 corrects the requested **display location** after real-Windows review: the inline `팀원픽` pill inside `우리 파티 챔피언` is hidden, and `팀원픽` is shown beside the slot number in `남은 랜덤 챔피언`, matching the existing `외부픽` location. Both manual locks and AutoSync-held party picks qualify; an existing `외부픽` still takes precedence. Scoring is unchanged.

The Match Lab actual final-item row already used Riot/Data Dragon artwork in the base renderer; v0.15.60 refreshes that existing image in place rather than adding duplicate artwork.

The HUD layout is intentionally treated as **largely stabilized**. Current work should improve decision quality inside this hierarchy rather than restart a large redesign.

The shop planner uses recipe-aware Data Dragon item metadata (`ko_KR`, ARAM map 12, recipe links, combine/total gold). In real LIVE state it only gives exact component-buy instructions when currently owned components can be confirmed, avoiding unsafe duplicate-buy advice. v0.15.60 keeps that recipe/price source unchanged while using current Riot-client icon metadata for visuals; image failure falls back to versioned Data Dragon art, then text-only display.

See `docs/CHANGELOG_v0.15.50.txt` through `docs/CHANGELOG_v0.15.62.txt`.

## New-PC distribution

The representative Windows x64 bootstrap is distributed as **`ARAM_Fearless_Draft.exe`** with the ARAM app icon and a version-independent filename. Historical bootstrap/Release assets may lag behind the active manifest; the active in-app updater manifest is the authoritative distribution channel for current incremental runtime files.

See:
- `docs/README_FIRST_RUN_v0.15.33.txt` for the original clean-install bootstrap behavior
- `docs/AUDIT_CLEAN_INSTALL_v0.15.33.txt` for the clean-install foundation audit
- `docs/AI_HANDOFF.md` for current project context
- `docs/INSTALLED_BASELINE_v0.15.49.md` for the verified installed-app baseline
