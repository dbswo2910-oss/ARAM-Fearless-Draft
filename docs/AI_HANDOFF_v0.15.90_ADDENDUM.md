# v0.15.90 addendum

RANDOM > 픽창 is now intentionally reference-layout owned by `runtime-source-stability-v01590.js`.

## UI ownership
- Left: external fixed picks + current composition checks + manual party locks.
- Center: remaining random candidates and the current-queue TOP5 recommendation panel in one stack.
- Right: composition DNA role-coverage rail.
- Bottom: six-card quick selection judgment dashboard.

## Important contracts
- The TOP5 engine order, scores, and descriptions are reused unchanged (`score_logic_changed:false`).
- Rank 1 is a visual `강력 추천` designation only; it does not alter the engine.
- Champion display names must go through `canonicalChampionNameV01590` when surfaced in the new pick UI. Do not return to concatenating `.names.textContent` directly.
- DNA Engage/Poke/Frontline/Sustain/CC lanes are coverage states derived from existing shortage/gap signals. They are not newly invented strength scores.
- Queue pick need is `queue size - manually locked own-party picks`; external fixed players are not subtracted from the own-party queue count.
- Preserve v0.15.79 safety lineage, v0.15.87 route adoption, v0.15.88 label dedupe, and v0.15.89 command-center lineage.
- Do not add document-wide MutationObservers or new setInterval owners.
