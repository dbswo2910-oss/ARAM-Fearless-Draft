# ARAM Fearless Draft — AI / Coding Agent Entry Point

Read this file before editing the repository.

## Current source of truth

1. `update/manifest.json` — active in-app update channel and current distributed runtime files.
2. `docs/INSTALLED_BASELINE_v0.15.49.md` — verified snapshot of the user's real Windows installation captured from `ARAM Fearless Draft AutoUpdate/appfiles`.
3. `reference/installed-v0.15.49/random-practice-pick-fragment.html` — exact installed DOM fragment for the Random Practice pick screen. Use this instead of guessing selectors from visible Korean labels.
4. `docs/AI_HANDOFF.md` — architecture, recent decisions, UI philosophy, and work-in-progress context.
5. `update/v*/` — versioned patch sources. Older versions are historical; do not treat an old update directory as current just because it exists.

## Critical rules

- Never infer the installed UI structure from screenshots alone when a baseline/DOM map is available.
- For UI patches, prefer exact IDs/classes from the installed baseline. Avoid broad text/regex DOM discovery that can accidentally capture parent panels. This caused the v0.15.48 Random Practice layout collapse.
- `index.html` is the large embedded base UI. The captured v0.15.49 file is 35,359,059 bytes, SHA-256 `8de7a8eb03e363b808439d48673a4808809d82db67bc1b7955e80414a8782906`. The full file is not committed here because of its size; important exact DOM fragments and hashes are preserved under `reference/installed-v0.15.49/` and `docs/`.
- The user's installed `appfiles/manifest.json` may be stale. For the captured v0.15.49 install, `main.js` and `package.json` are both v0.15.49 while the local appfiles manifest still contains older metadata. Runtime version must be verified from `main.js` / `package.json` and the active repository `update/manifest.json`.
- Keep app version, update manifest, package metadata, changelog/audit docs, and README version references synchronized when releasing a new version.
- Preserve recommendation/balance logic when a request is UI-only. Explicitly document whether scoring changed.
- Before reporting a GitHub update as complete, wait for the Full Regression Audit to finish and verify the relevant new audit step is `success`.
- If a new real installed-app ZIP is provided, treat it as the newest baseline, create a new `docs/INSTALLED_BASELINE_vX.Y.Z.md` + `reference/installed-vX.Y.Z/` map, and update this file.

## Current product/UI direction

The product is being simplified around fast decisions rather than vertically stacking every detail.

- Draft: compact two-column workflow; pick judgment uses tabs rather than endlessly stacked cards.
- Pick judgment tabs: summary / risk detection / composition matchup.
- Risk system includes value, poke, dive, hard engage, catch/CC, frontline handling, sustain, and AoE teamfight risk.
- Random Practice: inputs first, TOP recommendations clearly prioritized, detailed analysis behind tabs/collapse controls.
- Recommendation engines should not repeatedly overreward a small set of champions through duplicated synergy signals; duo/route/structure overlap is intentionally damped.

## Random Practice exact installed IDs (v0.15.49 baseline)

Primary root and controls:

- `#random`
- `#queueSize`
- `#lolAutoSyncPanel`
- `#randomInputAnchor`
- `#externalInputs`
- `#externalCheck`
- `#manualPartyInputs`
- `#poolInputs`
- `#randomRecommendAnchor`
- `#comboResults`
- `#comboDetail`
- `#randomOurFive`
- `#randomOurSummary`
- `#randomEnemySummary`
- `#randomRoles`

See `reference/installed-v0.15.49/random-practice-pick-fragment.html` before changing Random Practice layout.
