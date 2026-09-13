# ARAM Rating Research UI v0.1

Local-only presentation layer for the ARAM Rating research work. This directory is intentionally **not** referenced by the production updater manifest. It is loaded manually in DevTools and mounts one research card inside the existing player profile without replacing the production profile, history, AutoSync, RANDOM, DATA, item, or updater owners.

## Architecture

```text
Phase B Research Dataset (IndexedDB checkpoint-v03)
        ↓
Rating Engine v0.1
        ↓
Latest Rating Run (IndexedDB rating-ui-latest-run-v01)
        ↓
Player State by canonical PUUID / local internal player id
        ↓
Player Profile Research UI
```

The renderer never invents a rating from the currently visible match history. Ratings are rebuilt from the local research checkpoint, stored as a latest run, and then read by the UI. A refresh only rebuilds from local IndexedDB; it does not call League history or any external data source.

## Profile layout

```text
Player Profile
└─ ARAM 실력 분석 · RESEARCH
   ├─ dataset sample / data confidence / repeat-observation quality
   ├─ research gate status
   ├─ Elo | Glicko-family | TrueSkill-family
   ├─ observations / last update / uncertainty / recent trend
   ├─ dataset mini status
   └─ 상세 분석
      ├─ Frozen model metrics: Log Loss / Brier / ECE / Accuracy
      ├─ 50% / historical WR / recent WR baselines
      ├─ Frozen + Walk-forward cold-start
      ├─ Phase B dataset/network status
      └─ collection phase/status/progress/sampling version
```

Current research rules are preserved. If the gate is `insufficient_real_data` or `no_clear_winner`, there is no single final ARAM Rating. All three model states remain visible in parallel. A future `candidate_winner` can be promoted by the same UI structure without changing the storage contract.

## Confidence / empty states

- Player not present in the latest research run: `분석 데이터 없음`; no default 1500 is shown as a real rating.
- 1–2 observations: `표본 부족`, with model values visually muted.
- Confidence uses personal observations, model uncertainty, global match count, frozen cold-start, and network sparsity. A sparse global dataset caps confidence rather than allowing a heavily observed individual to look final.
- Research load failure: `Research data unavailable`; production history/profile functions are not replaced and continue independently.

## Local feature flag

The loader stores:

```text
localStorage["aram_rating_research_ui_enabled_v01"]
window.ARAM_RATING_RESEARCH_UI
```

The UI is research-only and carries a visible `RESEARCH` badge plus the disclaimer that it is not Riot official MMR/rank.

## Load in the local app

Open the desktop app and DevTools Console, then run:

```js
fetch('https://raw.githubusercontent.com/dbswo2910-oss/ARAM-Fearless-Draft/research/aram-rating-ui-v01/research/aram-rating-ui-v01/research-ui-devtools.js?ts='+Date.now()).then(r=>r.text()).then(code=>(0,eval)(code))
```

Then open/search a player profile. The card mounts directly after the existing profile hero.

Developer actions:

```js
aramRatingResearchUIV01.status()   // local status
aramRatingResearchUIV01.refresh()  // rebuild from local checkpoint only
aramRatingResearchUIV01.disable()  // remove/disable research card
aramRatingResearchUIV01.enable()   // re-enable in this renderer
```

Because this is deliberately absent from the production manifest, restart/reload of the app requires loading the helper again. There is no data-collection start button in this UI; Phase B collection remains in its existing DevTools research helper.

## Tests

`research-ui-core.test.js` covers:

- Player A: 20+ observations -> three research ratings are rendered.
- Player B: 1 observation -> `표본 부족` and muted model values.
- Player C: missing from Research DB -> `분석 데이터 없음` and no fake default rating.
- Future candidate winner -> `PRIMARY MODEL` promotion path.

`research-ui-failsafe.test.js` forces the research loader to fail and verifies that production profile/history functions remain untouched.

CI also runs the v0.3 research safety checks plus the current production regression owners for profile/history, AutoSync, RANDOM, DATA, item recommendation, state/resource/update safety, and AI continuity.
