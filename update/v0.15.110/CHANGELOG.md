# v0.15.110 — Patch Notes Champion Density Hotfix

Screenshot-confirmed UI hotfix for DATA > Patch Notes.

- Restores compact champion portraits inside the Patch Notes champion-change grid.
- Locks Patch Notes portraits to 46×46 px and prevents global image/card styles from stretching them.
- Uses a denser 6-column desktop grid with responsive fallbacks.
- Keeps the fix strictly scoped under `#dataPatchNotesV01599 #dh99ChampionGrid` so DATA tier cards, RANDOM Practice, scoring, items, grades, and recommendation logic are unchanged.
- Preserves v0.15.109 visual-polish behavior and the v0.15.79 safety baseline lineage.

`score_logic_changed:false`
