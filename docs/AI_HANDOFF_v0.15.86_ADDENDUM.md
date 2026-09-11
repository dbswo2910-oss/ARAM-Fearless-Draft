# v0.15.86 AI handoff addendum

The IN GAME Build tab is now intentionally separate from the LIVE command-center page.

## UI contract
- Primary comparison: `통계 사이트 기본 빌드` vs `현재 상황 최적 빌드`.
- Keep `.riBuildCompare`, `.riBuildCard.opt`, `.riBuildMain`, and `.riRespawnStrip` for legacy shop/planner compatibility.
- Purchase planner mounts into `.ri86ShopSlot` when available.
- Current inventory, purchase priority, component recipe, situational pivots, deviation reasons, and one-line conclusion belong to Build.

## Logic contract
- v0.15.81 remains the recommendation-policy owner.
- v0.15.86 does not alter pick/draft scoring or item recommendation scores; it presents existing recommendation outputs with more context.
- New item images use current catalog `iconPrimaryUrl` only.
- Do not add a new polling loop or MutationObserver.

## Safety lineage
v0.15.86 -> v0.15.85 -> v0.15.84 -> v0.15.83 -> v0.15.82 -> v0.15.81 -> v0.15.80 -> v0.15.79 SAFETY BASELINE.
