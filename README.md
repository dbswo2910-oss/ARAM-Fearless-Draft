# ARAM Fearless Draft

League of Legends ARAM draft / practice / Match Lab / live in-game analysis / player coaching desktop app.

Current app/update version: **v0.15.37**  
Current balance/data patch: **26.17**

This repository is used for source control, automated regression validation, incremental in-app updates, and Windows x64 distribution work.

## New-PC distribution

For a completely new Windows PC, use the **v0.15.33 standalone Windows x64 bootstrap EXE**, not the historical v0.15.9 executable. The bootstrap embeds v0.15.33, downloads the official Electron 44.2.0 Windows x64 runtime on first launch if necessary, and the app can then update in-place to the current manifest version (currently v0.15.37).

See:
- `docs/README_FIRST_RUN_v0.15.33.txt`
- `docs/AUDIT_CLEAN_INSTALL_v0.15.33.txt`

Note: historical GitHub Release assets may lag behind the current `update/manifest.json`; do not treat an older Release asset as the current app build unless its version matches the current manifest.
