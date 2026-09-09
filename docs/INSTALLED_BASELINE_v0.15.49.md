# Installed Baseline — v0.15.49

Captured from the user's real Windows AutoUpdate installation on 2026-09-10.

## Why this exists

The repository historically did not contain the complete installed base UI, especially the large `index.html` and `autosync-core.js`. That made later UI patches rely too much on guesses. This baseline records what was actually installed so future AI/coding agents can use verified structure instead of inferring it from screenshots.

## Installed location pattern

The user located ARAM Fearless Draft files under `%LOCALAPPDATA%` through PowerShell. The supplied archive was the **ARAM Fearless Draft AutoUpdate** folder and contained an `appfiles/` directory plus Electron runtime files.

The important working directory is:

```text
...\ARAM Fearless Draft AutoUpdate\appfiles\
```

The full AutoUpdate ZIP is not committed because it contains the Electron runtime and large binaries. Only source/structure metadata needed for engineering is preserved here.

## Verified runtime version

- `appfiles/main.js` — `const VERSION='0.15.49'`
- `appfiles/package.json` — version `0.15.49`
- active repository updater at capture time — v0.15.49

Caution: `appfiles/manifest.json` in the installed snapshot contains older/stale metadata. Do not use it as the authoritative runtime version.

## Key file fingerprints

| File | Bytes | SHA-256 |
|---|---:|---|
| `index.html` | 35,359,059 | `8de7a8eb03e363b808439d48673a4808809d82db67bc1b7955e80414a8782906` |
| `main.js` | 14,727 | `95a9caf7991759e4a4bc4c31c08be33eacc09b3933fce5ffa29da1a2eaba897f` |
| `package.json` | 284 | `a0bb32910ebb3cb2246d015a503c09754bc6ec2a6d578941fab291cac03b5582` |
| `autosync-core.js` | 39,400 | `a9f206df445d06eefc99ae55f1ceb3a7a5ff108a40a8393fa75ec413d2c4aba6` |
| `random-practice-focus-v01549.js` | 18,137 | `56eed07a19cc0a75b8b860f405860e95d6d5fb6ae390c35084599ea694845739` |
| `draft-judgment-tabs-v01547.js` | 16,447 | `4c6f26754dbe7c1016053775f99cbddc7dc8a3563c0baaceba4b5c4f91066999` |
| `draft-risk-board-v01546.js` | 14,524 | `ef86a4325f0aeb15b0eab17f4465cfe0b1ae277755c5541cb8dd6a72f8d262d3` |
| `draft-layout-v01545.js` | 10,517 | `9a6a370cb53e41cac22d8a2ed57f31a680a3f7ed7546b82a6a22cf3bd0a4dcad` |
| `draft-live-context-v01542.js` | 18,554 | `c7893f0288dae8c2b571f48a633a1719ecd3e90f25612049c77c98b84235d4c1` |

## Installed `appfiles/` source inventory

The snapshot includes the following engineering-relevant files in addition to `index.html`:

- `autosync-core.js`
- `autosync-cc-impact-v01525.js`
- `autosync-mission-timeline-v01529.js`
- `autosync-queue-v01517.js`
- `autosync-telemetry-v01534.js`
- `brand-header-v01538.js`
- `builder-champion-pool-v01541.js`
- `catch-resilience-v01540.js`
- `cc-impact-v01525.js`
- `community-calibration-v01534.js`
- `draft-balance-alerts-v01543.js`
- `draft-judgment-tabs-v01547.js`
- `draft-layout-v01545.js`
- `draft-live-context-v01542.js`
- `draft-pick-balance-v01517.js`
- `draft-risk-board-v01546.js`
- `draft-side-order-v01540.js`
- `in-app-updater-ui-v01523.js`
- `input-interaction-stability-v01539.js`
- `item-catalog-v01527.js`
- `live-item-memory-v01520.js`
- `live-strength-v01513.js`
- `main.js`
- `match-lab-favorites-v01514.js`
- `match-lab-queue-v01517.js`
- `match-lab-replay-v01515.js`
- `mission-death-fairness-v01529.js`
- `multi-user-isolation-v01516.js`
- `package.json`
- `player-profile-data-sticky-v01521.js`
- `player-profile-v01519.js`
- `preload.js`
- `profile-ux-v01537.js`
- `random-practice-focus-v01549.js`
- `riot-grade-autosnapshot-v01533.js`
- `riot-grade-calibration-history-v01532.js`
- `riot-grade-calibration-v01531.js`
- `riot-grade-collector-v01528.js`
- `riot-grade-collector-v01532.js`
- `riot-grade-ui-v01528.js`
- `role-grade-fairs-v01515.js`
- `role-grade-v01513.js`
- `role-mastery-drilldown-v01522.js`
- `role-metric-detail-v01518.js`
- `role-profile-context-v01523.js`
- `role-profile-specialized-v01530.js`
- `time-power-v01527.js`

Most versioned patch files are already represented in `update/v*/`; this baseline is primarily for verifying what actually existed together in one installed `appfiles` directory.

## Random Practice exact base DOM

The verified base `index.html` contains:

```text
#random
  .randomModeNav
  .randomHero
    #queueSize
  #lolAutoSyncPanel
  .mobilePhaseNav
  #randomInputAnchor.grid2
    panel: external/fixed picks
      #externalInputs
      #externalCheck
      #manualPartyInputs
    panel: remaining candidates
      #poolInputs.poolGrid
  #randomRecommendAnchor.grid2
    panel: TOP5
      #comboResults
    panel: selected composition detail
      #comboDetail
  panel: analyzed five / build choice
    #randomOurFive
  summary grid
    #randomOurSummary
    #randomEnemySummary
  roles panel
    #randomRoles
```

The exact HTML fragment is preserved at:

`reference/installed-v0.15.49/random-practice-pick-fragment.html`

## Random Practice UI bug history

v0.15.48 used adaptive/heuristic DOM discovery based on headings such as `랜덤 연습`, `추천`, `다인큐`, etc. It accidentally selected/moved parent containers, producing a near-zero-width left column and Korean text wrapping vertically one character per line.

Rule for future work: **use exact IDs from this baseline.** Do not rebuild the Random Practice layout using broad title/regex matching while this baseline remains applicable.

## `autosync-core.js` behavior summary

The installed bridge confirms these important rules:

- Standard ARAM runtime analysis: queue ID 450.
- Mayhem/아수라장: queue ID 2400 / KIWI and treated separately.
- A known non-ARAM queue is not admitted merely because it uses map 12.
- League Client access is local/read-only.
- The core normalizes Riot identity, champion select, party/bench state, in-game players/stats, and ARAM match history.

## Updating this baseline later

When a user supplies a newer AutoUpdate/appfiles ZIP:

1. Verify `main.js` and `package.json` version.
2. Hash `index.html` and core files.
3. Create `docs/INSTALLED_BASELINE_vNEW.md`.
4. Create/update exact DOM fragments under `reference/installed-vNEW/`.
5. Update `AGENTS.md` and `docs/AI_HANDOFF.md` to point to the new baseline.
6. Never silently overwrite the historical baseline; keep it for regression/history.
