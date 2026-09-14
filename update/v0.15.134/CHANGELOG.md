# v0.15.134

## Patch Notes DATA-owner target correction

- Fixes the v0.15.133 production-target mistake that sent the Patch Notes shell-header transform to `input-interaction-stability-v01539.js` instead of the actual DATA owner source.
- Applies the shell-header state change directly inside `ui-stability-baseline-v015115.js` through the existing runtime-source patch pipeline.
- In Patch Notes mode the generic `챔피언 상세 / 닫기` title row is hidden with inline `display:none!important`; switching back to the Champion Tier List restores the original title.
- Adds a release audit that runs `patchRuntimeSource('ui-stability-baseline-v015115.js', realSource)` so a wrong runtime target cannot pass via an isolated helper fixture again.
- No Draft/RANDOM/role/item scoring, AutoSync ownership, Research rating formula, or persistent-state ownership changes.
