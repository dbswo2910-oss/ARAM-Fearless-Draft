# AI Handoff Addendum — v0.15.83 IN GAME Champion Visuals

## Purpose
v0.15.83 is a visual-only successor of v0.15.82. It adds champion portraits to the IN GAME command center and preview so the player can identify targets and teammates faster without reading every name.

## Visual rules
- Reuse the existing global `championIconHtml(name, 'mini')` renderer already used by champion-pool UI.
- Do not add another champion-image polling loop or separate image service.
- Champion images supplement text; names/instructions remain visible if an image cannot render.
- Use a large portrait for the local champion, medium portraits for Threat TOP3, and small portraits for inline target names and team-composition strips.
- Live and Preview must use the same renderer.

## IN GAME surfaces changed
- `현재 판단`: compact portraits for current priority threats.
- `내 플레이`: local champion portrait/name plus portrait-aware action instructions.
- `위협 TOP3`: portrait per threat row.
- `한타 현황`: ally/enemy team-composition portrait strips with LIVE power, alive count, gold, and local life state.
- `사망/빌드`: local champion and highest-threat portraits in the return plan.

## Invariants
- Preserve `.riBuildCompare`, `.riBuildCard.opt`, `.riBuildMain`, and `.riRespawnStrip` so the v0.15.53 recipe-aware purchase planner continues to attach correctly.
- Preserve v0.15.81 `buildGateV01581` item recommendation policy.
- Preserve v0.15.82 command-center hierarchy/classes required by historical audits.
- No new `setInterval` or `MutationObserver` in the v0.15.83 source layer.
- `score_logic_changed:false`
- `item_recommendation_logic_changed:false`
- `champion_visuals_changed:true`

## Validation
`tools/ingame-visuals-v01583-audit.js` performs static and VM render checks. The VM stubs `championIconHtml` and verifies portraits render for the local champion, Threat TOP3, inline action targets, ally/enemy rosters, and death-return guidance. Historical v0.15.82/v0.15.81 audits and Full Regression must also remain green before merge.
