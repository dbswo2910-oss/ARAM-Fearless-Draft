# v0.15.133 — Real-Windows Patch Notes Shell Fix + Continuity Cleanup

- Fixes the real Windows DATA > Patch Notes case where the outer `챔피언 상세 / 닫기` shell row remained visible on v0.15.132.
- Keeps the existing `ui-stability-v015115` DATA owner; no new UI overlay owner is added.
- Walks only the resolved `#dataCard` ancestor chain and hides the generic shell title with inline `display:none!important` in Patch Notes mode, then restores it in Champion Tier List mode.
- Adds a nested-DOM regression fixture reproducing the topology that v0.15.132 source-only assertions missed.
- Records real-Windows confirmation that v0.15.132 restores the 159-match Research checkpoint and no longer cold-boots back to an older version.
- Advances the next planned development line to an ARAM Rating v0.3.1 rebase from the current mainline.
- Draft/RANDOM/ROLE/item scoring, Rating calculations, AutoSync behavior, and persistent-state ownership are unchanged.
