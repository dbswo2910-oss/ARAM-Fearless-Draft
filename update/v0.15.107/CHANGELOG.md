# v0.15.107 — DATA / RANDOM VIEW BOUNDARY + RANDOM PICK REPAIR

- Fixes the Data > Patch Notes layout so Patch Notes owns the Data workspace instead of remaining beside the champion tier browser.
- Removes the old cross-view heuristic layout ownership: Data panel discovery is now scoped to the exact `#dataCard` view before any tier/detail layout class is applied.
- Prevents Data champion-tier UI from leaking into Random Practice; obviously foreign Data surfaces inside `#random` are quarantined rather than allowed to participate in the Random layout.
- Rebuilds Random Practice pick layout only from exact installed IDs: `#externalInputs`, `#poolInputs`, `#comboResults`, `#comboDetail`, and `#rpPickIntelV01589`.
- Improves Random Practice responsive layout: wide screens use input / candidates+TOP5 / DNA+detail columns, medium windows use two columns with analysis below, and narrow windows collapse to one column.
- Preserves the v0.15.106 TOP5 whole-card selection, visible AD/AP detail, existing candidate handlers, AutoSync state, recommendation logic, and item logic.
- Keeps the v0.15.79 permanent safety baseline and the v0.15.106 independent late-runtime activation strategy.

`score_logic_changed:false`
