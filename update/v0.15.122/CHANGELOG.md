# v0.15.122 — Riot Grade Accuracy

## Root cause

`/lol-end-of-game/v1/champion-mastery-updates` exposes the local player's primary `ChampionMasteryUpdate`, which can also include `memberGrades` for other players. The old collector recursively walked every nested object containing a `grade`, then stored every row under the local account. The match-detail UI also matched by `gameId` without requiring the played `championId`, so a teammate grade from the same game could be shown as the local player's Riot Grade.

## Fix

- Parse only direct primary ChampionMasteryUpdate rows. `memberGrades`, `levelUpList`, and arbitrary nested grade objects are never traversed.
- Stamp authoritative records with `gradeProvenance: riot-primary-update`.
- Match Riot Grade to history by local account + exact gameId + exact championId.
- Existing v0.15.121-and-earlier records are migrated to `legacy-unverified-v015121`; ambiguous multi-champion rows remain stored for recovery/audit but are excluded from authoritative display and calibration.
- Calibration snapshots and historical Riot Grade comparisons accept authoritative primary records only.
- No fallback or inferred S/A/B grade is generated when an authoritative record is unavailable.

## Unchanged

- ROLE/recommendation/Random scoring math.
- RANDOM Practice and DATA layout ownership.
- AutoSync concurrency logic and match-history fetching.
- v0.15.117 state integrity, v0.15.118 resource lifecycle, and permanent v0.15.79 safety contracts.

## Real-world acceptance

CI can prove parser/matching contracts, including a synthetic payload with conflicting teammate `memberGrades`. Final acceptance still requires comparing a newly completed real League game's client grade against the v0.15.122 match-detail Riot Grade card.
