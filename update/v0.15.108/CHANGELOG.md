# v0.15.108 — DATA PATCH MODE HARD FIX

- Fixes the remaining Data > Patch Notes bug visible in v0.15.107 where the left `역할별 티어 브라우저` could remain rendered even while the Patch Notes tab was visibly active.
- Patch mode is now determined from multiple exact signals: the Data card class, the hidden v0.15.99 tab, the visible v0.15.103 top tab, and actual Patch Notes visibility.
- Removes the failed direct-child dependency from v0.15.107. The actual tier branch is marked and hidden with descendant-safe selectors while the detail branch expands to the full Data workspace.
- Keeps tab intent explicitly while switching between `챔피언 티어리스트` and `패치노트`, preventing older layout helpers from visually reverting the page.
- Strengthens Random Practice quarantine: Data-owned nodes and empty foreign branches under `#random` are hidden so the champion tier browser cannot reserve a column or appear in Random Practice.
- No recommendation, item, champion-grade, tier-score, or balance logic is changed.

`score_logic_changed:false`
