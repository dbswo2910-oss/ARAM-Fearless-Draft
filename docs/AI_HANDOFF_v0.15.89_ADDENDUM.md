# AI Handoff Addendum — v0.15.89

## Scope

v0.15.89 is a RANDOM pick-side UI successor. It intentionally does not change draft/champion scoring or the v0.15.87 item route-adoption policy.

## New visible contract

- RANDOM > 픽창 keeps the exact installed v0.15.49 IDs and existing behavior.
- Wide desktop layout uses three columns inside `#randomInputAnchor`: team/current-state input, remaining-random pool, and a compact composition-intel rail.
- The composition-intel rail is `#rpPickIntelV01589` and is created only under exact `#randomInputAnchor`.
- It reports factual state derived from exact existing hosts:
  - fixed-pick progress from `randomState.manual` plus committed `#externalInputs`
  - candidate readiness from committed `#poolInputs`
  - AD/AP and recommendation state from exact `#externalCheck .randomCheckGrid > .checkCard`
  - existing composition-gap chips from `#externalCheck .rpCheckChipV01558`
  - current TOP1 label/reason from the existing `topCombo()` path
- TOP5 receives visual ranking only; underlying `#comboResults` generation/scoring is untouched.
- `선택 판단` still uses the existing v0.15.49 tab shell; v0.15.89 only restyles it.

## Safety / regression rules

- `score_logic_changed:false`
- no new `setInterval`
- no new `MutationObserver`
- keep v0.15.88 TOP1 label dedupe active
- keep v0.15.87 item recommendation/route adoption intact
- keep v0.15.79 transactional update/runtime safety lineage explicit

## Responsive behavior

- large desktop: 3-column pick input + intel rail
- medium: original two main columns, intel spans full width below them
- narrow: single column

## Real-session validation focus

After update, verify that AutoSync/current picks, manual locks, `팀원픽` candidate labels, external-pick precedence, candidate inputs, TOP5 calculation, and quick-judgment tabs all retain their pre-v0.15.89 behavior while the new visual hierarchy is active.
