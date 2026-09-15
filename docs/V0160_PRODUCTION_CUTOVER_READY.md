# v0.16.0 Production Cutover Ready

This document is the final human-triggered checkpoint for PR #87. It intentionally changes no updater payload, runtime source, package source, or production manifest bytes.

## Exact tested release lineage

- Tested application commit: `e1c01b994adc09c262c16f1efbfad8530cef379f`
- Tested compact updater payload SHA-256: `6aea509133140475952348cef3eaf49db74a36c4e9da03b0aa3bc0d7a608bbd5`
- Final production manifest SHA-256: `d7636e64663ea667da4b74bfd1d31649564f3656f5e8a048ca4293596b013bbe`
- Production Candidate Gate run: `34995131586` — SUCCESS
- Post-Activation Regression run: `34995131695` — SUCCESS
- Physical Windows + real League/LCU acceptance: SUCCESS
- Physical evidence SHA-256: `34f782275d40ca023ccb88624f04286b8e5b2904ef0c0e76ad9c63153f2fa0ec`
- Research checkpoint: `159 -> 159`, digest unchanged

## Final cutover safety

- Golden rollback target remains `v0.15.135`.
- Legacy runtime removal is not authorized.
- Stable userData identity remains `aram-fearless-draft`.
- Current main ARAM build data is carried forward and checked in the synthetic merge tree.
- The final cutover workflow validates the exact merge tree and independently runs Full Regression and AI Continuity before merge.

## Non-runtime contract refresh

Commit `3a3e66b47951aac34eb1bb1cbdd57b2015864828` refreshed generated continuity snapshots and corrected Full Regression IPC duplicate classification so delivered-but-unwired canonical adapter definitions are not misclassified as simultaneous active `ipcMain.handle` registrations. The cutover-head preflight re-ran Full Regression and AI Continuity successfully after this refresh.

Production promotion is allowed only after the final PR merge-tree cutover gate is green. This document exists solely to trigger that final PR validation under the repository user's authorization rather than the GitHub Actions bot identity.
