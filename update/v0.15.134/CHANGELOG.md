# v0.15.134

## Patch Notes shell-title topology correction

- v0.15.133 targeted the intended combined runtime file, but its follow-up helper inferred the shell title from the `#dataCard` ancestor chain and missed the live Windows layout where the generic title can be a separate panel under the resolved detail branch.
- v0.15.134 keeps the existing DATA single-owner pipeline and patches the exact `title` object already resolved by `ui-stability-v015115` `syncData()`.
- In Patch Notes mode the generic `챔피언 상세 / 닫기` title row is hidden with inline `display:none!important`; switching back to the Champion Tier List restores the original title.
- The release audit now runs the real raw `input-interaction-stability-v01539.js` source through `patchRuntimeSource(...)` and verifies the resolved-title transform, so an isolated helper fixture cannot hide a production-path miss again.
- No Draft/RANDOM/role/item scoring, AutoSync ownership, Research rating formula, Research storage, or persistent-state ownership changes.
