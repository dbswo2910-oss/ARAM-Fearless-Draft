# v0.16 RC Physical Windows Acceptance

Status: PREPARED / NOT YET USER-PC VERIFIED

This gate is intentionally separate from production cutover. It validates the isolated RC candidate on a real Windows PC with the real League Client/LCU while preserving the stable `aram-fearless-draft` userData identity.

## Preconditions

1. Close ARAM Fearless Draft before starting.
2. Start the Riot Client / League of Legends client and stay logged in.
3. Keep the RC branch files together so `windows-physical-acceptance.ps1` and `windows-real-state-probe.js` are in the same directory.
4. The installed app must still be Golden `0.15.135` and contain the RC `canonical-shadow/src` payload.

## One-command run

From the acceptance-kit directory, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\windows-physical-acceptance.ps1
```

The harness auto-detects the installed ARAM appfiles and Electron runtime. If Electron is absent it downloads the launcher-pinned Electron `44.2.0` ZIP and verifies SHA-256 before use.

## What it verifies

- Windows host and installed package version `0.15.135`
- stable `aram-fearless-draft` userData identity
- RC `canonical-shadow/src` payload exists
- privacy-safe read of real Research IndexedDB `aram-rating-research-v03`
- Research checkpoint `checkpoint-v03` remains exactly 159 matches before and after the test
- Research checkpoint digest remains unchanged
- materialized app remains alive after an 18-second real cold start
- no fatal Electron load/index errors are logged
- real League lockfile is found
- authenticated LCU `/lol-summoner/v1/current-summoner` request succeeds
- LCU returns a PUUID field without writing its value to the report

## Privacy

The generated report deliberately excludes Riot ID, PUUID value, League lockfile password, raw match history, full userData paths, and other personal values. Only booleans, counts, versions, and SHA-256 state digests are written.

## Output

The report is written to:

`physical-acceptance-output/physical-acceptance-report.json`

Only this JSON is needed for the next approval gate. The raw stdout/stderr files remain local and should not be uploaded unless a failure requires debugging.

## Safety boundary

A SUCCESS result does **not** activate canonical owners in production, edit `main`, modify `update/manifest.json`, or remove legacy runtime files. It only completes the physical Windows + real League/LCU acceptance evidence required before any production cutover decision.
