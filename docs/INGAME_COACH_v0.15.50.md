# In-game Coach HUD v0.15.50 — Phase 1

## Purpose

The in-game Random Practice screen must optimize for a user who is actively playing and has only ~1–2 seconds to look away from the game.

The UI therefore separates **combat-time information** from **dead-time analysis**.

## State machine

| Life state | Default tab | Primary purpose |
|---|---|---|
| Alive | LIVE | Immediate action |
| Dead, respawn > 7s | Build | Purchase + next-fight analysis |
| Dead, respawn <= 7s | LIVE | Respawn preparation |

AUTO can be disabled if the user wants manual tab control.

## Visible tabs

- LIVE
- Build
- Detail

The older 5-tab shell remains in the installed base UI for compatibility, but v0.15.50 hides it by exact `#randomIngameShell` selector and renders the new coach layer above it.

## LIVE information budget

Default maximum:

1. NOW CALL
2. highest threat
3. my role/action, one line
4. next item TOP1
5. matchup + one important warning (only if meaningful)

No duplicate topbar + summary cards.
No average level / average item-value metrics in the default combat view.
No long threat cards in the default combat view.

## Build view

The Build view compares two concepts explicitly:

- Statistical baseline: champion DB `item['기본 트리']` + `item['통계 기준']`
- Current-match optimization: current LIVE item engine TOP1 + alternatives

Do not label the statistical baseline as a live LOL.PS fetch. The embedded DB may contain LOL.PS/MetaSRC cross-validation metadata; display that metadata as stored.

## Detail view

Secondary information is preserved behind collapsed sections:

- enemy threat TOP5
- detailed fight steps
- power / level / item-value / alive state

This keeps existing analysis accessible without competing with the combat HUD.

## Preview

The `인게임 미리보기` button is part of Random Practice and works without a League game.

Synthetic preview controls:

- life: alive / dead 23s / respawn 5s
- scenario: even / advantage / disadvantage / enemy carry fed
- role: tank / ADC / mage / support / bruiser

Preview must use the same render functions as real LIVE and must show `PREVIEW · 실제 게임 데이터 아님`.

## Phase 2 candidate: external statistical build refresh

The next phase can investigate a robust cached source refresh (LOL.PS and/or other public ARAM statistics) outside the real-time game loop.

Preferred architecture:

1. Fetch/update statistics periodically or per patch, not every live HUD render.
2. Cache per champion/patch.
3. Keep source date/patch and fallback to embedded DB.
4. Never block the in-game HUD on a website response.
5. Preserve `statistical baseline` vs `current-match optimization` separation.
