# ARAM Fearless Draft Launcher 2.0.3 — cold-boot repair

This launcher is a migration/stability launcher for existing installations. It removes the stale embedded-app authority from cold boot.

Rules:
- inspect known `%LOCALAPPDATA%` ARAM Fearless Draft `appfiles` locations;
- validate `package.json` + its declared main entry;
- select the highest valid installed semantic version;
- never overwrite a newer appfiles install with an older embedded base;
- report duplicate installs and exact selected paths/hashes;
- pass launcher path/version/appdir into Electron through non-secret environment variables;
- download only the pinned Electron 44.2.0 runtime if no runtime exists;
- if no valid appfiles install exists, fail closed instead of silently resurrecting an obsolete app bundle.

This does not replace the v0.15.79 transactional in-app rollback system.
