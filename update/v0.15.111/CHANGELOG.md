# v0.15.111 — RANDOM DNA Right-Rail Repair

Screenshot-confirmed layout hotfix for RANDOM > 완결.

- Fixes `선택 조합 상세` and `조합 DNA` being squeezed into two tiny columns.
- Uses the right rail's actual width with `auto-fit/minmax(260px, 1fr)`: narrow rail becomes one readable column, wide row can use two.
- Restores readable Korean wrapping and metric text in the selected-composition detail panel.
- Keeps DNA compact but readable and preserves all recommendation/scoring/item logic.
- Does not change DATA, Patch Notes, match logic, grades, or champion evaluation.
- Preserves the v0.15.79 safety baseline lineage.

`score_logic_changed:false`
