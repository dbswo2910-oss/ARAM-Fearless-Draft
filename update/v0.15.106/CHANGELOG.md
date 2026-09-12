# v0.15.106 — RANDOM/DATA UI RUNTIME ACTIVATION FIX

- Fixes the case where v0.15.105 installs and the app launches but none of its visible UI changes appear.
- Keeps the v0.15.105 RANDOM TOP5/DNA and Data > Patch Notes goals, but no longer relies on one transformed `random-practice-focus` payload to activate the UI layer.
- Adds redundant late-runtime activation through both `brand-header-v01538.js` and `input-interaction-stability-v01539.js`; the UI IIFE remains idempotent.
- Restores whole-card TOP5 selection with a fallback path when the historical candidate-preview handler does not update the selected candidate.
- Restores visible per-row AD/AP percentages and split bars while preserving existing score, badges, description, and detailed button behavior.
- When Data > Patch Notes is active, hides the champion-tier pane and lets patch notes own the available workspace with a rebalanced main/side ratio.
- Adds a runtime-visible `data-aram-ui-patch="0.15.106"` marker for installed-effect auditing.
- No scoring, recommendation, item, champion-grade, or balance logic is changed.
- Preserves the v0.15.79 safety baseline and v0.15.104 startup-safe lineage.

`score_logic_changed:false`
