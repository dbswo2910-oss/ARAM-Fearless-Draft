# v0.16.0 Post-Activation Regression Evidence

Candidate branch: `release/v0160-production-candidate`
Candidate commit: `e1c01b994adc09c262c16f1efbfad8530cef379f`
Production Golden remains: `v0.15.135`

## Result

`v0.16.0 Post-Activation Regression` run `34995131695`: **SUCCESS**

Core candidate regression passed:
- production Golden manifest unchanged at `0.15.135`
- canonical production-owner integration reconfirmed
- deterministic v0.16 candidate materialization
- State/Research compatibility
- behavioral differential
- AutoSync/updater/lifecycle soak
- Full Regression
- AI Continuity

Windows installed-candidate regression passed:
- deterministic v0.16 delta artifact verified
- public v0.14.2 bundle verified and restored to the validated v0.15.49 base
- Golden v0.15.135 installed tree materialized from pinned Git blobs
- exact v0.16 delta applied over that installed tree
- pinned Electron 38.7.2 verified by SHA-256
- two cold-start cycles remained alive
- stable `aram-fearless-draft` userData identity was logged
- restart persistence marker survived cycle 1 -> cycle 2
- canonical production registry remained materialized

The earlier empty-directory Windows launch failure was not a candidate runtime failure: the updater candidate is a delta and intentionally does not restate inherited files such as `index.html`. The final Windows gate therefore reconstructs an installed baseline before applying the exact candidate delta.

## Artifacts

Production runtime integration run `34995131586`:
- `v0160-production-runtime-integration`
- artifact ID `10407322067`
- SHA-256 `1043cd8f8f714b84f8e41b23160a50429ec8789e19dd5074016fc86e6952dbf4`

Post-activation run `34995131695`:
- `v0160-post-activation-core` — artifact ID `10407720421`, SHA-256 `f38cac71bbf63d67af905d691af8c6b037cb05475b91cac8b530a4188b0341d3`
- `v0160-candidate-app` — artifact ID `10407645716`, SHA-256 `47222c288f8658792108ff40907b1a6b83f4ce8e7f16617f4e651c7667c86b28`
- `v0160-post-activation-windows` — artifact ID `10407024503`, SHA-256 `0e5b5b9440624dd164a8f470fb8476fa7d17cbeb994cf3f2a376abeacb2941ff`

## Prior physical release evidence

The separate user-PC physical acceptance remains the real League/LCU and real Research checkpoint evidence:
- LCU connected / HTTP 200
- Research `159 -> 159`
- checkpoint digest unchanged
- physical evidence SHA-256 `34f782275d40ca023ccb88624f04286b8e5b2904ef0c0e76ad9c63153f2fa0ec`

The hosted Windows regression intentionally does not recreate private League or Research data; it verifies the exact candidate installed update path and restart persistence while the physical gate remains the real-data evidence.

## Safety / next boundary

This evidence does **not** itself mutate production.
- production `update/manifest.json` remains `0.15.135`
- production `main` remains unchanged
- no legacy runtime removal is authorized
- Golden v0.15.135 remains the rollback target

The next stage is the separately controlled final production transition: create/validate the production manifest cutover from the exact tested candidate, merge/promote only after a final cutover preflight, then keep legacy runtime through the probation window.
