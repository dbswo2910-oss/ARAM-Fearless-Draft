# AI Handoff Addendum — v0.15.91

## Scope

v0.15.91 is a RANDOM > 픽창 stability/fidelity follow-up to v0.15.90. It does **not** change draft/team scoring.

## User-reported regressions addressed

1. `큐 인원` label/select was visually clipped in the hero panel.
2. Windowed mode crossed the v0.15.90 1450px breakpoint and pushed the DNA rail into a full-width block, causing the approved reference composition to collapse and content to clip vertically.
3. TOP5 cards were too tall compared with the approved reference image, pushing `선택 판단` below the useful fold.
4. Clicking the champion/identity area inside the new TOP5 overlay bubbled into the historical `.combo` click path and could throw. The explicit `상세보기` button is now the supported detail interaction.
5. Changing `#queueSize` could execute the legacy inline `randomQueueChanged()` while pool/result panels were temporarily moved into the v0.15.90 reference layout. v0.15.91 removes the inline handler, temporarily restores the baseline parent structure, calls the legacy handler safely, then reapplies the reference layout.

## Layout contract

- `#randomInputAnchor` remains the exact layout root.
- >=1181px: three columns — left team state / center candidate+TOP5 / right DNA.
- 861–1180px: two columns — left team state / center candidate+TOP5, with DNA below as a compact grid.
- <=860px: single-column safe fallback.
- Hero queue selector uses explicit CSS grid areas so `큐 인원`, `#queueSize`, `#queueHint`, and reset button cannot overlap.
- TOP5 remains a maximum of five rows and is compacted to reference-like horizontal rows.
- Native duplicate TOP5 heading is hidden; the v0.15.90 custom header is the visible owner.
- Six-card `선택 판단` remains inherited from v0.15.90.

## Interaction contract

- `#queueSize` values are clamped to 1–5.
- `randomQueueChanged()` remains the underlying business-logic owner; v0.15.91 only stabilizes the DOM state around its invocation and provides a render fallback if it throws.
- TOP5 identity clicks do not invoke historical parent-row behavior; `상세보기` retains the detail path.

## Preserved behavior

- `score_logic_changed:false`
- v0.15.87 user build-route adoption remains active.
- v0.15.90 canonical champion-label normalization remains active.
- v0.15.79 transactional update/runtime safety baseline remains active.
- No new `setInterval` owner and no new `MutationObserver` are introduced.
