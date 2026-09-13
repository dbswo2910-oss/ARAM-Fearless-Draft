# v0.15.117 — Persistent State Integrity

This release protects locally persisted app state without changing scoring or UI ownership.

- Adds a bounded atomic JSON store under the app user-data directory. Writes use a same-directory temporary file, fsync, replacement verification, and a last-known-good backup.
- Adds corruption quarantine and recovery for state mirrors. A broken primary mirror is restored from the validated backup instead of being silently replaced with empty state.
- Adds renderer localStorage protection for app-owned `aram_` keys. Known state schemas are validated, malformed writes are rolled back to the previous known-good value when possible, intentional removals are tombstoned, and missing/malformed values can be recovered from a separate disk mirror.
- Protects the persisted Riot Grade history (`riot-grade-v01528.json`) with an independent last-known-good copy. Existing collector behavior and scoring use remain unchanged.
- Makes the state-integrity renderer/bridge part of the critical runtime readiness gate, so an incomplete v0.15.117 install is treated as an update-safety failure instead of silently running half-enabled.
- Preserves the v0.15.115 single-owner RANDOM/DATA UI baseline and the v0.15.116 updater/rollback baseline.

`score_logic_changed:false` · `random_scoring_changed:false`
