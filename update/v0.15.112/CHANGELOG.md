# v0.15.112 — RANDOM WORKSPACE STABILITY

Screenshot/video-confirmed repair for Random Practice.

- Hard-isolates PICK UI from IN GAME mode so `#randomInputAnchor` and every `.randomPickOnly` surface cannot remain visible after switching to IN GAME.
- Rebuilds the PICK workspace from verified exact IDs only: `#externalInputs`, `#poolInputs`, `#comboResults`, `#comboDetail`, `#rpPickIntelV01589`.
- Makes the PICK layout visibly cleaner: left team input, center candidate/TOP5 stack, right one-column decision rail.
- Pre-creates/reuses the right rail and DNA host before first paint, preventing the video-confirmed two-column-then-reflow jump.
- Keeps Combination DNA and selected-composition detail readable and stable; no auto-fit two-column collapse.
- Does not change recommendation, scoring, champion evaluation, item logic, DATA, or IN GAME analysis calculations.

`score_logic_changed:false`
