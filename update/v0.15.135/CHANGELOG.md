# v0.15.135

## Patch Notes shell — real Windows follow-up

Real Windows v0.15.134 still showed the generic `챔피언 상세 / 닫기` shell row above otherwise-correct Patch Notes content.

This release keeps the existing `ui-stability-v015115` DATA owner and the existing `input-interaction-stability-v01539.js` combined runtime target. It does not add a competing presentation owner.

The follow-up no longer assumes one DOM topology or one pre-resolved `.title` node. While DATA is in Patch Notes mode, the existing owner now performs a tightly scoped semantic sweep under `#data` for a small shell header containing `챔피언 상세` plus a `닫기` button, while excluding the Patch Notes body/nav. Only matched rows are tagged and hidden; only tagged rows are restored in tier-list mode.

A child-list observer on the DATA view re-applies the same narrow sweep if the base renderer replaces/recreates nodes after `syncData()`. This avoids the v0.15.134 failure mode where the visible Windows shell survived despite source-level title patching.

No Draft/RANDOM/role/item scoring, AutoSync ownership, Rating calculations, Research storage, or persistent-state ownership changes.

Final acceptance still requires a real Windows screenshot after updating to v0.15.135.
