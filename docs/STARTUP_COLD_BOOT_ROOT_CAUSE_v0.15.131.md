# v0.15.131 Startup / cold-boot root-cause record

## Proven boot split

The distributed `ARAM_Fearless_Draft.exe` is an outer bootstrap launcher. Historical distribution docs and recovery tooling place the mutable Electron application under LocalAppData `...AutoUpdate.../appfiles`. The active Electron updater downloads `update/manifest.json`, stages files, writes the installed targets under its own `__dirname`, then calls `app.relaunch()`.

Therefore two paths exist:

1. **warm update path:** running Electron → patch `appfiles` → `app.relaunch()` → patched `appfiles` starts;
2. **cold path:** user exits → double-clicks outer EXE → outer launcher chooses/prepares an app directory → Electron starts.

A defect that appears only on path 2 cannot be explained by a renderer version label alone. The user-observed exact resurrection target, **v0.15.126**, is additionally significant because v0.15.127 is the first release that injected one-shot startup auto-update behavior. A cold launch resurrected to 126 therefore stays visibly old until the user manually updates again.

## What v0.15.79 safety does and does not do

The transactional safety layer snapshots touched files before an update. A matching applied pending version enters heartbeat probation. It rolls back only when that updated version previously booted abnormally, produced a classified hang, or persisted a safety failure. Twelve fresh main+renderer heartbeat samples promote the new version to `last-known-good.json` and clear pending state.

There is no tracked unconditional `restore v0.15.126 on every launch` branch. Case C/E fixtures in the v0.15.131 audit exercise rollback and promotion directly.

## Root cause boundary

The root cause is **split boot authority**: a successful in-app update changes the mutable Electron `appfiles`, but a full cold launch first goes through a separately distributed bootstrap launcher. An obsolete/stale launcher/base or duplicate installation can select/recreate v0.15.126 and thereby override the apparent success of the warm update.

The current Launcher 2.0.2 source and the user's exact EXE bytes are not tracked in `main`, so it is not possible to truthfully attribute the resurrection to one exact old-launcher source line from repository evidence alone. v0.15.131 deliberately records the exact executable, selected app directory/version, hashes, duplicate installs, pending/LKG/rollback state on the user machine to close that last machine-specific proof gap.

## Fix

Launcher 2.0.3 removes an embedded-old-base as a cold-boot authority. It validates known LocalAppData `appfiles` candidates and always chooses the highest valid semantic version. It never replaces a newer valid installed app with an older embedded app. If there is no valid installed app, it fails closed instead of resurrecting a stale bundle. It also logs the precise launcher/appfiles choice and passes that information into Electron.

The active v0.15.131 manifest requires Launcher 2.0.3 and SHA-pins every incremental update file. The v0.15.79 safety system is preserved unchanged.

## Acceptance boundary

CI can prove selection, semver, duplicate detection, manifest SHA integrity, rollback, and heartbeat promotion. Final closure still requires the user's Windows machine: same Launcher 2.0.3 EXE, one update to v0.15.131, then three complete exit-and-cold-launch cycles with diagnostics showing 0.15.131 from the first screen each time.
