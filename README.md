# ARAM Fearless Draft

League of Legends ARAM draft / practice / Match Lab / live in-game analysis / player coaching desktop app.

Current app/update version: **v0.15.41**  
Current balance/data patch: **26.17**

This repository is used for source control, automated regression validation, incremental in-app updates, and Windows x64 distribution work.

## New-PC distribution

The representative Windows x64 bootstrap is distributed as **`ARAM_Fearless_Draft.exe`** with the ARAM app icon and a version-independent filename. The current representative package embeds the v0.15.39 application baseline and can update in-place through the app updater to the current manifest version (currently v0.15.41).

Older historical bootstrap/Release assets may lag behind the active manifest. Do not treat an older versioned EXE or GitHub Release asset as the current app unless its version matches the current manifest.

See:
- `docs/README_FIRST_RUN_v0.15.33.txt` for the original clean-install bootstrap behavior
- `docs/AUDIT_CLEAN_INSTALL_v0.15.33.txt` for the clean-install foundation audit
- `docs/CHANGELOG_v0.15.41.txt` for the current update
- `docs/AUDIT_v0.15.41.txt` for the current validation scope
