# Repository continuity instructions

Before making changes, read in order:

1. `AGENTS.md`
2. `docs/CURRENT_STATE.md`
3. `update/current-state.json`
4. `update/manifest.json`
5. `docs/KNOWN_ISSUES.md`
6. `docs/AI_HANDOFF.md`

Repository state is authoritative over conversational memory. Do not reintroduce retired v0.15.103–v0.15.114 RANDOM/DATA overlay ownership. Prefer current-owner/root-cause edits over new delayed repair layers. CI success is not proof of final Windows Electron rendering. Future v0.15.120+ release activation must run `node tools/sync-current-state.js` before committing release metadata.
