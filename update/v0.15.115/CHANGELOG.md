# v0.15.115 — Single-Owner UI Stability Baseline

This release is a stabilization reset, not another visual overlay.

- RANDOM PICK runtime branches from the last pre-overlay v0.15.100 lineage so the v0.15.103–v0.15.114 late DOM-repair stack no longer competes for the same nodes.
- The proven v0.15.90/v0.15.100 PICK layout, candidate selection, candidate DNA preview, ranking and scoring remain the active RANDOM owner.
- One final v0.15.115 UI stability layer owns DATA boundaries, patch-note presentation, mode isolation and runtime ownership diagnostics without reparenting RANDOM nodes.
- Retires the active standalone UI hotfix files from v0.15.103, v0.15.105–v0.15.114 that were responsible for delayed click/change/input repair races.
- Adds a single-owner audit that rejects legacy overlay markers in the final RANDOM payload, duplicate v0.15.115 injection, missing Data Hub lineage, manifest install/delete conflicts, and reintroduced delayed UI-repair loops.
- Keeps the v0.15.79 permanent safety/main-process lineage and all scoring/item/recommendation math unchanged.
- Post-activation validation is intentionally triggered from the activated main state so the full workflow suite audits the final v0.15.115 manifest, not only the pre-activation PR state.

`score_logic_changed:false`  
`random_scoring_changed:false`
