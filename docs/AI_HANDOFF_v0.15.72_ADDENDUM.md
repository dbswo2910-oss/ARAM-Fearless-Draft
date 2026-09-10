# AI Handoff v0.15.72 Addendum

## Latest user signal
The remaining freeze reproduces during Random Practice interaction even when no League game is active. Discord/OP.GG removal temporarily improved responsiveness but did not eliminate the app-side issue. Treat external overlays as possible amplifiers, not the primary explanation.

## Root runtime findings
Random Practice accumulated multiple independent decorators. v0.15.49, v0.15.55, v0.15.58, and v0.15.68 each had overlapping observer/listener refresh ownership. A single Random render could therefore cause additional cosmetic refresh cascades. Separately, updater UI and player-profile sticky code used application-wide DOM observation/scanning despite belonging to narrow surfaces.

The installed base `runRandomCombos()` also computes exhaustive combinations synchronously. With 15 candidates and a five-player selection that is C(15,5)=3003 scored teams in one renderer turn, which can visibly stall Electron even though exhaustive search itself is a valid product requirement.

## v0.15.72 architecture
- Preserve the installed/base recommendation math and exhaustive candidate semantics.
- `runtime-random-practice-v01572.js` becomes the single Random Practice maintenance coordinator.
- Historical v49/v55/v58/v68 compatibility files still expose their public refresh APIs but do not install overlapping recurring observers/pollers/document-wide Random listeners.
- TOP5 exhaustive enumeration is cooperative/time-sliced; only the best five rows are retained while iterating, with the same score/tie comparator.
- Random analysis/details are coalesced/deferred in pick view.
- AutoSync v0.15.71 forwards meaningful state changes into the coordinator; no new Random polling loop is introduced.
- Party/current-pick display is preserved, including team-minus-external fallback when AutoSync party detail is incomplete. Current party display does not mutate `randomState.manual`.
- `in-app-updater-ui-v01523.js` binds directly to stable `#topUpdateBadge`; no whole-document MutationObserver or broad layout scan.
- `player-profile-data-sticky-v01521.js` observes only `#data` and exits when Data is inactive; no `document.body` observer.

## Invariants
- score_logic_changed:false
- no change to teamScore/recommendation/item/threat/purchase formulas
- external picks retain exclusion/visual precedence
- current party picks remain display-only unless manually locked
- v0.15.70 Random In-game single-owner remains in place
- v0.15.71 live AutoSync transport governor remains in place

## If a real Windows freeze remains
Do not add another blind overlay. Capture `window.aramRandomPracticeRuntimeV01572.getStats()` if DevTools access is available and compare whether `maxTaskMs`/`comboBusy` spike before the stall. Next isolate Chromium compositor/GPU vs renderer-JS using the existing `ARAM_DISABLE_HARDWARE_ACCELERATION=1` diagnostic switch.
