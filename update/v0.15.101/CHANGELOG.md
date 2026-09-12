# v0.15.101 — STARTUP PACKAGE PATH HOTFIX

- Fixes the Windows startup `ENOENT` crash introduced by the v0.15.99/v0.15.100 successor wrappers.
- The updater assembles manifest files into one active overlay directory, so successor `main-v*.js` files must load their predecessor from the same directory.
- `main-v01599.js` now resolves `main-v01598.js` from the same active overlay directory.
- `main-v015100.js` now resolves `main-v01599.js` from the same active overlay directory.
- `main-v015101.js` follows the same packaged-layout contract and exists to force affected clients to download a new fixed version.
- v0.15.101 intentionally reuses `runtime-source-stability-v015100.js`; no renderer, recommendation, draft score, item score, or champion score logic changes are included.
